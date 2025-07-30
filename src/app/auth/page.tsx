'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GoogleSignIn } from '@/components/auth/GoogleSignIn';

export default function AuthPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen auth-background flex items-center justify-center">
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-gray-700 mx-auto"></div>
          <p className="mt-6 text-gray-700 text-lg font-medium">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen auth-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Floating background shapes */}
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 drop-shadow-sm">
            Events AI
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-400 mx-auto mb-6 rounded-full opacity-80"></div>
          <p className="text-xl text-gray-700 font-medium leading-relaxed drop-shadow-sm">
            Plan amazing events with friends using AI assistance
          </p>
          <p className="text-lg text-gray-600 mt-2">
            🎉 Collaborative • 🤖 Intelligent • ✨ Effortless
          </p>
        </div>
      </div>

      <div className="relative z-10">
        <GoogleSignIn />
      </div>
      
      {/* Bottom decorative element */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
    </div>
  );
} 