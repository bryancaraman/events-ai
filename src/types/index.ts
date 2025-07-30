export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  participants: string[]; // User IDs
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  schedule?: PlannedActivity[];
}

export interface Message {
  id: string;
  eventId: string;
  userId: string;
  userDisplayName: string;
  content: string;
  timestamp: Date;
  type: 'user' | 'assistant';
  isSystemMessage?: boolean;
}

export interface PlannedActivity {
  id: string;
  title: string;
  description: string;
  location?: PlaceDetails;
  startTime: Date;
  endTime: Date;
  type: 'restaurant' | 'attraction' | 'accommodation' | 'transportation' | 'custom';
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  rating?: number;
  priceLevel?: number;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  types: string[];
}

export interface ChatRequest {
  message: string;
  eventId: string;
  context?: {
    previousMessages: Message[];
    currentSchedule?: PlannedActivity[];
  };
}

export interface ChatResponse {
  message: string;
  schedule?: PlannedActivity[];
  suggestions?: PlaceDetails[];
} 