import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, Message, User, PlannedActivity } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// User operations
export const createUser = async (user: User) => {
  const userRef = doc(db, 'users', user.id);
  await updateDoc(userRef, {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
    } as User;
  }
  
  return null;
};

// Event operations
export const createEvent = async (event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const eventData = {
    ...event,
    id: uuidv4(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'events'), eventData);
  return docRef.id;
};

export const getEvent = async (eventId: string): Promise<Event | null> => {
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  
  if (eventSnap.exists()) {
    const data = eventSnap.data();
    return {
      ...data,
      id: eventSnap.id,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as Event;
  }
  
  return null;
};

export const getUserEvents = async (userId: string): Promise<Event[]> => {
  const eventsQuery = query(
    collection(db, 'events'),
    where('participants', 'array-contains', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const querySnapshot = await getDocs(eventsQuery);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    createdAt: doc.data().createdAt.toDate(),
    updatedAt: doc.data().updatedAt.toDate(),
  })) as Event[];
};

export const updateEvent = async (eventId: string, updates: Partial<Event>) => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
};

export const addParticipantToEvent = async (eventId: string, userId: string) => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    participants: arrayUnion(userId),
    updatedAt: Timestamp.now(),
  });
};

export const removeParticipantFromEvent = async (eventId: string, userId: string) => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    participants: arrayRemove(userId),
    updatedAt: Timestamp.now(),
  });
};

// Message operations
export const createMessage = async (message: Omit<Message, 'id' | 'timestamp'>): Promise<string> => {
  const messageData = {
    ...message,
    id: uuidv4(),
    timestamp: Timestamp.now(),
  };
  
  const docRef = await addDoc(collection(db, 'messages'), messageData);
  return docRef.id;
};

export const getEventMessages = async (eventId: string): Promise<Message[]> => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('eventId', '==', eventId),
    orderBy('timestamp', 'asc')
  );
  
  const querySnapshot = await getDocs(messagesQuery);
  return querySnapshot.docs.map(doc => ({
    ...doc.data(),
    id: doc.id,
    timestamp: doc.data().timestamp.toDate(),
  })) as Message[];
};

export const subscribeToEventMessages = (
  eventId: string,
  callback: (messages: Message[]) => void
) => {
  const messagesQuery = query(
    collection(db, 'messages'),
    where('eventId', '==', eventId),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      timestamp: doc.data().timestamp.toDate(),
    })) as Message[];
    callback(messages);
  });
};

// Schedule operations
export const updateEventSchedule = async (eventId: string, schedule: PlannedActivity[]) => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    schedule,
    updatedAt: Timestamp.now(),
  });
};

// Delete operations
export const deleteEvent = async (eventId: string) => {
  const eventRef = doc(db, 'events', eventId);
  await deleteDoc(eventRef);
  
  // Also delete all messages related to this event
  const messagesQuery = query(
    collection(db, 'messages'),
    where('eventId', '==', eventId)
  );
  
  const querySnapshot = await getDocs(messagesQuery);
  const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deletePromises);
}; 