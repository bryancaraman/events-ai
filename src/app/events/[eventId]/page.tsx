'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Event, Message, PlannedActivity } from '@/types';
import { formatDate, formatTime } from '@/lib/utils';
import { subscribeToEventMessages } from '@/lib/db';
import { useToast } from '@/components/ui/Toast';
import { 
  ArrowLeft, 
  Send, 
  Calendar, 
  MapPin, 
  Clock, 
  Users,
  Bot,
  User,
  UserPlus,
  Share2,
  Copy,
  Trash2
} from 'lucide-react';

interface EventPageProps {
  params: { eventId: string };
}

export default function EventPage({ params }: EventPageProps) {
  const { eventId } = params;
  const { user, loading } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [sending, setSending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [participantDetails, setParticipantDetails] = useState<{[key: string]: {name: string, email: string}}>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (eventId && user) {
      fetchEvent();
      
      // Subscribe to real-time messages
      const unsubscribe = subscribeToEventMessages(eventId, (newMessages) => {
        setMessages(newMessages);
      });

      return () => unsubscribe();
    }
  }, [eventId, user]);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [messages]);

  const fetchEvent = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`);
      if (response.ok) {
        const data = await response.json();
        const eventData = data.event;
        setEvent(eventData);
        
        // Build participant details map
        const details: {[key: string]: {name: string, email: string}} = {};
        
        eventData.participants.forEach((participantId: string) => {
          if (participantId === eventData.createdBy) {
            // This is the creator
            if (participantId === user?.id) {
              // Current user is the creator
              details[participantId] = {
                name: 'You (Creator)',
                email: user.email
              };
            } else {
              // Someone else is the creator
              details[participantId] = {
                name: 'Event Creator',
                email: participantId.includes('@') ? participantId : 'Google User'
              };
            }
          } else {
            // Regular participant
            if (participantId === user?.id) {
              // Current user (but not creator)
              details[participantId] = {
                name: 'You',
                email: user.email
              };
            } else if (participantId.includes('@')) {
              // Email-based participant
              details[participantId] = {
                name: participantId.split('@')[0],
                email: participantId
              };
            } else {
              // Other user ID
              details[participantId] = {
                name: 'Team Member',
                email: 'Google User'
              };
            }
          }
        });
        
        setParticipantDetails(details);
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      router.push('/dashboard');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) {
      return;
    }

    try {
      setSending(true);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          eventId,
          context: {
            previousMessages: messages.slice(-10), // Last 10 messages for context
            currentSchedule: event?.schedule,
          },
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Messages will be updated via real-time subscription
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };



  const copyShareableLink = () => {
    const shareableLink = `${window.location.origin}/events/${eventId}`;
    navigator.clipboard.writeText(shareableLink);
    
    showToast('success', 'Shareable link copied to clipboard!');
  };

  const generateShareableLink = () => {
    return `${window.location.origin}/events/${eventId}`;
  };

  const handleDeleteEvent = async () => {
    if (!user || !event) return;

    try {
      setDeleting(true);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (response.ok) {
        showToast('success', 'Event deleted successfully!');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      showToast('error', 'Failed to delete event. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading || loadingEvent) {
    return (
      <div className="min-h-screen event-background flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-700 mx-auto"></div>
          <p className="mt-6 text-gray-700 text-lg font-medium">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen event-background flex items-center justify-center">
        <div className="text-center relative z-10 glass-card p-8 rounded-2xl">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Event not found</h2>
          <Button onClick={() => router.push('/dashboard')} className="bg-gray-700 text-white hover:bg-gray-800">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Check if current user is a participant
  const isParticipant = user && event.participants.includes(user.id);

  // If user is not a participant, show join prompt
  if (user && !isParticipant) {
    const handleJoinEvent = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/join`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });

        if (response.ok) {
          showToast('success', 'Successfully joined the event!');
          // Refresh event data
          fetchEvent();
        } else {
          showToast('error', 'Failed to join event. Please try again.');
        }
      } catch (error) {
        console.error('Error joining event:', error);
      }
    };

    return (
      <div className="min-h-screen event-background flex items-center justify-center">
        <div className="max-w-md mx-auto p-8 glass-card rounded-2xl text-center relative z-10">
          <div className="mb-8">
            <Calendar className="w-20 h-20 text-gray-700 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-3 drop-shadow-sm">{event.title}</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">{event.description || 'No description provided'}</p>
            <div className="flex items-center justify-center text-gray-600 mb-6">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-medium">{event.participants.length} participant{event.participants.length !== 1 ? 's' : ''}</span>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">
              🎉 You've been invited to join this event! Click below to participate in the planning.
            </p>
            
            <Button onClick={handleJoinEvent} className="w-full bg-gray-700 text-white hover:bg-gray-800 hover:scale-105 transition-all duration-300 py-3">
              <UserPlus className="w-5 h-5 mr-2" />
              Join Event
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="w-full border-gray-400 text-gray-700 hover:bg-gray-100"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen event-background">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-sm text-gray-600">{event.description || 'No description provided'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 mr-1" />
                <span className="font-medium">{event.participants.length}</span>
                <span className="ml-1">{event.participants.length !== 1 ? 'participants' : 'participant'}</span>
              </div>
              
              <Button
                variant="outline" 
                size="sm"
                onClick={() => setShowInviteModal(true)}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>

              {/* Only show delete button for event creator */}
              {user && event && user.id === event.createdBy && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteModal(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Chat Section */}
          <div className="lg:col-span-5">
            <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 rounded-2xl shadow-2xl border border-white/50 backdrop-blur-sm h-[calc(100vh-200px)] min-h-[700px] flex flex-col overflow-hidden">
              <div className="p-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">AI Event Planner</h2>
                    <p className="text-blue-100 text-sm">
                      Let's create something amazing together! ✨
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="relative">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-pulse">
                        <Bot className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full animate-bounce"></div>
                    </div>
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                      Ready to Plan Something Epic?
                    </h3>
                    <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                      I'm your AI event planning assistant! Ask me about restaurants, activities, attractions, or anything else for your event. 
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                      <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-sm font-medium">
                        🍽️ Find restaurants
                      </span>
                      <span className="px-4 py-2 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 rounded-full text-sm font-medium">
                        🎉 Plan activities
                      </span>
                      <span className="px-4 py-2 bg-gradient-to-r from-pink-100 to-yellow-100 text-pink-700 rounded-full text-sm font-medium">
                        📍 Discover places
                      </span>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-6 py-4 shadow-lg ${
                          message.type === 'user'
                            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-100 shadow-xl'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${
                            message.type === 'user' 
                              ? 'bg-white/20' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {message.type === 'user' ? (
                              <User className="w-3 h-3 text-white" />
                            ) : (
                              <Bot className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <span className={`text-xs font-medium ${
                            message.type === 'user' ? 'text-white/80' : 'text-gray-600'
                          }`}>
                            {message.userDisplayName}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.type === 'user' ? 'text-white/70' : 'text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50/50 border-t border-gray-100">
                <form onSubmit={handleSendMessage} className="flex gap-3">
                  <div className="flex-1 relative">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="✨ Ask me anything about your event..."
                      className="w-full pl-4 pr-4 py-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 bg-white shadow-lg transition-all duration-200"
                      disabled={sending}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={sending || !newMessage.trim()}
                    className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Info */}
            <div className="bg-gradient-to-br from-white to-blue-50/50 rounded-2xl shadow-xl border border-white/50 p-6">
              <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Event Details</h3>
              <div className="space-y-4">
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-gray-600 text-xs">{formatDate(event.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mr-3">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Last updated</p>
                    <p className="text-gray-600 text-xs">{formatDate(event.updatedAt)}</p>
                  </div>
                </div>
                <div className="flex items-center text-sm">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-yellow-600 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Participants</p>
                    <p className="text-gray-600 text-xs">{event.participants.length} planning together</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Participants */}
            <div className="bg-gradient-to-br from-white to-purple-50/50 rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Team</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200 hover:border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Invite
                </Button>
              </div>
              
              <div className="space-y-3">
                {event.participants.map((participantId, index) => (
                  <div key={participantId} className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-blue-50/50 rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {participantDetails[participantId]?.name || `User ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        {participantDetails[participantId]?.email || 'Google User'}
                      </p>
                    </div>
                    {participantId === event.createdBy && (
                      <span className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-medium shadow-sm">
                        ⭐ Creator
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="w-full text-purple-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share event link
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <Share2 className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Share Event</h3>
              <p className="text-gray-600 text-sm">
                Share this link with friends to invite them to your event
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Link
                </label>
                <div className="flex gap-2">
                  <Input
                    value={generateShareableLink()}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyShareableLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Anyone with this link can join the event and start planning together!
                </p>
              </div>

              <div className="border-t pt-4">
                <div className="flex gap-2">
                  <Button 
                    onClick={copyShareableLink}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1"
                  >
                    Done
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
              <p className="text-gray-600 text-sm mt-2">
                Are you sure you want to delete "{event?.title}"? This action cannot be undone and will delete all messages and data associated with this event.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteEvent}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Event
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 