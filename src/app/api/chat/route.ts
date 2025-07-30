import { NextRequest, NextResponse } from 'next/server';
import { EventPlanningAgent } from '@/lib/ai-agent';
import { createMessage, getEventMessages, updateEventSchedule } from '@/lib/db';
import { ChatRequest } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, eventId, context } = body;

    if (!message || !eventId) {
      return NextResponse.json(
        { error: 'Message and eventId are required' },
        { status: 400 }
      );
    }

    // Get recent messages for context if not provided
    let previousMessages = context?.previousMessages || [];
    if (previousMessages.length === 0) {
      previousMessages = await getEventMessages(eventId);
      // Limit to last 10 messages for context
      previousMessages = previousMessages.slice(-10);
    }

    // Initialize AI agent
    const agent = new EventPlanningAgent();

    // Process the chat request
    const aiResponse = await agent.processChat({
      message,
      eventId,
      context: {
        previousMessages,
        currentSchedule: context?.currentSchedule,
      },
    });

    // Note: In production, you should verify the user authentication
    // and get user info from the JWT token or session
    
    // Save user message to database
    await createMessage({
      eventId,
      userId: 'user-temp', // This should come from authenticated user
      userDisplayName: 'User', // This should come from authenticated user
      content: message,
      type: 'user',
    });

    // Save AI response to database
    await createMessage({
      eventId,
      userId: 'assistant',
      userDisplayName: 'AI Assistant',
      content: aiResponse.message,
      type: 'assistant',
    });

    // Update event schedule if AI provided one
    if (aiResponse.schedule && aiResponse.schedule.length > 0) {
      await updateEventSchedule(eventId, aiResponse.schedule);
    }

    return NextResponse.json(aiResponse);

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 