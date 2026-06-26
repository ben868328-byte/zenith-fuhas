import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Shield, ChevronRight, Bell, CreditCard } from 'lucide-react';

export default function Profile() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/login');
  };

  const menuItems = [
    { label: 'Academic Standing', icon: Shield, detail: '100 Level' },
    { label: 'Notifications', icon: Bell, detail: '3 New' },
    { label: 'Subscription Plan', icon: CreditCard, detail: profile?.isPremium ? 'Standard Access' : 'Free Plan', path: '/upgrade' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-8 bg-teal-600 text-white pb-20 rounded-b-[3rem]">
        <h1 className="text-xl font-bold mb-8">Your Profile</h1>
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-teal-600 mb-4 shadow-xl border-4 border-teal-500/50">
            <User size={48} />
          </div>
          <h2 className="text-xl font-black">{profile?.displayName}</h2>
          <p className="text-teal-100 text-sm">{profile?.email}</p>
        </div>
      </header>

      <div className="px-6 -mt-12 space-y-4">
        {menuItems.map((item) => (
          <button 
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className="w-full bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all active:scale-95"
          >
            <div className="flex items-center gap-4">
              <div className="bg-teal-50 p-2 rounded-xl text-teal-600">
                <item.icon size={20} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900">{item.label}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.detail}</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-300" />
          </button>
        ))}

        <button 
          onClick={handleLogout}
          className="w-full bg-white p-5 rounded-3xl border border-rose-100 shadow-sm flex items-center gap-4 text-rose-600 hover:bg-rose-50 transition-all active:scale-95"
        >
          <div className="bg-rose-50 p-2 rounded-xl">
            <LogOut size={20} />
          </div>
          <p className="font-bold">Sign Out</p>
        </button>
      </div>

      <div className="p-12 text-center mt-auto">
        <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em]">Build for Excellence</p>
        <p className="text-[10px] text-gray-300 mt-2 font-medium underline underline-offset-4 decoration-current">FUAHSE Student Hub v1.0</p>
      </div>
    </div>
  );
}
