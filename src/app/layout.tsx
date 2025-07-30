import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Events AI - Plan Events with Friends',
  description: 'Collaborate with friends to plan amazing events using AI assistance',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 