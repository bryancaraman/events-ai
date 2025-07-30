import { NextRequest, NextResponse } from 'next/server';
import { getEvent, addParticipantToEvent, updateEvent, deleteEvent } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    const event = await getEvent(eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });

  } catch (error) {
    console.error('Get Event API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const { eventId } = params;
    const body = await request.json();
    const { action, userId, ...updateData } = body;

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Handle different actions
    if (action === 'addParticipant') {
      if (!userId) {
        return NextResponse.json(
          { error: 'User ID is required for adding participant' },
          { status: 400 }
        );
      }

      await addParticipantToEvent(eventId, userId);

      return NextResponse.json({
        success: true,
        message: 'Participant added successfully'
      });
    }

    // Handle general event updates
    if (Object.keys(updateData).length > 0) {
      await updateEvent(eventId, updateData);

      return NextResponse.json({
        success: true,
        message: 'Event updated successfully'
      });
    }

    return NextResponse.json(
      { error: 'No valid action or update data provided' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Update Event API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check if event exists and user is the creator
    const event = await getEvent(eventId);
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (event.createdBy !== userId) {
      return NextResponse.json(
        { error: 'Only the event creator can delete this event' },
        { status: 403 }
      );
    }

    // Delete the event and all associated messages
    await deleteEvent(eventId);

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete Event API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 