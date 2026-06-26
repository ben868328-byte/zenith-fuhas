import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, CheckCircle2, CreditCard, ChevronLeft, MessageSquare, Rocket, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthProvider';

export default function Upgrade() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isPremium = profile?.isPremium;

  const plans = [
    {
      id: 'single',
      name: 'Single Course',
      price: '1,000',
      description: 'Full access to a single course of your choice.',
      features: ['Full PDF Modules', 'Unlimited Video Lessons', 'Complete Audio Guides', 'Exam Simulator'],
      color: 'bg-white text-teal-custom',
    },
    {
      id: 'all',
      name: 'All Access',
      price: '7,300',
      description: 'Master everything. Total access to all courses.',
      features: ['11 Full Courses', 'Complete Audio Guides', 'Priority Support', 'Offline Downloads'],
      color: 'bg-teal-custom text-white',
      popular: true,
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 bg-white border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl">
          <ChevronLeft size={24} className="text-slate-600" />
        </button>
        <h1 className="text-lg font-black text-slate-900 editorial-header uppercase tracking-widest">
          {isPremium ? 'Success Hub' : 'Premium Hub'}
        </h1>
        <div className="w-10" />
      </header>

      <div className="p-6 pb-24 space-y-10">
        {!isPremium ? (
          <>
            <div className="text-center px-4">
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight editorial-header">Go Unlimited.</h2>
              <div className="flex flex-col gap-2">
                <p className="text-slate-500 italic editorial-header">Break the 8-page limit and master your courses.</p>
                <div className="bg-teal-50 border border-teal-100 p-4 rounded-2xl mt-4">
                  <p className="text-[10px] font-black text-teal-700 uppercase tracking-[0.1em] leading-relaxed">
                    Unlocking Premium grants instant access to <span className="text-teal-900 underline decoration-2">6 Additional Master-Level Courses</span> including French, MTH 101, and more!
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "relative p-8 rounded-[2.5rem] shadow-xl transition-all",
                    plan.color,
                    plan.popular ? "shadow-teal-900/10 scale-100 ring-2 ring-teal-custom" : "shadow-slate-900/5"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                      Best Value
                    </div>
                  )}
                  <h3 className="text-xl font-black mb-1 uppercase tracking-tighter">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-black">₦</span>
                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                  </div>
                  <p className={cn("text-xs font-medium mb-8 leading-relaxed opacity-80", plan.popular ? "text-teal-50" : "text-slate-500")}>
                    {plan.description}
                  </p>
                  <ul className="space-y-4">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-3 text-xs font-bold">
                        <CheckCircle2 size={16} className={plan.popular ? "text-teal-200" : "text-teal-custom"} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>

            <section className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/5 space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="text-teal-custom" size={24} />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Payment Details</h3>
              </div>
              
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl">
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank</span>
                  <span className="text-xs font-bold text-slate-900 uppercase">Moniepoint</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Name</span>
                  <span className="text-xs font-bold text-slate-900 uppercase">Chisimdi Victor Johnpaul</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</span>
                  <span className="text-xs font-black text-teal-custom tracking-wider">9160683313</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-bold uppercase text-center leading-relaxed">
                Send proof of payment to activate instantly
              </p>

              <a 
                href="https://wa.me/2349160683313" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#25D366] text-white py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <MessageSquare size={20} />
                Verify on WhatsApp
              </a>
            </section>
          </>
        ) : (
          <div className="space-y-8 pt-4">
            <div className="text-center px-4">
              <div className="w-20 h-20 bg-teal-custom rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-8 shadow-2xl shadow-teal-500/20">
                <Sparkles size={40} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight editorial-header leading-none">Success!</h2>
              <p className="text-slate-500 italic editorial-header">You have full access to 1st Semester.</p>
            </div>

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 blur-[60px] rounded-full" />
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-teal-500/20 p-3 rounded-2xl">
                  <Rocket size={24} className="text-teal-400" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest leading-tight">Semester 2 Roadmap</h3>
              </div>
              
              <div className="space-y-6">
                <p className="text-xs text-white/70 italic editorial-header leading-relaxed">
                  2nd Semester PDF & Video modules are currently in production. Our academic team is working tirelessly to deliver the highest quality resources for your next phase.
                </p>
                
                <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-teal-400">Current Phase</span>
                    <span className="bg-teal-custom/20 text-teal-400 px-3 py-1 rounded-full text-[9px] font-black uppercase">Active</span>
                  </div>
                  <p className="text-sm font-bold">1st Semester Mastery</p>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-teal-custom shadow-[0_0_10px_rgba(20,184,166,0.5)]" />
                  </div>
                </div>

                <div className="bg-white px-6 py-6 rounded-3xl text-slate-900 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Coming Next</p>
                  <p className="text-sm font-black uppercase italic tracking-tighter">Stay tuned for the launch date!</p>
                </div>
              </div>
            </motion.div>

            <button 
              onClick={() => navigate('/')}
              className="w-full bg-white border border-slate-200 text-slate-900 py-5 rounded-[2rem] font-black text-sm active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              Return to Student Hub
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
