import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Course, Chapter, ELIGIBLE_FREE_COURSES } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { ChevronLeft, Lock, FileText, ExternalLink, Menu, X, CheckCircle2 } from 'lucide-react';
import { getDrivePreviewUrl, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function PDFViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | undefined>(COURSES.find(c => c.id === id));
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [lockTriggered, setLockTriggered] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [jumpInput, setJumpInput] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Reset page when chapter or course changes
    setCurrentPage(1);
    setRefreshKey(prev => prev + 1);
  }, [id, activeChapter]);

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

  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (!course) return null;

  const isLocked = !profile?.isPremium && !(id && profile?.grantedCourses?.includes(id));
  const isEligibleForPreview = id ? ELIGIBLE_FREE_COURSES.includes(id) : false;
  const effectivelyLocked = isLocked && !isEligibleForPreview;

  const currentChapterUrl = isLocked ? (course?.previewPdfUrl || course?.pdfUrl) : (activeChapter?.pdfUrl || course?.pdfUrl);
  
  const embedUrl = getDrivePreviewUrl(currentChapterUrl);

  const handleNextPage = () => {
    if (isLocked && currentPage >= 8) {
      setLockTriggered(true);
      return;
    }
    setCurrentPage(prev => prev + 1);
    setRefreshKey(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    setRefreshKey(prev => prev + 1);
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpInput);
    if (!isNaN(pageNum) && pageNum > 0) {
      if (isLocked && pageNum > 8) {
        setLockTriggered(true);
      } else {
        setCurrentPage(pageNum);
        setRefreshKey(prev => prev + 1);
      }
    }
    setJumpInput('');
  };

  const completed = profile?.completedChapters?.[course.id] || [];

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
          PREVIEW<br/>TERMINATED.
        </h3>
        
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed mb-12 max-w-[320px] mx-auto">
          Unlock the full guide to continue studying. Get full access to all 11 courses and unlimited academic modules.
        </p>
        
        <button 
          onClick={() => navigate('/upgrade')}
          className="w-full max-w-sm bg-teal-custom text-white py-6 rounded-[2.5rem] font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(15,23,42,0.5)] active:scale-95 transition-all text-xs flex items-center justify-center gap-4 border border-white/10 hover:bg-teal-900"
        >
          Upgrade Now
        </button>
        
        <button 
          onClick={() => {
            setLockTriggered(false);
            setShowPreview(false);
          }}
          className="mt-8 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-teal-500 transition-colors"
        >
          ← Return to Chapter Hub
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-900 overflow-hidden">
      <header className="h-16 px-4 bg-gray-800 text-white flex items-center justify-between z-50 flex-shrink-0">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="leading-tight overflow-hidden">
            <h1 className="text-sm font-black truncate uppercase tracking-tight">{course.code}: Reading Hub</h1>
            {activeChapter && <p className="text-[10px] text-teal-400 font-bold uppercase truncate">{activeChapter.title}</p>}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {isLocked && !lockTriggered && (
            <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full mr-2">
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Free Preview</p>
            </div>
          )}
          {currentChapterUrl && (
            <a href={currentChapterUrl} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-white p-2">
              <ExternalLink size={18} />
            </a>
          )}
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-teal-400 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      <div className="flex-1 relative bg-black overflow-hidden flex flex-col">
        {lockTriggered || (isLocked && !isEligibleForPreview) ? (
          <LockedScreen />
        ) : currentChapterUrl ? (
          <div className="flex-1 flex flex-col min-h-0 relative">
            {(!isLocked || showPreview) ? (
              <>
                {/* Professional Top Navigation Bar */}
                <div className="bg-slate-950/80 backdrop-blur-xl border-b border-white/5 h-12 flex items-center justify-between px-6 z-40 absolute top-0 left-0 right-0">
                  <div className="flex-1" />
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">
                      Page {currentPage} {isLocked && 'of 8'}
                    </p>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <form onSubmit={handleJumpPage} className="flex items-center gap-2">
                       <input 
                         type="number"
                         placeholder="Page..."
                         value={jumpInput}
                         onChange={(e) => setJumpInput(e.target.value)}
                         className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold text-white placeholder:text-white/20 outline-none focus:ring-1 focus:ring-teal-500/50"
                       />
                    </form>
                  </div>
                </div>

                <div className="flex-1 relative overflow-hidden bg-slate-900 flex items-center justify-center pt-12">
                  <iframe 
                    src={embedUrl} 
                    className="w-full h-full border-none pointer-events-none" 
                    title="PDF Viewer"
                    allow="autoplay; fullscreen"
                    referrerPolicy="no-referrer"
                    id="pdf-iframe"
                    key={`pdf-${refreshKey}`}
                  />
                </div>

                {/* Navigation Footer */}
                <div className="bg-gray-800 border-t border-gray-700 p-4 flex gap-4 z-30">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-30 disabled:hover:bg-gray-700 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <ChevronLeft size={18} />
                    Previous
                  </button>
                  <button 
                    onClick={handleNextPage}
                    className={cn(
                      "flex-[1.5] py-4 rounded-2xl font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 text-xs shadow-lg",
                      isLocked && currentPage === 8 
                        ? "bg-amber-500 hover:bg-amber-600 text-black shadow-amber-500/20" 
                        : "bg-teal-custom hover:bg-teal-900 text-white shadow-teal-500/10"
                    )}
                  >
                    {isLocked && currentPage === 8 ? (
                      <>🚀 Unlock Full Course</>
                    ) : (
                      <>
                        Next
                        <ChevronLeft size={18} className="rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 bg-gray-800 rounded-[2.5rem] flex items-center justify-center text-teal-500 mb-8 shadow-2xl">
                  <FileText size={40} />
                </div>
                <h2 className="text-2xl font-black text-white mb-4 editorial-header">Standard Access</h2>
                <p className="text-gray-400 text-sm mb-10 max-w-xs italic editorial-header">
                  You can read the first 8 pages for free. Upgrade to Premium for full offline access.
                </p>
                <button 
                  onClick={() => setShowPreview(true)}
                  className="bg-white text-black px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center gap-3 text-sm"
                >
                  📖 Read 8 Pages for Free
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-gray-800 rounded-3xl flex items-center justify-center text-gray-600">
              <FileText size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-white font-bold">Content Awaiting Upload</h3>
              <p className="text-gray-500 text-sm max-w-xs">The curriculum for this module is currently being optimized for mobile display.</p>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-black uppercase tracking-widest text-gray-900">Chapters</h2>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-900">
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
                            navigate(`/pdf/${c.id}`);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-all ${
                          isCurrentCourse ? 'bg-teal-50 text-teal-900 ring-1 ring-teal-200' : 'hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${
                          isCurrentCourse ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {c.code.split(' ')[0]}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className={`text-xs font-black ${isCurrentCourse ? 'text-gray-900' : 'text-gray-400'}`}>{c.code}</p>
                          <p className="text-[10px] font-bold text-gray-400 truncate">{c.title}</p>
                        </div>
                      </button>
                      
                      {isCurrentCourse && (
                        <div className="mt-2 ml-4 pl-4 border-l border-gray-100 space-y-2">
                          {course.chapters && course.chapters.length > 0 ? (
                            course.chapters.map((chapter, idx) => (
                              <button
                                key={chapter.id}
                                onClick={() => handleChapterSelect(chapter)}
                                className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-colors ${
                                  activeChapter?.id === chapter.id ? 'bg-gray-50 text-teal-600 font-bold' : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <span className="text-[10px] uppercase tracking-wider truncate">
                                  {idx + 1}. {chapter.title}
                                </span>
                                {completed.includes(chapter.id) && (
                                  <CheckCircle2 size={14} className="text-teal-500 flex-shrink-0" />
                                )}
                              </button>
                            ))
                          ) : (
                            <p className="p-3 text-[9px] font-bold text-gray-400 uppercase tracking-widest italic">No chapters loaded</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">
                  EDUHUB CURRICULUM SYNC
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
