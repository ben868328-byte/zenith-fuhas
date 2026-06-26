import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { COURSES, Course } from '../constants';
import { useAuth } from '../components/AuthProvider';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { ChevronLeft, Play, Pause, Lock, Volume2, Headphones } from 'lucide-react';
import { motion } from 'motion/react';
import { getDrivePreviewUrl } from '../lib/utils';

export default function AudioViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [course, setCourse] = useState<Course | undefined>(COURSES.find(c => c.id === id));
  const [loading, setLoading] = useState(true);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!id) return;
    const docRef = doc(db, 'courses', id);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setCourse(docSnap.data() as Course);
      }
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, `courses/${id}`);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [id]);

  useEffect(() => {
    if (isPlaying && audioRef.current) {
      const interval = setInterval(() => {
        setProgress(audioRef.current?.currentTime || 0);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  if (loading) return (
    <div className="min-h-screen bg-teal-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
    </div>
  );

  if (!course) return null;

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
      setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isFree = profile && !profile.isPremium && !(id && profile?.grantedCourses?.includes(id));
  const rawAudioUrl = isFree ? (course.previewAudioUrl || course.audioUrl) : course.audioUrl;
  const isDriveAudio = rawAudioUrl?.includes('drive.google.com');
  const drivePreviewUrl = getDrivePreviewUrl(rawAudioUrl);

  return (
    <div className="flex flex-col min-h-screen bg-teal-50">
      <header className="p-4 flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-xl text-gray-600 shadow-sm">
          <ChevronLeft size={20} />
        </button>
        <span className="text-xs font-bold text-teal-600 tracking-widest uppercase">Audio Hub</span>
        <div className="w-9" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {isDriveAudio ? (
          <div className="w-full aspect-video bg-teal-600 rounded-[3rem] shadow-2xl overflow-hidden mb-12">
            <iframe 
              src={drivePreviewUrl}
              className="w-full h-full"
              title="Drive Audio Player"
            />
          </div>
        ) : (
          <div className="w-56 h-56 bg-teal-600 rounded-[3rem] shadow-2xl flex items-center justify-center mb-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Volume2 size={84} className="text-white" />
            </div>
            {isPlaying && (
              <div className="absolute bottom-4 flex gap-1 items-end h-8">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: ['20%', '100%', '20%'] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                    className="w-1 bg-white/40 rounded-full"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="w-full text-center mb-12">
          <h2 className="text-2xl font-black text-teal-900 mb-2">{course.title}</h2>
          <p className="text-teal-600 font-bold text-sm tracking-widest uppercase">{course.code}</p>
        </div>

        <div className="w-full max-w-sm space-y-8">
          {rawAudioUrl && !isDriveAudio ? (
            <>
              <audio 
                ref={audioRef} 
                src={rawAudioUrl} 
                onPlay={() => setIsPlaying(true)} 
                onPause={() => setIsPlaying(false)}
              />
              <div className="space-y-4">
                <div className="h-1.5 w-full bg-teal-100 rounded-full">
                  <div 
                    className="h-full bg-teal-600 rounded-full shadow-[0_0_10px_rgba(13,148,136,0.5)] transition-all" 
                    style={{ width: `${(progress / (audioRef.current?.duration || 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-black text-teal-600/60 uppercase tracking-widest">
                  <span>{formatTime(progress)}</span>
                  <span>{audioRef.current?.duration ? formatTime(audioRef.current.duration) : '--:--'}</span>
                </div>
              </div>

              <div className="flex justify-around items-center">
                <button 
                  onClick={togglePlay}
                  className="bg-teal-600 text-white p-6 rounded-full shadow-xl shadow-teal-600/30 hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
                </button>
              </div>
            </>
          ) : !rawAudioUrl ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-4">
              <Headphones size={48} className="text-teal-200" />
              <p className="text-[10px] font-black uppercase text-teal-900/40 tracking-[0.2em]">Awaiting Broadcast Audio</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
