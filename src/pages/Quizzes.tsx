import React from 'react';
import { useNavigate } from 'react-router-dom';
import { COURSES } from '../constants';
import { ChevronLeft, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export default function Quizzes() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="p-6 bg-white border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-xl">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Quiz Center</h1>
        </div>
        <HelpCircle className="text-indigo-500" />
      </header>

      <div className="p-6 space-y-4">
        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white mb-8 shadow-xl">
          <h3 className="text-lg font-black mb-1">Challenge Yourself</h3>
          <p className="text-indigo-100 text-xs mb-4">Quick assessments to test your knowledge after each module.</p>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-white/20 w-fit px-3 py-1 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Quizzes Available
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {COURSES.map((course, index) => (
            <motion.button
              key={course.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/quiz/${course.id}`)}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-200 transition-all group"
            >
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                  Q
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm leading-tight">{course.title}</h4>
                  <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{course.code} • 15 questions</p>
                </div>
              </div>
              <ArrowRight size={20} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
