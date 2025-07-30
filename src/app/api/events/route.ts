import { NextRequest, NextResponse } from 'next/server';
import { createEvent, getUserEvents } from '@/lib/db';
import { Event } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, createdBy } = body;

    if (!title || !description || !createdBy) {
      return NextResponse.json(
        { error: 'Title, description, and createdBy are required' },
        { status: 400 }
      );
    }

    const eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'> = {
      title,
      description,
      createdBy,
      participants: [createdBy], // Creator is automatically a participant
      isActive: true,
      schedule: [],
    };

    const eventId = await createEvent(eventData);

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: 'Event created successfully'
    });

  } catch (error) {
    console.error('Create Event API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const events = await getUserEvents(userId);

    return NextResponse.json({ events });

  } catch (error) {
    console.error('Get Events API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 