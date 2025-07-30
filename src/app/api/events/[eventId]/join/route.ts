import { NextRequest, NextResponse } from 'next/server';
import { addParticipantToEvent, getEvent } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await request.json();
    const { userId } = body;

    if (!eventId || !userId) {
      return NextResponse.json(
        { error: 'Event ID and User ID are required' },
        { status: 400 }
      );
    }

    // Check if event exists
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if user is already a participant
    if (event.participants.includes(userId)) {
      return NextResponse.json(
        { message: 'User is already a participant in this event' },
        { status: 200 }
      );
    }

    // Add participant to event
    await addParticipantToEvent(eventId, userId);

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the event'
    });

  } catch (error) {
    console.error('Join Event API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}