import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Course } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { db, handleFirestoreError } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { 
  ChevronLeft, 
  FileText, 
  Video, 
  Mic, 
  HelpCircle, 
  Lock,
  Play,
  Download,
  Share2,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'content'>('info');
  const [course, setCourse] = useState<Course | undefined>(COURSES.find(c => c.id === id));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const path = `courses/${id}`;
    const docRef = doc(db, 'courses', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCourse(docSnap.data() as Course);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-custom"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <AlertTriangle size={48} className="text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Course Material Unavailable</h2>
        <p className="text-gray-500 text-sm mb-6">The resources for this course haven't been added yet.</p>
        <button onClick={() => navigate('/courses')} className="text-teal-custom font-bold">Return to courses</button>
      </div>
    );
  }

  const sections = [
    { id: 'pdf', label: 'Read PDF', icon: FileText, color: 'bg-orange-500', limit: '8 Pages Free' },
    { id: 'video', label: 'Watch Video', icon: Video, color: 'bg-rose-500', limit: '4 Mins Free' },
    { id: 'audio', label: 'Listen Audio', icon: Mic, color: 'bg-amber-500', limit: 'Free Access' },
    { id: 'quiz', label: 'Take Quiz', icon: HelpCircle, color: 'bg-indigo-500', limit: '5 Questions' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Hero Section */}
      <div className="relative h-64">
        <img 
          src={course.image} 
          className="w-full h-full object-cover" 
          alt={course.title}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent" />
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 p-2 bg-white/20 backdrop-blur-md rounded-xl text-white hover:bg-white/30 transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <p className="text-teal-300 font-bold text-sm mb-1">{course.code}</p>
          <h1 className="text-2xl font-extrabold leading-tight">{course.title}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-4 gap-2">
        <button 
          onClick={() => setActiveTab('info')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all",
            activeTab === 'info' ? "bg-teal-600 text-white shadow-lg" : "bg-white text-gray-500"
          )}
        >
          Information
        </button>
        <button 
          onClick={() => setActiveTab('content')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all",
            activeTab === 'content' ? "bg-teal-600 text-white shadow-lg" : "bg-white text-gray-500"
          )}
        >
          Course Content
        </button>
      </div>

      {/* Content Area */}
      <div className="px-4 flex-1">
        <AnimatePresence mode="wait">
          {activeTab === 'info' ? (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{course.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <Clock className="text-teal-600 mb-2" size={20} />
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Duration</p>
                  <p className="font-bold text-gray-900">12 Weeks</p>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <CheckCircle2 className="text-teal-600 mb-2" size={20} />
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Certificate</p>
                  <p className="font-bold text-gray-900">Included</p>
                </div>
              </div>

              {!profile?.isPremium && (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                  <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                    <Lock size={18} />
                    Free Access Active
                  </h4>
                  <p className="text-amber-800 text-xs mb-4 leading-relaxed">
                    You're currently on the free plan. Upgrade to get unlimited access to all course materials, videos, and quizzes.
                  </p>
                  <button 
                    onClick={() => navigate('/upgrade')}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                  >
                    Upgrade Now
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-1 gap-4"
            >
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => navigate(`/${section.id}/${course.id}`)}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-all group"
                >
                  <div className={cn(section.color, "p-3 rounded-xl text-white shadow-lg")}>
                    <section.icon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-bold text-gray-900 group-hover:text-teal-600 transition-colors">{section.label}</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{section.limit}</p>
                  </div>
                  <ChevronLeft className="rotate-180 text-gray-300" size={20} />
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-5" />
    </div>
  );
}
