# Events AI - Event Planning with Friends 🎉

A full-stack Next.js application that helps you plan events with friends using AI assistance. Chat with an intelligent AI agent to get suggestions for activities, restaurants, and attractions, while collaborating in real-time with your friends.

## ✨ Features

### 🔐 **Authentication**
- **Google Sign-In**: One-click authentication with Google OAuth
- **Secure Sessions**: Firebase Auth integration
- **Auto Profile Setup**: Automatic user profile creation

### 📅 **Event Management**
- **Create Events**: Easy event creation with title and description
- **Delete Events**: Event creators can delete their events (with confirmation)
- **Real-time Collaboration**: Multiple participants can plan together
- **Event Dashboard**: View all your events in one place

### 👥 **Participant Management**
- **Shareable Links**: Generate instant links that anyone can use to join events
- **One-Click Join**: Join events instantly via shared links
- **Easy Sharing**: Copy links to share via text, email, social media, etc.
- **Participant List**: See who's participating in each event

### 🤖 **AI-Powered Planning**
- **Smart Assistant**: Chat with AI to plan your event
- **Location-Aware**: AI understands and suggests based on location context
- **Activity Suggestions**: Get recommendations for restaurants, attractions, activities
- **Schedule Generation**: AI creates detailed schedules with times
- **Google Places Integration**: Real venue suggestions with details and photos

### 💬 **Real-time Chat**
- **Live Messaging**: Real-time chat with all participants
- **Conversation History**: Persistent message history
- **Context Awareness**: AI remembers previous conversations

### 🎨 **Modern UI Experience**
- **Vibrant Design**: Eye-catching gradients and modern interface
- **Full-Screen Chat**: Immersive conversation experience
- **Smooth Animations**: Delightful micro-interactions
- **Responsive Layout**: Perfect on desktop and mobile

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Firebase project with Google Auth enabled
- NVIDIA API key
- Google Places API key

### 1. Clone & Install
```bash
git clone <repository-url>
cd events-ai
npm install
```

### 2. Environment Setup
Create `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY="your_private_key"

# AI & External APIs
NVIDIA_API_KEY=your_nvidia_api_key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
GOOGLE_PLACES_API_KEY=your_google_places_key
```

### 3. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to start using the app!

## 📱 How to Use

### **Creating Events**
1. Sign in with your Google account
2. Click "Create New Event" on the dashboard
3. Enter event title and description
4. Start planning!

### **Managing Events**
- **Delete Events**: Event creators can delete their events from both the dashboard and event page
- **Confirmation Required**: All deletions require confirmation to prevent accidents
- **Complete Cleanup**: Deleting an event removes all associated messages and data

### **Inviting Participants**
1. Open any event you've created
2. Click the "Invite" or "Share" button in the header or sidebar
3. Copy the shareable link from the modal
4. Share the link via text, email, social media, or anywhere!
5. Recipients can join instantly by clicking the link

### **Planning with AI**
1. In the event chat, ask the AI assistant about:
   - "What are good restaurants in San Francisco?"
   - "Plan a day trip to Central Park"
   - "Suggest activities for a birthday party"
   - "Create a schedule for tomorrow starting at 10am"

2. The AI will:
   - Suggest real venues using Google Places API
   - Generate detailed schedules with times
   - Remember your conversation context
   - Provide location-specific recommendations

### **Collaborating**
- All participants see messages in real-time
- Schedule updates appear instantly for everyone
- Chat history is preserved across sessions

## 🏗️ Technical Architecture

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Authentication**: Firebase Auth (Google OAuth)
- **Database**: Firestore for real-time data
- **AI**: NVIDIA API (Llama 3.1-405B model)
- **Location Services**: Google Places API
- **Real-time**: Firestore listeners

## 🛠️ Key Technologies

- **Next.js 14**: App Router, Server Components, API Routes
- **Firebase**: Auth, Firestore, Real-time listeners
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Modern icon library
- **NVIDIA AI**: Advanced language model
- **Google Places**: Real venue data

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── events/[eventId]/  # Individual event pages
│   └── api/               # API routes
├── components/            # Reusable UI components
│   ├── auth/             # Authentication components
│   └── ui/               # Base UI components
├── contexts/             # React contexts
├── lib/                  # Core utilities
│   ├── firebase.ts       # Firebase client config
│   ├── firebase-admin.ts # Firebase admin config
│   ├── ai-agent.ts       # AI agent implementation
│   └── db.ts             # Database operations
└── types/                # TypeScript definitions
```

## 🔧 API Endpoints

- `POST /api/events` - Create new event
- `GET /api/events?userId=` - Get user events
- `GET /api/events/[eventId]` - Get event details
- `PUT /api/events/[eventId]` - Update event/add participants
- `DELETE /api/events/[eventId]` - Delete event (creator only)
- `POST /api/events/[eventId]/join` - Join event via link
- `POST /api/chat` - AI chat processing

## 🚀 Deployment

The app is ready for deployment on Vercel:

```bash
npm run build
```

Configure environment variables in your deployment platform.

## 🎯 Future Enhancements

- **Push Notifications**: Real-time updates and alerts
- **Calendar Integration**: Export to Google Calendar
- **Photo Sharing**: Share event photos and memories
- **Expense Splitting**: Built-in cost management
- **QR Code Sharing**: Generate QR codes for easy event joining
- **Mobile App**: React Native version

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - feel free to use this project for your own events!

---

**Built with ❤️ for better event planning experiences**