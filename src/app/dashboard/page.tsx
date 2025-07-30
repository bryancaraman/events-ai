'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Event } from '@/types';
import { formatDate } from '@/lib/utils';
import { Plus, Calendar, Users, MessageCircle, LogOut, Trash2 } from 'lucide-react';

export default function DashboardPage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  const fetchUserEvents = async () => {
    try {
      const response = await fetch(`/api/events?userId=${user?.id}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEventTitle || !newEventDescription) {
      return;
    }

    try {
      setCreating(true);
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newEventTitle,
          description: newEventDescription,
          createdBy: user?.id,
        }),
      });

      if (response.ok) {
        setNewEventTitle('');
        setNewEventDescription('');
        setShowCreateForm(false);
        fetchUserEvents(); // Refresh events list
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingEventId(eventId);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
        }),
      });

      if (response.ok) {
        // Remove the event from the local state
        setEvents(events.filter(event => event.id !== eventId));
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/30">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Events AI</h1>
              <p className="text-gray-700 font-medium">Welcome back, {user.displayName}! ✨</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Event Section */}
        <div className="mb-8">
          {!showCreateForm ? (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          ) : (
            <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl shadow-xl border border-white/50 p-6 mb-6 backdrop-blur-sm">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">Create New Event</h2>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title
                  </label>
                  <Input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="Enter event title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Input
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Describe your event"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Event'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Events List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Events</h2>
          
          {loadingEvents ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No events yet</h3>
              <p className="text-gray-600 mb-4">Create your first event to start planning with friends!</p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-xl border border-white/50 p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer backdrop-blur-sm"
                  onClick={() => router.push(`/events/${event.id}`)}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {event.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {event.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(event.updatedAt)}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/events/${event.id}`);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Open Event
                      </Button>
                      
                      {/* Only show delete button for events created by current user */}
                      {user && event.createdBy === user.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEvent(event.id, event.title);
                          }}
                          disabled={deletingEventId === event.id}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                        >
                          {deletingEventId === event.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 