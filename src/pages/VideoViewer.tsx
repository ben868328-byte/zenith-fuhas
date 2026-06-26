import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Course, Chapter, ELIGIBLE_FREE_COURSES } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { ChevronLeft, Menu, X, CheckCircle2, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getVideoEmbedUrl } from '../lib/utils';

export default function VideoViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | undefined>(COURSES.find(c => c.id === id));
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'courses', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Course;
        setCourse(data);
        if (data.chapters && data.chapters.length > 0 && !activeChapter) {
          setActiveChapter(data.chapters[0]);
        }
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `courses/${id}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  const markAsRead = async (chapterId: string) => {
    if (!profile || !id) return;
    const userRef = doc(db, 'users', profile.uid);
    try {
      await updateDoc(userRef, {
        [`completedChapters.${id}`]: arrayUnion(chapterId)
      });
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleChapterSelect = (chapter: Chapter) => {
    setActiveChapter(chapter);
    markAsRead(chapter.id);
    setIsSidebarOpen(false);
  };

  const completed = profile?.completedChapters?.[course?.id || ''] || [];
  const isLocked = !profile?.isPremium && !(id && profile?.grantedCourses?.includes(id));
  const isEligibleForPreview = id ? ELIGIBLE_FREE_COURSES.includes(id) : false;
  const effectivelyLocked = isLocked && !isEligibleForPreview;

  const currentUrl = isLocked ? (course?.previewVideoUrl || course?.videoUrl) : (activeChapter?.videoUrl || course?.videoUrl);
  const embedUrl = getVideoEmbedUrl(currentUrl);

  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes

  useEffect(() => {
    if (!isLocked || effectivelyLocked) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, effectivelyLocked]);

  const LockedScreen = () => (
    <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)]" />
      
      <div className="relative z-10">
        <div className="w-28 h-28 bg-white/5 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center text-teal-400 mx-auto mb-10 border border-white/10 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
          <Lock size={56} strokeWidth={2.5} />
        </div>
        
        <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full mb-6 inline-block">
          <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">⚠️ Academic Limit Reached</p>
        </div>
        
        <h3 className="text-white font-black uppercase tracking-tighter text-3xl mb-4 italic leading-none editorial-header">
          {effectivelyLocked ? 'STUDY PASS\nREQUIRED.' : 'PREVIEW\nTERMINATED.'}
        </h3>
        
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed mb-12 max-w-[320px] mx-auto">
          {effectivelyLocked 
            ? "This video module is restricted to Standard users only. Get full access to unlock this curriculum module."
            : "Unlock the full guide to continue studying. Get full access to all 11 courses and unlimited academic modules."
          }
        </p>
        
        <button 
          onClick={() => navigate('/upgrade')}
          className="w-full max-w-sm bg-teal-custom text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(15,23,42,0.5)] active:scale-95 transition-all text-xs flex items-center justify-center gap-4 border border-white/10 hover:bg-teal-900"
        >
          Upgrade Now
        </button>
        
        <button 
          onClick={() => navigate(-1)}
          className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-teal-500 transition-colors"
        >
          ← Return to Hub
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (!course) return null;

  return (
    <div className="flex flex-col h-screen bg-black overflow-hidden relative">
      <header className="h-16 px-4 bg-black/60 text-white flex items-center justify-between z-50 flex-shrink-0 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="leading-tight overflow-hidden">
            <h1 className="text-sm font-black truncate uppercase tracking-tight">{course.code}: Masterclass</h1>
            {activeChapter && <p className="text-[10px] text-teal-400 font-bold uppercase truncate">{activeChapter.title}</p>}
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isLocked && !effectivelyLocked && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-none">
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, '0')}
              </p>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-teal-400 hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* 16:9 BOX - NO OVERLAYS - DIRECT HIT ON VIDEO */}
      <div className="flex-1 flex flex-col items-center justify-center bg-black overflow-hidden relative">
        {(effectivelyLocked || (isLocked && timeRemaining <= 0)) && <LockedScreen />}
        <div className="w-full max-w-6xl aspect-video bg-zinc-900 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative rounded-none md:rounded-3xl overflow-hidden border border-white/5">
          {embedUrl ? (
            <iframe 
              src={embedUrl}
              width="100%"
              height="100%"
              className="w-full h-full border-none relative z-10"
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
              referrerPolicy="no-referrer"
              sandbox="allow-forms allow-scripts allow-same-origin allow-presentation"
              title="Hub Masterclass Player"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
              <p className="text-xs font-black uppercase tracking-[0.3em]">Module Signal Lost</p>
              <p className="text-[10px] font-bold mt-2 opacity-50">NO SOURCE DETECTED</p>
            </div>
          )}
        </div>

        {/* FAIL-SAFE EXTERNAL PLAYER BUTTON */}
        <div className="w-full max-w-md px-6 mt-8">
          <button 
            onClick={() => currentUrl && window.open(currentUrl, '_blank')}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 active:scale-95 border border-white/5"
          >
            🚀 Play in External App
          </button>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest text-center mt-4">
            Playback error? Tap to watch in external browser
          </p>
        </div>
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-4/5 max-w-sm bg-zinc-900 z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="font-black uppercase tracking-widest text-white">Curriculum</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-500 hover:text-white">
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-8">
                {COURSES.map(c => {
                  const isCurrentCourse = c.id === id;
                  return (
                    <div key={c.id}>
                      <button
                        onClick={() => {
                          if (!isCurrentCourse) {
                            navigate(`/video/${c.id}`);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${
                          isCurrentCourse ? 'bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/20' : 'hover:bg-white/5 text-gray-400'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${
                          isCurrentCourse ? 'bg-teal-500 text-white' : 'bg-zinc-800 text-gray-600'
                        }`}>
                          {c.code.split(' ')[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-black ${isCurrentCourse ? 'text-white' : 'text-gray-400'}`}>{c.code}</p>
                          <p className="text-[10px] font-bold text-gray-600 truncate">{c.title}</p>
                        </div>
                      </button>
                      
                      {isCurrentCourse && (
                        <div className="mt-2 ml-4 pl-4 border-l border-white/5 space-y-2">
                          {course.chapters && course.chapters.length > 0 ? (
                            course.chapters.map((chapter, idx) => (
                              <button
                                key={chapter.id}
                                onClick={() => handleChapterSelect(chapter)}
                                className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                  activeChapter?.id === chapter.id ? 'bg-white/5 text-teal-400' : 'text-gray-500 hover:text-gray-300'
                                }`}
                              >
                                <span className="text-[10px] font-black uppercase tracking-wider truncate">
                                  {idx + 1}. {chapter.title}
                                </span>
                                {completed.includes(chapter.id) && (
                                  <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          ) : (
                            <p className="p-3 text-[9px] font-bold text-gray-600 uppercase tracking-widest italic">No chapters loaded</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-black border-t border-white/5">
                <p className="text-[10px] font-black uppercase text-gray-600 tracking-widest text-center">
                  EDUHUB MASTERCLASS PLAYER
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
