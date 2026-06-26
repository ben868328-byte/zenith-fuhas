import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { COURSES, ELIGIBLE_FREE_COURSES } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, CheckCircle2, Lock, ArrowRight, HelpCircle, Trophy, Crown, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Question {
  q: string;
  options: string[];
  correct: number;
}

export default function QuizViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const course = COURSES.find(c => c.id === id);
  const isExam = location.pathname.includes('/exam/');

  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isLockedLimitReached, setIsLockedLimitReached] = useState(false);
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes for CBT

  const isLocked = !profile?.isPremium && !(id && profile?.grantedCourses?.includes(id));
  const isEligibleForPreview = id ? ELIGIBLE_FREE_COURSES.includes(id) : false;
  const effectivelyLocked = isLocked && !isEligibleForPreview;

  useEffect(() => {
    async function fetchQuestions() {
      if (!id) return;
      setLoading(true);
      try {
        const collectionName = isExam ? 'exams' : 'quizzes';
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setQuestions(docSnap.data().questions || []);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [id, isExam]);

  useEffect(() => {
    if (!isExam || isFinished) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isExam, isFinished]);

  const limit = !isLocked ? questions.length : 5;

  const handleNext = () => {
    if (selected === questions[currentIdx].correct) {
      setScore(prev => prev + 1);
    }

    if (currentIdx + 1 >= limit) {
      if (isLocked) {
        setIsLockedLimitReached(true);
      } else if (currentIdx + 1 >= questions.length) {
        setIsFinished(true);
      } else {
        setCurrentIdx(prev => prev + 1);
        setSelected(null);
      }
    } else {
      setCurrentIdx(prev => prev + 1);
      setSelected(null);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (!course) return null;

  if (effectivelyLocked) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.1)_0%,transparent_70%)]" />
        
        <div className="relative z-10">
          <div className="w-28 h-28 bg-white/5 backdrop-blur-2xl rounded-[3rem] flex items-center justify-center text-teal-400 mx-auto mb-10 border border-white/10 shadow-[0_0_50px_rgba(20,184,166,0.2)]">
            <Lock size={56} strokeWidth={2.5} />
          </div>
          
          <div className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-full mb-6 inline-block">
            <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">⚠️ Academic Access Restricted</p>
          </div>
          
          <h3 className="text-white font-black uppercase tracking-tighter text-3xl mb-4 italic leading-none editorial-header">
            STUDY PASS<br/>REQUIRED.
          </h3>
          
          <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em] leading-relaxed mb-12 max-w-[320px] mx-auto">
            This CBT/Quiz module is restricted to Standard users only. Get full access to unlock this curriculum module.
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
  }

  if (isLockedLimitReached) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 items-center justify-center p-8 text-center animate-in zoom-in-95 duration-500">
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
            You have reached the end of the Free Preview. Upgrade to Premium to see the full {questions.length} questions and your diagnostic score.
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
  }

  if (isFinished) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <header className="p-6 pt-12 pb-6 flex items-center justify-between border-b border-slate-50">
          <h1 className="font-black text-xl text-slate-900 editorial-header uppercase tracking-widest">Quiz Report.</h1>
          <div className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Level 100</div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto">
          <div className="w-48 h-48 bg-slate-50 rounded-[3rem] flex items-center justify-center mb-10 relative">
            <Trophy size={80} className="text-teal-custom" />
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-amber-400 text-amber-900 w-16 h-16 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 border-white"
            >
              <span className="text-[10px] font-black">GRADE</span>
              <span className="text-xl font-black">{Math.round((score / limit) * 100)}%</span>
            </motion.div>
          </div>

          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight editorial-header">Performance Log.</h2>
          <p className="text-slate-500 mb-12 italic editorial-header">You secured {score} of {limit} markers in the {course.code} evaluation.</p>

          {isLocked && (
            <section className="w-full bg-slate-950 p-8 rounded-[2.5rem] mb-12 text-white text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-custom/20 rounded-full translate-x-16 -translate-y-16" />
              <div className="flex items-center gap-3 mb-4">
                <Crown className="text-amber-400" size={24} />
                <h4 className="text-xs font-black uppercase tracking-[0.2em]">Free Limit Reached</h4>
              </div>
              <p className="text-xs text-white/60 mb-6 italic editorial-header leading-relaxed">
                Free limit reached! Upgrade to Premium to see the final 40+ questions and your diagnostic score across all 11 courses.
              </p>
              <button 
                onClick={() => navigate('/upgrade')}
                className="w-full bg-teal-custom text-white font-black text-xs py-4 rounded-2xl shadow-xl shadow-teal-900/40 active:scale-95 transition-all"
              >
                Access Full Bank
              </button>
            </section>
          )}

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => { setCurrentIdx(0); setScore(0); setIsFinished(false); setSelected(null); }}
              className="flex-1 bg-slate-50 text-slate-400 font-bold py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Restart
            </button>
            <button 
              onClick={() => navigate(`/courses/${course.id}`)}
              className="flex-1 bg-teal-custom text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-900/10 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && questions.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-8 text-center">
        <HelpCircle size={48} className="text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 mb-2">No Questions Available</h3>
        <p className="text-slate-500 text-sm mb-6">The evaluation module for {course.code} is currently being updated.</p>
        <button onClick={() => navigate(-1)} className="bg-teal-custom text-white px-6 py-2 rounded-xl font-bold">Return to Hub</button>
      </div>
    );
  }

  const question = questions[currentIdx];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 pt-12 pb-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{course.code} Log</h1>
            <p className="text-xs font-bold text-slate-900 uppercase">Question {currentIdx + 1} of {limit}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isExam && (
            <div className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-2xl border font-black text-xs",
              timeLeft < 300 ? "bg-red-50 border-red-100 text-red-500 animate-pulse" : "bg-slate-50 border-slate-100 text-slate-900"
            )}>
              <Timer size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
            <div 
              className="h-full bg-teal-custom transition-all duration-500" 
              style={{ width: `${((currentIdx + 1) / limit) * 100}%` }}
            />
          </div>
        </div>
      </header>

      <div className="p-6 flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <motion.div
          key={currentIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-10"
        >
          <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-slate-900/5 relative">
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-teal-custom text-white p-3 rounded-2xl shadow-xl shadow-teal-900/20">
              <HelpCircle size={24} />
            </div>
            <p className="text-xl font-bold text-slate-900 text-center leading-relaxed pt-2 editorial-header italic">
              "{question.q}"
            </p>
          </div>

          <div className="space-y-4">
            {question.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={cn(
                  "w-full p-5 rounded-[2rem] border-2 transition-all flex items-center gap-4 text-xs font-bold",
                  selected === i 
                    ? "bg-teal-custom border-teal-custom text-white shadow-xl shadow-teal-900/10 scale-[1.02]" 
                    : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-xl border-2 flex items-center justify-center shrink-0 font-black text-[10px]",
                  selected === i ? "bg-white border-white text-teal-custom" : "border-slate-100 text-slate-300"
                )}>
                  {String.fromCharCode(65 + i)}
                </div>
                {opt}
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      <footer className="p-8 bg-white border-t border-slate-50 sticky bottom-0">
        {isLocked && currentIdx + 1 === limit && selected !== null ? (
          <div className="space-y-4">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-relaxed">
                Free limit reached! Upgrade to see the final 40+ questions and your score.
              </p>
            </div>
            <button
              onClick={handleNext}
              className="w-full bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-[2.5rem] shadow-2xl shadow-slate-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              Audit Partial Result
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            disabled={selected === null}
            className="w-full bg-teal-custom hover:bg-teal-900 text-white font-black text-[10px] uppercase tracking-[0.3em] py-5 rounded-[2.5rem] shadow-2xl shadow-teal-900/20 disabled:opacity-30 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {currentIdx + 1 === limit ? 'Audit Results' : 'Next Entry'}
            <ArrowRight size={18} />
          </button>
        )}
      </footer>
    </div>
  );
}
