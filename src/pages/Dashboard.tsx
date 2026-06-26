import React from 'react';
import { useAuth } from '../components/AuthProvider';
import { COURSES } from '../constants';
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  Mic, 
  HelpCircle, 
  FileText,
  ChevronRight,
  TrendingUp,
  Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [isAdmin, navigate]);

  const quickActions = [
    { label: 'All Courses', code: 'CHM', icon: BookOpen, path: '/courses', color: 'bg-teal-custom' },
    { label: 'Video Lab', code: 'VID', icon: Video, path: '/videos', color: 'bg-slate-200', iconColor: 'text-slate-600' },
    { label: 'Audio Center', code: 'AUD', icon: Mic, path: '/audio', color: 'bg-slate-200', iconColor: 'text-slate-600' },
    { label: 'CBT Exam', code: 'CBT', icon: FileText, path: '/exam', color: 'bg-orange-400', iconColor: 'text-white' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Top Header */}
      <div className="p-6 pt-12 pb-4">
        <div className="flex justify-between items-center mb-6">
          <div className="bg-slate-100 p-2.5 rounded-full text-teal-custom">
            <GraduationCap size={20} />
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="bg-amber-400 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter"
              >
                Admin Panel
              </button>
            )}
            <button 
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-teal-custom flex items-center justify-center text-white font-bold shadow-lg shadow-teal-500/20"
            >
              {profile?.displayName?.substring(0, 2).toUpperCase() || 'ST'}
            </button>
          </div>
        </div>

        <h3 className="text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Hello, {profile?.displayName?.split(' ')[0]}</h3>
        <p className="text-slate-500 text-sm mb-8 italic editorial-header">100 Level • First Semester</p>

        {/* Quick Hubs */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(action.path)}
              className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-left hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all active:scale-95 group"
            >
              <div className={`${action.color} w-9 h-9 rounded-xl mb-3 flex items-center justify-center ${action.iconColor || 'text-white'} shadow-sm`}>
                <action.icon size={18} />
              </div>
              <p className="font-bold text-xs text-slate-800">{action.label}</p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-0.5">{action.code}</p>
            </motion.button>
          ))}
        </div>

        {/* Course List Section */}
        <div className="flex justify-between items-center mb-4 px-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Main Curriculum 01</h4>
          <button onClick={() => navigate('/courses')} className="text-teal-custom text-[10px] font-black uppercase underline underline-offset-4 tracking-[0.2em]">
            View All
          </button>
        </div>

        <div className="space-y-4 pb-8">
          {COURSES.filter(course => {
            const isPremium = profile?.isPremium;
            const isFreeCourse = ['gst101', 'bio101', 'igb101', 'get103', 'phy101'].includes(course.id);
            const grantedCourses = profile?.grantedCourses || [];
            // For visibility on dashboard, only show if they have access
            return isPremium || isFreeCourse || grantedCourses.includes(course.id);
          }).slice(0, 5).map((course, index) => (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              onClick={() => navigate(`/courses/${course.id}`)}
              className="w-full flex items-center p-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-2xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all group"
            >
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-custom font-black text-[10px] mr-4 group-hover:bg-teal-custom group-hover:text-white transition-colors">
                {course.code.split(' ')[0]}
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-0.5">{course.code}</p>
                <p className="font-black text-sm text-slate-900 tracking-tight editorial-header leading-tight">{course.title}</p>
              </div>
              <div className="ml-4">
                <div className="text-[10px] font-black text-teal-custom border-2 border-teal-50 px-4 py-1.5 rounded-full group-hover:bg-teal-50 transition-all uppercase tracking-widest">
                  Study
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Upgrade Call to Action if not premium */}
      {!profile?.isPremium && (
        <button 
          onClick={() => navigate('/upgrade')}
          className="mt-auto p-5 bg-teal-custom text-white text-center flex items-center justify-center gap-3 active:bg-teal-800 transition-colors"
        >
          <Crown size={16} className="text-amber-400" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-black">Upgrade to Full Access Hub</p>
        </button>
      )}
    </div>
  );
}
