import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSES } from '../constants';
import { ChevronLeft, Search, GraduationCap, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthProvider';

const FREE_COURSES_IDS = ['gst101', 'bio101', 'igb101', 'get103', 'phy101'];

export default function CourseList() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [searchTerm, setSearchTerm] = React.useState('');

  const isPremium = profile?.isPremium;
  const grantedCourses = profile?.grantedCourses || [];

  const filteredCourses = COURSES.filter(course => {
    // Search filter
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.code.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    // Visibility filter
    const isFreeCourse = FREE_COURSES_IDS.includes(course.id);
    const hasAccess = isPremium || isFreeCourse || grantedCourses.includes(course.id);
    
    // Only show courses the user has access to or if they are premium
    // If user is basic (not premium), only show the 5 free ones + any they specifically have
    if (!isPremium && !isFreeCourse && !grantedCourses.includes(course.id)) {
      return false;
    }

    return true;
  });

  const handleCourseClick = (courseId: string) => {
    const isFreeCourse = FREE_COURSES_IDS.includes(courseId);
    const hasAccess = isPremium || isFreeCourse || grantedCourses.includes(courseId);

    if (hasAccess) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate('/upgrade');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 pt-12 bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 editorial-header tracking-tight">Main Curriculum</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 -mt-1">Semester sequence 01</p>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-slate-900 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Search course code or title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-xs font-bold outline-none"
          />
        </div>
      </header>

      <div className="p-6 space-y-4 pb-32">
        {filteredCourses.map((course, index) => {
          const isFreeCourse = FREE_COURSES_IDS.includes(course.id);
          const hasAccess = isPremium || isFreeCourse || grantedCourses.includes(course.id);

          return (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              onClick={() => handleCourseClick(course.id)}
              className={`w-full flex items-center gap-4 p-5 rounded-[2.5rem] border transition-all group relative overflow-hidden ${
                hasAccess 
                  ? 'bg-white border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-900/5 hover:-translate-y-1' 
                  : 'bg-slate-50/50 border-slate-100 opacity-80'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                hasAccess ? 'bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white' : 'bg-slate-100 text-slate-400'
              }`}>
                {hasAccess ? <GraduationCap size={28} /> : <Lock size={24} />}
              </div>
              <div className="flex-1 text-left">
                <p className={`font-black text-[10px] uppercase tracking-widest mb-0.5 ${hasAccess ? 'text-teal-600' : 'text-slate-400'}`}>
                  {course.code}
                </p>
                <h4 className={`font-black text-sm tracking-tight editorial-header ${hasAccess ? 'text-slate-900' : 'text-slate-500'}`}>
                  {course.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    isFreeCourse ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isFreeCourse ? 'Free Preview' : hasAccess ? 'Premium Access' : 'Locked'}
                  </div>
                </div>
              </div>
              {hasAccess && (
                <div className="bg-slate-50 p-2 rounded-full text-slate-300 group-hover:text-teal-600 group-hover:bg-teal-50 transition-all">
                  <ChevronLeft size={16} className="rotate-180" />
                </div>
              )}
              {!hasAccess && (
                <div className="bg-slate-100 p-2 rounded-full text-slate-300">
                  <Lock size={16} />
                </div>
              )}
            </motion.button>
          );
        })}

        {filteredCourses.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-slate-200">
            <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest italic">Course not found in matrix</p>
          </div>
        )}
      </div>
    </div>
  );
}
