import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../components/AuthProvider';
import { BookOpen, Sparkles, Brain, Clock, ChevronRight, Zap, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { COURSES, ELIGIBLE_FREE_COURSES } from '../constants';

interface RevisionData {
  courseId: string;
  summary: string;
  keyConcepts: string[];
  flashcards: { question: string; answer: string }[];
}

export default function RevisionHub() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [revisions, setRevisions] = useState<RevisionData[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFlashcard, setShowFlashcard] = useState<number | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  useEffect(() => {
    const fetchRevisions = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'revisions'));
        const querySnapshot = await getDocs(q);
        const data: RevisionData[] = [];
        querySnapshot.forEach((doc) => {
          data.push({ courseId: doc.id, ...doc.data() } as RevisionData);
        });
        setRevisions(data);
      } catch (error) {
        console.error("Error fetching revisions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRevisions();
  }, [user]);

  const currentRevision = revisions.find(r => r.courseId === selectedCourse);
  const isLocked = !profile?.isPremium && !(selectedCourse && profile?.grantedCourses?.includes(selectedCourse));
  const isEligibleForPreview = selectedCourse ? ELIGIBLE_FREE_COURSES.includes(selectedCourse) : false;
  const effectivelyLocked = isLocked && !isEligibleForPreview;
  const cardLimit = isLocked ? 2 : (currentRevision?.flashcards.length || 0);

  const LockedOverlay = () => (
    <div className="bg-slate-950 p-12 rounded-[3.5rem] text-center space-y-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.1)_0%,transparent_70%)]" />
      <div className="relative z-10">
        <div className="w-20 h-20 bg-white/5 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center text-teal-400 mx-auto mb-8 border border-white/10">
          <Lock size={32} />
        </div>
        <h3 className="text-white font-black uppercase tracking-tighter text-2xl italic mb-4">ACCESS RESTRICTED.</h3>
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-10 max-w-xs mx-auto">
          Revision summaries and flashcard banks are exclusive to Standard members and authorized accounts.
        </p>
        <button 
          onClick={() => navigate('/upgrade')}
          className="w-full max-w-sm bg-teal-custom text-white py-5 rounded-3xl font-black uppercase tracking-[0.3em] shadow-2xl shadow-teal-900/40 text-[10px] border border-white/10 active:scale-95 transition-all"
        >
          Upgrade for Full Access
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Revision Center</h1>
            <p className="text-sm text-slate-500 font-medium tracking-tight">AI-Generated Summaries & Flashcards</p>
          </div>
          <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
            <Brain size={24} />
          </div>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Knowledge...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Course Sidebar */}
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Knowledge Bases</h2>
              <div className="grid gap-2">
                {COURSES.map((course) => {
                  const hasRevision = revisions.some(r => r.courseId === course.id);
                  return (
                    <button
                      key={course.id}
                      onClick={() => setSelectedCourse(course.id)}
                      disabled={!hasRevision}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-3xl text-left transition-all group",
                        selectedCourse === course.id 
                          ? "bg-slate-900 text-white shadow-xl shadow-slate-900/20" 
                          : hasRevision 
                            ? "bg-white text-slate-700 hover:bg-white/80" 
                            : "bg-slate-100 text-slate-300 cursor-not-allowed grayscale"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black",
                          selectedCourse === course.id ? "bg-slate-800" : "bg-slate-50 text-slate-400"
                        )}>
                          {course.code.split(' ')[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight">{course.code}</p>
                          <p className="text-[10px] opacity-60 font-bold uppercase truncate max-w-[120px]">{course.title}</p>
                        </div>
                      </div>
                      {hasRevision && <ChevronRight size={16} className={cn("transition-transform", selectedCourse === course.id ? "rotate-90" : "group-hover:translate-x-1")} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="md:col-span-2 space-y-8">
              {!selectedCourse ? (
                <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-100 flex flex-col items-center gap-6">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200">
                    <BookOpen size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Select a Knowledge Base</h3>
                    <p className="text-[10px] text-slate-400 font-bold max-w-xs leading-relaxed uppercase tracking-widest">
                      Choose a course to access AI-curated revision materials, core concepts, and active-recall flashcards.
                    </p>
                  </div>
                </div>
              ) : effectivelyLocked ? (
                <LockedOverlay />
              ) : currentRevision ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={selectedCourse}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    {/* Summary Card */}
                    <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-slate-100 space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-50 p-3 rounded-2xl text-amber-500">
                          <Sparkles size={20} />
                        </div>
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Executive Summary</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {currentRevision.summary}
                      </p>
                      
                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Core Concepts</h4>
                        <div className="flex flex-wrap gap-2">
                          {currentRevision.keyConcepts.map((concept, i) => (
                            <span key={i} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100">
                              {concept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Flashcard Section */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                          <div className="bg-rose-50 p-3 rounded-2xl text-rose-500">
                            <Zap size={20} />
                          </div>
                          <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Active Recall Cards</h3>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {currentRevision.flashcards.length} Cards
                        </p>
                      </div>

                      <div className="grid gap-4">
                        {currentRevision.flashcards.slice(0, cardLimit).map((card, i) => (
                          <div 
                            key={i}
                            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
                            onClick={() => {
                              if (showFlashcard === i) {
                                setCardFlipped(!cardFlipped);
                              } else {
                                setShowFlashcard(i);
                                setCardFlipped(false);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-[10px] font-black text-teal-500 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-lg">
                                Card {i + 1}
                              </span>
                              <Clock size={14} className="text-slate-300" />
                            </div>
                            
                            <div className="min-h-[60px] flex items-center">
                              <p className={cn(
                                "text-sm font-black uppercase tracking-tight leading-relaxed",
                                showFlashcard === i && cardFlipped ? "text-teal-600" : "text-slate-900"
                              )}>
                                {showFlashcard === i && cardFlipped ? card.answer : card.question}
                              </p>
                            </div>

                            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-center">
                              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest animate-pulse">
                                {showFlashcard === i && cardFlipped ? "Tap to reveal question" : "Tap to reveal answer"}
                              </p>
                            </div>
                          </div>
                        ))}

                        {isLocked && currentRevision.flashcards.length > cardLimit && (
                          <div className="bg-slate-900 p-8 rounded-[2.5rem] text-center space-y-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
                              <Lock size={20} />
                            </div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs">Standard Resource Locked</h4>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                              Upgrade to Standard Access to unlock {currentRevision.flashcards.length - cardLimit} more flashcards and full summaries for all sections.
                            </p>
                            <button 
                              onClick={() => navigate('/upgrade')}
                              className="w-full bg-teal-custom text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-teal-500/20"
                            >
                              Unlock Full Suite
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="bg-white rounded-[3rem] p-12 text-center border border-slate-100 flex flex-col items-center gap-6">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No revision data available for this course.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
