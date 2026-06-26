import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { Navigation } from './Navigation';
import { WhatsAppButton } from './WhatsAppButton';

export function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Semester Banner */}
      <div className="bg-slate-900 text-white py-3 px-4 text-center border-b border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 via-transparent to-teal-500/10 opacity-50" />
        <p className="text-[10px] font-black uppercase tracking-[0.15em] leading-relaxed relative z-10 max-w-lg mx-auto">
          ⚠️ 1st Semester Access: <span className="text-gray-400">This subscription covers 1st Semester materials only. 2nd Semester is a separate payment coming soon.</span>
        </p>
      </div>

      <main className="max-w-lg mx-auto bg-white min-h-screen shadow-sm">
        <Outlet />
      </main>
      <Navigation />
      <WhatsAppButton />
    </div>
  );
}
