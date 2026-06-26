import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSES } from '../constants';
import { ChevronLeft, Play, Timer, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function CBTExam() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">CBT Exam Center</h1>
        </div>
        <div className="bg-teal-50 text-teal-600 p-2 rounded-xl">
          <ShieldCheck size={20} />
        </div>
      </header>

      <div className="p-6 space-y-8 flex-1">
        <div className="bg-gradient-to-br from-teal-600 to-teal-800 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl" />
          <h2 className="text-2xl font-black mb-2">FUAHSE Exam Prep</h2>
          <p className="text-teal-100 text-sm mb-6 leading-relaxed">
            Simulate your University exams with real past questions and timed conditions.
          </p>
          <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-teal-200">
            <div className="flex items-center gap-1.5">
              <Timer size={14} /> 60 MINS
            </div>
            <div className="flex items-center gap-1.5">
              <HelpCircle size={14} /> 50 QUES
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 px-1">Select Exam Module</h3>
          {COURSES.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 font-black text-xs">
                  {course.code.split(' ')[0]}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 leading-none">{course.code}</h4>
                  <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">EXAM TYPE A</p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/quiz/${course.id}`)}
                className="bg-gray-50 text-gray-400 p-2.5 rounded-2xl group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm"
              >
                <Play size={18} fill="currentColor" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 bg-white border-t border-gray-100 sticky bottom-0">
        <button 
          className="w-full bg-teal-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-teal-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          Start Full Mock Exam
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
