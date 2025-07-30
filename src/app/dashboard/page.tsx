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
    
    if (!newEventTitle) {
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
          description: newEventDescription || '',
          createdBy: user?.id,
        }),
      });

      if (response.ok) {
        setNewEventTitle('');
        setNewEventDescription('');
        setShowCreateForm(false);
        fetchUserEvents(); // Refresh events list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create event');
      }
    } catch (error) {
      console.error('Error creating event:', error);
      alert(error instanceof Error ? error.message : 'Failed to create event. Please try again.');
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
      <div className="min-h-screen dashboard-background flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-700 mx-auto"></div>
          <p className="mt-6 text-gray-700 text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dashboard-background">
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
              onClick={() => {
                setShowCreateForm(true);
                setCreating(false);
                setNewEventTitle('');
                setNewEventDescription('');
              }}
              className="mb-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Event
            </Button>
          ) : (
            <div className="glass-card rounded-2xl p-8 mb-6 relative isolate">
              {/* Decorative background elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-gradient-to-r from-blue-300 to-purple-300 rounded-full opacity-30 pointer-events-none" />
              <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-gradient-to-r from-purple-300 to-indigo-300 rounded-full opacity-30 pointer-events-none" />
              
              <form onSubmit={handleCreateEvent} className="flex flex-col gap-6 relative z-10">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                    Create New Event
                  </h2>
                  <p className="text-gray-600 text-sm">Plan something amazing with your friends! 🎉</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <Input
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    placeholder="e.g., Summer BBQ, Movie Night, Birthday Party"
                    required
                    autoFocus
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={newEventDescription}
                    onChange={(e) => setNewEventDescription(e.target.value)}
                    placeholder="Add some details about your event... (optional)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="submit" 
                    disabled={creating}
                    onClick={(e) => {
                      if (creating) {
                        e.preventDefault();
                        return;
                      }
                      if (!newEventTitle.trim()) {
                        e.preventDefault();
                        return;
                      }
                      // Let the form's onSubmit handle the actual submission
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 hover:scale-105 disabled:from-blue-400 disabled:to-purple-400 relative z-20"
                  >
                    {creating ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Creating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Create Event
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl transition-all duration-200"
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
                    {event.description || 'No description provided'}
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