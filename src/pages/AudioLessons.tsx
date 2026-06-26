import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSES, Course } from '../constants';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { 
  ChevronLeft, 
  Mic2, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Crown,
  Lock,
  Headphones,
  X
} from 'lucide-react';
import { motion } from 'motion/react';

export default function AudioCenter() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<string>(COURSES[0].id);
  const [coursesWithData, setCoursesWithData] = useState<Record<string, Course>>({});
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

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
    if (isFree && timeRemaining <= 0) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    }
  }, [timeRemaining, isFree]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Playback error:", e));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, selectedCourse]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
  const actualAudioUrl = isFree ? (currentCourse?.previewAudioUrl || currentCourse?.audioUrl) : currentCourse?.audioUrl;
  const isLocked = !profile?.isPremium && !profile.grantedCourses?.includes(selectedCourse);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-custom"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <header className="p-6 pt-12 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <ChevronLeft size={24} className="text-slate-600" />
            </button>
            <h1 className="text-2xl font-black text-slate-900 editorial-header tracking-tight">Audio Hub.</h1>
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
              <button onClick={() => navigate('/upgrade')} className="bg-amber-400 text-amber-900 p-2 rounded-full shadow-lg">
                <Crown size={20} />
              </button>
            )}
          </div>
        </header>

        <div className="p-6 pb-32 flex-1 flex flex-col relative">
          {/* SESSION EXPIRED OVERLAY */}
          {isFree && timeRemaining <= 0 && (
            <div className="absolute inset-x-6 top-0 bottom-32 bg-slate-900/95 backdrop-blur-xl z-[60] rounded-[3rem] p-8 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-amber-500 rounded-[2rem] flex items-center justify-center text-black mb-8">
                <X size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2 italic leading-tight">Free preview over.</h2>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest max-w-[220px] leading-relaxed mb-6">
                Upgrade to Premium or purchase this course for full access!
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-xl mb-10">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest text-center">Free preview ends at 4:00.<br/>Upgrade for full access.</p>
              </div>
              <button 
                onClick={() => navigate('/upgrade')}
                className="w-full max-w-xs bg-white text-black py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all text-[11px]"
              >
                Go Premium
              </button>
            </div>
          )}
        {/* Course Cards Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          {visibleCourses.map((course) => (
            <button
              key={course.id}
              onClick={() => setSelectedCourse(course.id)}
              className={cn(
                "p-5 rounded-[2rem] border transition-all text-left group relative overflow-hidden",
                selectedCourse === course.id 
                  ? "bg-teal-custom border-teal-custom text-white shadow-xl shadow-teal-900/10" 
                  : "bg-slate-50 border-slate-100 text-slate-800 hover:bg-white hover:shadow-lg"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-colors",
                selectedCourse === course.id ? "bg-white/20" : "bg-white shadow-sm text-teal-custom"
              )}>
                <Mic2 size={18} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{course.code}</p>
              <h3 className="font-bold text-xs editorial-header leading-tight">{course.title}</h3>
              {isLocked && (
                <Lock size={12} className="absolute top-6 right-6 opacity-40" />
              )}
            </button>
          ))}
        </div>

        {/* Player Section sticky at bottom would be better, but user likes clean editorial */}
        <div className="mt-auto bg-slate-900 rounded-[3rem] p-8 text-white space-y-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-teal-300">
              <Headphones size={32} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[10px] font-black uppercase tracking-widest text-teal-300 mb-1">Playing Now</p>
              <h4 className="font-bold text-sm truncate">{currentCourse?.title}</h4>
              <p className="text-[10px] text-white/40 italic editorial-header">{currentCourse?.code} • Lesson Guide</p>
            </div>
          </div>

          {!actualAudioUrl ? (
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-none">Audio Source Pending</p>
            </div>
          ) : (
            <>
              <audio 
                ref={audioRef}
                src={actualAudioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
              />
              <div className="space-y-2">
                <div className="h-1 bg-white/20 rounded-full relative overflow-hidden cursor-pointer" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const pct = x / rect.width;
                  if (audioRef.current) audioRef.current.currentTime = pct * audioRef.current.duration;
                }}>
                  <div className="absolute left-0 top-0 bottom-0 bg-teal-400 transition-all" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[10px] font-black tracking-widest text-white/30 uppercase">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration || 0)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-10">
                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime -= 10; }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-xl active:scale-95 transition-all disabled:opacity-50"
                  disabled={isFree && timeRemaining <= 0}
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
                </button>
                <button 
                  onClick={() => { if (audioRef.current) audioRef.current.currentTime += 10; }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <SkipForward size={24} />
                </button>
              </div>
            </>
          )}

          {isLocked && (
            <div 
              onClick={() => navigate('/upgrade')}
              className="bg-amber-400 p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-all"
            >
              <div className="flex items-center gap-3">
                <Crown size={20} className="text-amber-900" />
                <div>
                  <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest leading-none">Unlock High Quality</p>
                  <p className="text-[9px] text-amber-800 font-bold mt-1">Join Premium for full downloads</p>
                </div>
              </div>
              <p className="text-[10px] font-black text-amber-900 underline underline-offset-2">UPGRADE</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
