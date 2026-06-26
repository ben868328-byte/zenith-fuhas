import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { COURSES, Course } from '../constants';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Clock, 
  Lock, 
  ChevronLeft, 
  Crown,
  CheckCircle2,
  Video,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn, getVideoEmbedUrl } from '../lib/utils';

export default function VideoLessons() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string>(COURSES[0].id);
  const [coursesWithData, setCoursesWithData] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);

  // Free user timer state
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes
  const isFree = profile && !profile.isPremium && !profile.grantedCourses?.includes(selectedCourse);

  useEffect(() => {
    if (!isFree) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isFree]);

  useEffect(() => {
    const fetchAllCourseData = async () => {
      const data: Record<string, Course> = {};
      try {
        for (const c of COURSES) {
          const docRef = doc(db, 'courses', c.id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            data[c.id] = { ...c, ...docSnap.data() };
          } else {
            data[c.id] = c;
          }
        }
        setCoursesWithData(data);
      } catch (error) {
        console.error("Error fetching course data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllCourseData();
  }, []);

  const FREE_COURSES_IDS = ['gst101', 'bio101', 'igb101', 'get103', 'phy101'];

  const visibleCourses = COURSES.filter(c => {
    const isPremium = profile?.isPremium;
    const isFreeCourse = FREE_COURSES_IDS.includes(c.id);
    const grantedCourses = profile?.grantedCourses || [];
    return isPremium || isFreeCourse || grantedCourses.includes(c.id);
  });

  const currentCourse = coursesWithData[selectedCourse];
  const actualVideoUrl = isFree ? (currentCourse?.previewVideoUrl || currentCourse?.videoUrl) : currentCourse?.videoUrl;
  const embedUrl = getVideoEmbedUrl(actualVideoUrl || '');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-custom"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-6 pt-12 pb-6 border-b border-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 editorial-header tracking-tight">Video Lab.</h1>
        </div>
        <div className="flex items-center gap-3">
          {isFree && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          )}
          {!profile?.isPremium && (
            <button onClick={() => navigate('/upgrade')} className="bg-amber-400 text-amber-900 p-2 rounded-full">
              <Crown size={20} />
            </button>
          )}
        </div>
      </header>

      <div className="p-6 space-y-8">
        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
          {visibleCourses.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCourse(c.id)}
              className={cn(
                "whitespace-nowrap px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedCourse === c.id 
                  ? "bg-teal-custom text-white shadow-lg shadow-teal-900/10" 
                  : "bg-slate-50 text-slate-400 hover:bg-slate-100"
              )}
            >
              {c.code}
            </button>
          ))}
        </div>

        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 group">
          {currentCourse?.videoUrl ? (
            <div className="w-full h-full relative">
              <iframe 
                src={timeRemaining > 0 || !isFree ? embedUrl : ''}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {isFree && timeRemaining > 0 && (
                <div className="absolute top-4 right-4 z-10 pointer-events-none">
                  <div className="bg-amber-400/90 backdrop-blur-md text-amber-900 px-3 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2">
                    <Lock size={12} />
                    4 Min Limit
                  </div>
                </div>
              )}
              {isFree && timeRemaining <= 0 && (
                <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-[40] flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-black mb-6">
                    <Lock size={32} strokeWidth={3} />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-tighter text-white mb-2 italic">Free preview over.</h2>
                  <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-[240px] leading-relaxed mb-6">
                    Upgrade to Premium or purchase this course for full access!
                  </p>
                  <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl mb-8">
                    <p className="text-[9px] font-black text-amber-500 uppercase tracking-[0.15em] text-center">Free preview ends at 4:00.<br/>Upgrade for full access.</p>
                  </div>
                  <button 
                    onClick={() => navigate('/upgrade')}
                    className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-[11px]"
                  >
                    Go Premium
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-slate-100">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Video size={32} />
              </div>
              <h3 className="font-bold text-slate-900 editorial-header">No Video Available</h3>
              <p className="text-[10px] text-slate-400 italic editorial-header mt-2 uppercase tracking-tight">Stay tuned for updates</p>
            </div>
          )}
        </div>

        {/* FAIL-SAFE EXTERNAL PLAYER BUTTON */}
        <div className="px-1">
          <button 
            onClick={() => currentCourse?.videoUrl && window.open(currentCourse.videoUrl, '_blank')}
            className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-slate-900/20 text-[11px]"
          >
            🚀 Play in External App
          </button>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-5">
            Playback error? Tap to watch in external browser
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Course Metadata</h3>
            <span className="text-[10px] font-bold text-teal-custom">2026 Updated</span>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-2xl font-black text-slate-900 editorial-header leading-tight tracking-tight">{currentCourse?.title}</h2>
            <p className="text-xs text-slate-500 leading-relaxed italic editorial-header">{currentCourse?.description}</p>
            
            <div className="pt-4 flex flex-wrap gap-2">
              <div className="bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <CheckCircle2 size={12} className="text-teal-custom" />
                HD Quality
              </div>
              <div className="bg-slate-50 px-3 py-1.5 rounded-full flex items-center gap-2 text-[10px] font-bold text-slate-600">
                <Clock size={12} className="text-teal-custom" />
                ~45 mins
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
