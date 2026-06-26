import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (email.toLowerCase() === 'ben868328@gmail.com') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="flex-1 flex flex-col justify-center px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm mx-auto"
        >
          <div className="flex items-center gap-3 mb-12">
            <div className="bg-teal-custom p-2.5 rounded-xl text-white shadow-lg shadow-teal-900/10">
              <GraduationCap size={32} />
            </div>
            <div>
              <h1 className="font-bold text-2xl tracking-tighter text-teal-custom leading-none editorial-header">FUAHSE</h1>
              <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Student Hub</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tight editorial-header">Welcome Back.</h2>
          <p className="text-slate-500 mb-10 italic editorial-header">Please identify yourself to continue.</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 mb-6">
              <AlertCircle size={20} />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-custom transition-all font-medium text-sm"
                  placeholder="student@fuahse.edu.ng"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Secure Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-custom transition-all font-medium text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-custom hover:bg-teal-900 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-teal-900/10 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70"
            >
              {loading ? 'Authenticating...' : 'Enter Hub'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-10 text-center text-slate-500 text-sm font-medium">
            New to the Hub?{' '}
            <Link to="/signup" className="text-teal-custom font-black hover:underline underline-offset-8 decoration-2">
              Create Account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
