import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { LayoutDashboard, BookOpen, PlayCircle, Mic2, HelpCircle, User, CreditCard, Brain } from 'lucide-react';
import { cn } from '../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', path: '/' },
  { icon: BookOpen, label: 'Courses', path: '/courses' },
  { icon: PlayCircle, label: 'Videos', path: '/videos' },
  { icon: Mic2, label: 'Audio', path: '/audio' },
  { icon: HelpCircle, label: 'Quizzes', path: '/quizzes' },
  { icon: Brain, label: 'Revision', path: '/revision' },
  { icon: User, label: 'Profile', path: '/profile' },
  { icon: CreditCard, label: 'Upgrade', path: '/upgrade' },
];

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin } = useAuth();

  const filteredNavItems = isAdmin 
    ? navItems.filter(item => item.path !== '/upgrade') 
    : navItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1 z-50">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {filteredNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center p-2 rounded-lg transition-colors",
                isActive ? "text-teal-600" : "text-gray-500 hover:text-teal-500"
              )}
            >
              <item.icon size={20} className={isActive ? "fill-teal-50" : ""} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
