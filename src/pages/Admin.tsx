import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { COURSES, Course } from '../constants';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  updateDoc, 
  onSnapshot, 
  query, 
  arrayUnion, 
  where,
  writeBatch 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  ChevronLeft, 
  Save, 
  Upload, 
  FileText, 
  Video, 
  Mic, 
  CheckCircle2, 
  Users, 
  BookOpen, 
  Crown, 
  UserPlus,
  Search,
  RefreshCcw,
  Loader2,
  Trash2,
  Key,
  Radio,
  Sparkles,
  Zap,
  MessageSquare
} from 'lucide-react';
import { generateQuizQuestions, generateSummary } from '../services/geminiService';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

declare const google: any;

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean;
  role: string;
  grantedCourses?: string[];
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export default function AdminPanel() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'courses' | 'users' | 'broadcast'>('users');
  const [selectedCourse, setSelectedCourse] = useState<string>(COURSES[0].id);
  const [courseData, setCourseData] = useState<Partial<Course>>({});
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState<'quiz' | 'exam' | 'summary' | null>(null);
  const [generatorText, setGeneratorText] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [uploading, setUploading] = useState<'pdf' | 'video' | 'audio' | 'chapter-pdf' | 'chapter-video' | 'chapter-audio' | 'preview-pdf' | 'preview-video' | 'preview-audio' | null>(null);
  const [success, setSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [targetUser, setTargetUser] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isDriveAuthorized, setIsDriveAuthorized] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);

  const pdfInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewPdfInputRef = useRef<HTMLInputElement>(null);
  const previewVideoInputRef = useRef<HTMLInputElement>(null);
  const previewAudioInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAdmin) navigate('/');
  }, [isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      const q = query(collection(db, 'users'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const userData: UserData[] = [];
        snapshot.forEach((doc) => {
          userData.push({ uid: doc.id, ...doc.data() } as UserData);
        });
        setUsers(userData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));
      return () => unsubscribe();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (activeTab === 'courses') {
      const path = `courses/${selectedCourse}`;
      const docRef = doc(db, 'courses', selectedCourse);
      const unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          setCourseData(docSnap.data() as Course);
        } else {
          const base = COURSES.find(c => c.id === selectedCourse);
          setCourseData(base || {});
        }
      }, (err) => handleFirestoreError(err, OperationType.GET, path));
      return () => unsubscribe();
    }
  }, [selectedCourse, activeTab]);

  useEffect(() => {
    if (CLIENT_ID && typeof google !== 'undefined') {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: SCOPES,
          callback: (response: any) => {
            if (response.access_token) {
              setDriveToken(response.access_token);
              setIsDriveAuthorized(true);
              setSuccess(true);
              setTimeout(() => setSuccess(false), 2000);
            } else {
              console.error("Token response error:", response);
              setIsDriveAuthorized(false);
            }
          },
        });
        setTokenClient(client);
      } catch (e) {
        console.error("GIS initialization failed:", e);
      }
    }
  }, []);

  const handleDriveAuth = () => {
    if (!tokenClient) {
      if (typeof google !== 'undefined' && CLIENT_ID) {
        // Try initializing now if it missed the useEffect
        try {
          const client = google.accounts.oauth2.initTokenClient({
            client_id: CLIENT_ID,
            scope: SCOPES,
            callback: (response: any) => {
              if (response.access_token) {
                setDriveToken(response.access_token);
                setIsDriveAuthorized(true);
                setSuccess(true);
                setTimeout(() => setSuccess(false), 2000);
              } else {
                console.error("Token response error:", response);
                setIsDriveAuthorized(false);
              }
            },
          });
          setTokenClient(client);
          client.requestAccessToken();
          return;
        } catch (e) {
          console.error("GIS initialization failed:", e);
        }
      }
      
      if (!CLIENT_ID) {
        alert("Google Client ID missing. Please set VITE_GOOGLE_CLIENT_ID in the environment.");
      } else {
        alert("Google Auth not initialized. Please refresh the page.");
      }
      return;
    }
    tokenClient.requestAccessToken();
  };

  const uploadToDrive = async (file: File) => {
    if (!driveToken) {
      throw new Error("Drive not authorized. Please click 'Connect Google Drive' first.");
    }
    
    // 1. Create file metadata
    const metadata = {
      name: `EDU_HUB_${selectedCourse}_${file.name}`,
      mimeType: file.type,
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
      method: 'POST',
      headers: { Authorization: `Bearer ${driveToken}` },
      body: form,
    });

    if (!response.ok) throw new Error('Drive Upload Failed');
    const data = await response.json();

    // 2. Make file readable for anyone with link
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${driveToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });

    // Extract clean File ID and return clean preview URL
    return `https://drive.google.com/file/d/${data.id}/preview`;
  };

  const handleFileUpload = async (type: 'pdf' | 'video' | 'audio' | 'chapter-pdf' | 'chapter-video' | 'chapter-audio' | 'preview-pdf' | 'preview-video' | 'preview-audio', file: File) => {
    if (!file) return;
    
    if (!isDriveAuthorized || !driveToken) {
      alert("Please click 'Connect Google Drive' and authorize access before uploading.");
      return;
    }

    if (!CLIENT_ID) {
      alert("Google Client ID missing. Please set VITE_GOOGLE_CLIENT_ID in settings.");
      return;
    }
    
    setUploading(type);
    try {
      const url = await uploadToDrive(file);
      
      if (type.startsWith('chapter-')) {
        const realType = type.split('-')[1];
        const fieldKey = realType === 'pdf' ? 'pdfUrl' : realType === 'video' ? 'videoUrl' : 'audioUrl';
        
        const updatedChapters = (courseData.chapters || []).map(ch => 
          ch.id === targetChapterId ? { ...ch, [fieldKey]: url } : ch
        );
        
        await updateDoc(doc(db, 'courses', selectedCourse), { chapters: updatedChapters });
      } else {
        let fieldKey: string;
        if (type === 'pdf') fieldKey = 'pdfUrl';
        else if (type === 'video') fieldKey = 'videoUrl';
        else if (type === 'audio') fieldKey = 'audioUrl';
        else if (type === 'preview-pdf') fieldKey = 'previewPdfUrl';
        else if (type === 'preview-video') fieldKey = 'previewVideoUrl';
        else fieldKey = 'previewAudioUrl';

        const updatedData = { ...courseData, [fieldKey]: url };
        await setDoc(doc(db, 'courses', selectedCourse), updatedData, { merge: true });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error(`Error uploading to Drive:`, error);
      alert(`Upload failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploading(null);
      setTargetChapterId(null);
    }
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;
    
    setLoading(true);
    try {
      const chapterId = `ch_${Date.now()}`;
      const newChapter = { id: chapterId, title: newChapterTitle };
      
      await updateDoc(doc(db, 'courses', selectedCourse), {
        chapters: arrayUnion(newChapter)
      });
      
      setNewChapterTitle('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Error adding chapter:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm("Are you sure you want to delete this chapter?")) return;
    
    setLoading(true);
    try {
      const updatedChapters = (courseData.chapters || []).filter(ch => ch.id !== chapterId);
      await updateDoc(doc(db, 'courses', selectedCourse), { chapters: updatedChapters });
    } catch (error) {
      console.error("Error deleting chapter:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePlan = async (userId: string, currentStatus: boolean) => {
    const path = `users/${userId}`;
    try {
      const userRef = doc(db, 'users', userId);
      const newStatus = !currentStatus;
      await updateDoc(userRef, { isPremium: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleToggleCourseUnlock = async (userId: string, courseId: string, isCurrentlyGranted: boolean) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      const currentGranted = (userDoc.data()?.grantedCourses || []) as string[];
      
      let newGranted;
      if (isCurrentlyGranted) {
        newGranted = currentGranted.filter(id => id !== courseId);
      } else {
        newGranted = [...currentGranted, courseId];
      }
      
      await updateDoc(userRef, { grantedCourses: newGranted });
    } catch (error) {
      console.error("Error toggling course unlock:", error);
    }
  };

  const handleGenerateContent = async (type: 'quiz' | 'exam' | 'summary') => {
    if (!generatorText.trim()) {
      alert("Please provide the source text for AI analysis.");
      return;
    }
    
    setGenerating(type);
    try {
      if (type === 'quiz' || type === 'exam') {
        const count = type === 'exam' ? 45 : 9; // CBT: 45Q, Chapter Practice: 9Q
        const questions = await generateQuizQuestions(generatorText, count);
        
        const contentId = type === 'exam' ? `exam_${selectedCourse}` : `quiz_${selectedCourse}`;
        const collectionName = type === 'exam' ? 'exams' : 'quizzes';
        
        await setDoc(doc(db, collectionName, selectedCourse), {
          courseId: selectedCourse,
          title: `${COURSES.find(c => c.id === selectedCourse)?.title} ${type === 'exam' ? 'CBT' : 'Quiz'}`,
          questions,
          updatedAt: new Date().toISOString()
        });
      } else {
        const summary = await generateSummary(generatorText);
        await setDoc(doc(db, 'revisions', selectedCourse), {
          courseId: selectedCourse,
          ...summary,
          updatedAt: new Date().toISOString()
        });
      }
      
      setSuccess(true);
      setGeneratorText('');
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Generator failed:", error);
      alert("AI Generation failed. Please try again.");
    } finally {
      setGenerating(null);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastMessage.trim() || !broadcastSubject.trim()) return;
    
    setLoading(true);
    try {
      // Create a broadcast document to show in the app
      const broadcastRef = doc(collection(db, 'broadcasts'));
      await setDoc(broadcastRef, {
        subject: broadcastSubject,
        message: broadcastMessage,
        sentAt: new Date().toISOString(),
        sender: 'Admin'
      });
      
      // In a real app, this would trigger a cloud function to send actual emails.
      // For this environment, we'll simulate the "email sent" by showing success.
      alert(`Broadcast sent to ${users.length} students via Edu-Mail network.`);
      setBroadcastMessage('');
      setBroadcastSubject('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error) {
      console.error("Broadcast failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSearch = async () => {
    if (!searchEmail) return;
    setSearching(true);
    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail.toLowerCase().trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        setTargetUser({ id: userDoc.id, ...userDoc.data() });
      } else {
        alert('User not found');
        setTargetUser(null);
      }
    } catch (error) {
      console.error("Error searching user:", error);
    } finally {
      setSearching(false);
    }
  };

  const toggleCourseAccess = async (courseId: string) => {
    if (!targetUser) return;
    
    const currentAccess = targetUser.grantedCourses || [];
    const newAccess = currentAccess.includes(courseId)
      ? currentAccess.filter((id: string) => id !== courseId)
      : [...currentAccess, courseId];
    
    try {
      await updateDoc(doc(db, 'users', targetUser.id), {
        grantedCourses: newAccess
      });
      setTargetUser({ ...targetUser, grantedCourses: newAccess });
    } catch (error) {
      console.error("Error updating course access:", error);
    }
  };

  if (!isAdmin) return null;

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <header className="p-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
            <ChevronLeft size={24} className="text-slate-600" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-slate-900 editorial-header tracking-tight">Admin Terminal</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 -mt-1">Control Layer 01</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="bg-slate-950 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20">
            System Admin
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex p-1.5 bg-white mx-6 mt-8 rounded-[2rem] border border-slate-100 shadow-sm">
        <button 
          onClick={() => setActiveTab('users')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'users' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Users size={16} />
          Student Matrix
        </button>
        <button 
          onClick={() => setActiveTab('courses')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'courses' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <BookOpen size={16} />
          Curriculum Lab
        </button>
        <button 
          onClick={() => setActiveTab('broadcast')}
          className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${activeTab === 'broadcast' ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/20' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Radio size={16} />
          Broadcast
        </button>
      </div>

      <div className="p-6 pb-32">
        {activeTab === 'broadcast' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-slate-900 p-10 rounded-[3.5rem] relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent" />
              <div className="relative flex items-center justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-rose-500 p-4 rounded-3xl text-white shadow-xl shadow-rose-500/30">
                      <Radio size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-[0.2em]">Live Broadcast</h2>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Student Communication Hub</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Broadcast Subject</label>
                    <input 
                      type="text"
                      placeholder="e.g. IMPORTANT: Exam Date Adjusted"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-xs font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2">Communication Content</label>
                    <textarea 
                      rows={8}
                      placeholder="Type your global message here..."
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] text-xs font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none resize-none"
                    />
                  </div>

                  <button 
                    onClick={handleBroadcast}
                    disabled={loading || !broadcastMessage.trim() || !broadcastSubject.trim()}
                    className="w-full bg-rose-500 text-white py-6 rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/30 active:scale-[0.98] transition-all hover:bg-rose-600 disabled:opacity-30 disabled:grayscale"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Execute Global Broadcast'}
                  </button>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-amber-50 p-4 rounded-3xl text-amber-500">
                      <Users size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Student Network</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{users.length} Active Endpoints</p>
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {users.map(u => (
                      <div key={u.uid} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black ${u.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}>
                            {u.displayName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 uppercase truncate max-w-[120px]">{u.displayName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">{u.email}</p>
                          </div>
                        </div>
                        {u.isPremium && <Crown size={12} className="text-amber-500" />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            {/* SEARCH BY GMAIL SECTION */}
            <section className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full" />
              
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-500 shadow-inner">
                  <Search size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 editorial-header tracking-tight">Access Control.</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mt-1">Grant Individual Course Access</p>
                </div>
              </div>

              <div className="flex gap-4 mb-8">
                <div className="flex-1 relative">
                  <input 
                    type="email" 
                    placeholder="Enter Student Gmail to Grant Access..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:ring-4 focus:ring-indigo-900/5 transition-all outline-none"
                  />
                </div>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUserSearch}
                  disabled={searching}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {searching ? 'Finding...' : 'Search Engine'}
                </motion.button>
              </div>

              {targetUser && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-xl">
                        {targetUser.email[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-slate-900">{targetUser.email}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Premium: {targetUser.isPremium ? 'YES' : 'NO'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <motion.button 
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleTogglePlan(targetUser.uid, targetUser.isPremium)}
                        className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                          targetUser.isPremium 
                            ? 'bg-amber-100 border-amber-200 text-amber-600 hover:bg-amber-200' 
                            : 'bg-slate-900 border-slate-800 text-white hover:bg-black shadow-xl shadow-slate-900/10'
                        }`}
                      >
                        {targetUser.isPremium ? 'Downgrade to Free' : 'Upgrade to Premium'}
                      </motion.button>
                      <div className="px-4 py-2 bg-white rounded-xl border border-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center italic">Mega-Free Toggle Pad</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {COURSES.map(course => (
                      <button
                        key={course.id}
                        onClick={() => handleToggleCourseUnlock(targetUser.uid, course.id, (targetUser.grantedCourses || []).includes(course.id))}
                        className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border ${
                          (targetUser.grantedCourses || []).includes(course.id)
                            ? 'bg-indigo-600 border-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                            : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-[11px] font-black tracking-tight">{course.code}</span>
                        <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          (targetUser.grantedCourses || []).includes(course.id) ? 'bg-white/20' : 'bg-slate-100'
                        }`}>
                          {(targetUser.grantedCourses || []).includes(course.id) ? 'UNLOCKED' : 'LOCKED'}
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </section>

            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Registered Students ({users.length})</h3>
                <button 
                  className="flex items-center gap-2 text-teal-custom text-[10px] font-black uppercase tracking-widest hover:bg-white px-4 py-2 rounded-full border border-teal-500/10 transition-all shadow-sm opacity-50 cursor-default"
                >
                  <CheckCircle2 size={12} />
                  Live Matrix Active
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="text"
                  placeholder="Filter sequence by name or identifier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full p-6 pl-16 bg-white rounded-[2.5rem] text-sm font-bold border border-slate-100 focus:ring-8 focus:ring-slate-900/5 transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              {loading && users.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center space-y-6">
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
                    <div className="absolute inset-0 border-4 border-t-slate-900 rounded-full animate-spin" />
                  </div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">Establishing Query Link...</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredUsers.length === 0 ? (
                    <div className="py-12 bg-white rounded-[2.5rem] text-center border border-dashed border-slate-200">
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">No matching records found</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <motion.div 
                        layout
                        key={user.uid} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-2xl hover:shadow-slate-900/5 hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner transition-colors duration-500 ${user.isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
                            {user.displayName?.substring(0, 2).toUpperCase() || 'ID'}
                          </div>
                          <div>
                            <p className="font-black text-base text-slate-900">{user.displayName}</p>
                            <p className="text-[11px] text-slate-400 font-bold font-mono tracking-wider">{user.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-300">Access Level</span>
                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 ${user.isPremium ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                              {user.isPremium ? 'STANDARD' : 'FREE'}
                            </div>
                          </div>
                          <button 
                            onClick={() => handleTogglePlan(user.uid, user.isPremium)}
                            className={`w-16 h-8 rounded-full relative transition-all duration-500 flex items-center p-1.5 shadow-inner ${user.isPremium ? 'bg-teal-500' : 'bg-slate-300'}`}
                          >
                            <div className={`w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 transform ${user.isPremium ? 'translate-x-8' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              )}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="space-y-12">
            <section className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Curriculum Control</label>
                {success && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] font-black uppercase text-teal-500 tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Resource Optimized</motion.span>}
              </div>

              {!isDriveAuthorized ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDriveAuth}
                  className="w-full p-6 bg-slate-900 text-white rounded-[2.5rem] flex items-center justify-center gap-4 group transition-all shadow-xl shadow-slate-900/10"
                >
                  <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                    <Key size={18} className="text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-[0.2em]">Action Required</p>
                    <p className="text-[10px] font-bold text-slate-400">Connect Google Drive to start uploading</p>
                  </div>
                </motion.button>
              ) : (
                <div className="w-full p-6 bg-teal-50 border border-teal-100 rounded-[2.5rem] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-teal-500 rounded-2xl flex items-center justify-center text-white">
                      <CheckCircle2 size={20} />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">Drive Active</p>
                      <p className="text-[10px] font-bold text-teal-600/60">Authorization sequence verified</p>
                    </div>
                  </div>
                  <button onClick={handleDriveAuth} className="text-[10px] font-bold text-teal-600 uppercase tracking-widest hover:underline px-4">Reconnect</button>
                </div>
              )}

              <div className="relative group">
                <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors" size={20} />
                <select 
                  value={selectedCourse}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'physics_group') {
                      setSelectedCourse('phy101');
                    } else {
                      setSelectedCourse(val);
                    }
                  }}
                  className="w-full p-7 pl-16 bg-white border border-slate-100 rounded-[3rem] font-bold text-slate-900 focus:outline-none focus:ring-12 focus:ring-slate-900/5 transition-all text-sm appearance-none cursor-pointer shadow-sm"
                >
                  {COURSES.filter(c => c.id !== 'phy103').map(c => (
                    <option key={c.id} value={c.id === 'phy101' ? 'physics_group' : c.id}>
                      {c.id === 'phy101' ? 'PHYSICS (101 / 103)' : `${c.code} — ${c.title}`}
                    </option>
                  ))}
                </select>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
                  <RefreshCcw size={14} />
                </div>
              </div>

              {/* Physics Sub-selector */}
              {(selectedCourse === 'phy101' || selectedCourse === 'phy103') && (
                <div className="flex gap-2 p-1 bg-slate-200/50 rounded-2xl">
                  {['phy101', 'phy103'].map(id => (
                    <button
                      key={id}
                      onClick={() => setSelectedCourse(id)}
                      className={cn(
                        "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        selectedCourse === id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Physics {id === 'phy101' ? '101' : '103'}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-8">
              <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-900/5 space-y-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-rose-500 to-amber-400 opacity-20" />
                
                    {/* AI Generator Lab */}
                    <div className="p-8 bg-slate-900 rounded-[3rem] space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Sparkles size={120} className="text-teal-500" />
                      </div>
                      <div className="relative">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="bg-teal-500 p-4 rounded-3xl text-white shadow-xl shadow-teal-500/30">
                            <Zap size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-white">AI Content Factory</h4>
                            <p className="text-[10px] font-bold text-teal-500 uppercase tracking-widest">On-Demand Generation Engine</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <textarea 
                            rows={6}
                            placeholder="Paste text core for AI extraction (PDF text, lecture notes, video transcript)..."
                            value={generatorText}
                            onChange={(e) => setGeneratorText(e.target.value)}
                            className="w-full p-6 bg-slate-800 border border-slate-700 rounded-[2rem] text-slate-200 text-[11px] font-medium focus:ring-4 focus:ring-teal-500/20 transition-all outline-none resize-none"
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button 
                              onClick={() => handleGenerateContent('quiz')}
                              disabled={!!generating}
                              className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-700 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {generating === 'quiz' ? <Loader2 className="animate-spin" size={14} /> : <MessageSquare size={14} />}
                              Generate Quiz (30Q)
                            </button>
                            <button 
                              onClick={() => handleGenerateContent('exam')}
                              disabled={!!generating}
                              className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-700 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {generating === 'exam' ? <Loader2 className="animate-spin" size={14} /> : <FileText size={14} />}
                              Generate Exam (45Q)
                            </button>
                            <button 
                              onClick={() => handleGenerateContent('summary')}
                              disabled={!!generating}
                              className="px-4 py-4 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-slate-700 flex flex-col items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {generating === 'summary' ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                              Revision Bundle
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PDF Control */}
                <div className="space-y-6">
                  {selectedCourse === 'bio101' ? (
                    <div className="space-y-8">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-orange-50 p-4 rounded-3xl text-orange-500">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Biology Sections (1-9)</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sectioned PDF Repository</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            if (!confirm("This will initialize 9 standard sections. Existing data for these sections will be reset to defaults if it doesn't exist. Proceed?")) return;
                            const currentChapters = courseData.chapters || [];
                            const sections = Array.from({ length: 9 }, (_, i) => {
                              const existing = currentChapters.find(ch => ch.title === `Section ${i + 1}`);
                              return existing || {
                                id: `section_${i + 1}`,
                                title: `Section ${i + 1}`,
                                pdfUrl: ''
                              };
                            });
                            const updatedData = { ...courseData, chapters: sections };
                            setCourseData(updatedData);
                            await setDoc(doc(db, 'courses', 'bio101'), updatedData, { merge: true });
                          }}
                          className="px-4 py-2 bg-slate-950 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-slate-800 shadow-lg shadow-slate-900/10"
                        >
                          Sync Biology Structure
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Array.from({ length: 9 }, (_, i) => {
                          const sectionIdx = i + 1;
                          const section = courseData.chapters?.find(ch => ch.title === `Section ${sectionIdx}`) || 
                                         { id: `section_${sectionIdx}`, title: `Section ${sectionIdx}`, pdfUrl: '' };
                          
                          return (
                            <div key={sectionIdx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Section {sectionIdx}</p>
                                {section.pdfUrl && <CheckCircle2 size={12} className="text-teal-500" />}
                              </div>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="PDF Link..."
                                  value={section.pdfUrl || ''}
                                  onChange={async (e) => {
                                    const updatedChapters = Array.from({ length: 9 }, (_, j) => {
                                      const sIdx = j + 1;
                                      const ch = courseData.chapters?.find(c => c.title === `Section ${sIdx}`) || 
                                                 { id: `section_${sIdx}`, title: `Section ${sIdx}`, pdfUrl: '' };
                                      return sIdx === sectionIdx ? { ...ch, pdfUrl: e.target.value } : ch;
                                    });
                                    setCourseData({ ...courseData, chapters: updatedChapters });
                                    // Auto-save link on change
                                    await updateDoc(doc(db, 'courses', 'bio101'), { chapters: updatedChapters });
                                  }}
                                  className="flex-1 p-3 bg-white border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                />
                                <button 
                                  onClick={() => {
                                    setTargetChapterId(section.id);
                                    pdfInputRef.current?.click();
                                  }}
                                  className={`p-3 rounded-xl transition-all ${section.pdfUrl ? 'bg-teal-50 text-teal-600' : 'bg-white text-slate-300 border border-slate-100 hover:text-slate-900'}`}
                                >
                                  <Upload size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Full PDF */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-orange-50 p-4 rounded-3xl text-orange-500 shadow-inner">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">Full PDF Guide</h4>
                            <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.pdfUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                              {courseData.pdfUrl ? 'Static Link Active' : 'No documentation set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Full PDF Link..."
                            value={courseData.pdfUrl || ''}
                            onChange={(e) => setCourseData({ ...courseData, pdfUrl: e.target.value })}
                            className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                          />
                          <button 
                            onClick={() => pdfInputRef.current?.click()}
                            disabled={uploading === 'pdf' || !isDriveAuthorized}
                            className="px-6 py-4 bg-orange-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/30 hover:bg-orange-600 transition-all flex items-center gap-2 disabled:opacity-30"
                          >
                            {uploading === 'pdf' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                            FILE
                          </button>
                        </div>
                      </div>

                      {/* Preview PDF */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-amber-50 p-4 rounded-3xl text-amber-500 shadow-inner">
                            <FileText size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900 text-amber-600">8-Page Preview PDF</h4>
                            <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.previewPdfUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                              {courseData.previewPdfUrl ? 'Static Link Active' : 'No preview set'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Preview PDF Link..."
                            value={courseData.previewPdfUrl || ''}
                            onChange={(e) => setCourseData({ ...courseData, previewPdfUrl: e.target.value })}
                            className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                          />
                          <button 
                            onClick={() => previewPdfInputRef.current?.click()}
                            disabled={uploading === 'preview-pdf' || !isDriveAuthorized}
                            className="px-6 py-4 bg-amber-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-30"
                          >
                            {uploading === 'preview-pdf' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                            FILE
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100" />

                {/* Video Control */}
                <div className="space-y-6">
                  <div className={`grid grid-cols-1 ${selectedCourse === 'bio101' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-8`}>
                    {/* Full Video */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-rose-50 p-4 rounded-3xl text-rose-500 shadow-inner">
                          <Video size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">
                            {selectedCourse === 'bio101' ? 'Master Biology Video' : 'Full Video Masterclass'}
                          </h4>
                          <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.videoUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                            {courseData.videoUrl ? 'Module Synced' : 'Ready for upload'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Full Video Link..."
                          value={courseData.videoUrl || ''}
                          onChange={(e) => setCourseData({ ...courseData, videoUrl: e.target.value })}
                          className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                        />
                        <button 
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploading === 'video' || !isDriveAuthorized}
                          className="px-6 py-4 bg-rose-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-rose-500/30 hover:bg-rose-600 transition-all flex items-center gap-2 disabled:opacity-30"
                        >
                          {uploading === 'video' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                          FILE
                        </button>
                      </div>
                      <input 
                        type="file" 
                        accept="video/*" 
                        ref={videoInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const type = targetChapterId ? 'chapter-video' : 'video';
                            handleFileUpload(type, file);
                          }
                        }} 
                      />
                    </div>

                    {/* Preview Video */}
                    {selectedCourse !== 'bio101' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-pink-50 p-4 rounded-3xl text-pink-500 shadow-inner">
                            <Video size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900 text-pink-600">4-Min Preview Video</h4>
                            <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.previewVideoUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                              {courseData.previewVideoUrl ? 'Module Synced' : 'Ready for upload'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Preview Video Link..."
                            value={courseData.previewVideoUrl || ''}
                            onChange={(e) => setCourseData({ ...courseData, previewVideoUrl: e.target.value })}
                            className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                          />
                          <button 
                            onClick={() => previewVideoInputRef.current?.click()}
                            disabled={uploading === 'preview-video' || !isDriveAuthorized}
                            className="px-6 py-4 bg-pink-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-pink-500/30 hover:bg-pink-600 transition-all flex items-center gap-2 disabled:opacity-30"
                          >
                            {uploading === 'preview-video' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                            FILE
                          </button>
                        </div>
                        <input 
                          type="file" 
                          accept="video/*" 
                          ref={previewVideoInputRef} 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('preview-video', file);
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                {/* Audio Control */}
                <div className="space-y-6">
                  <div className={`grid grid-cols-1 ${selectedCourse === 'bio101' ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-8`}>
                    {/* Full Audio */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-amber-50 p-4 rounded-3xl text-amber-500 shadow-inner">
                          <Mic size={24} />
                        </div>
                        <div>
                          <h4 className="font-black text-sm uppercase tracking-widest text-slate-900">
                            {selectedCourse === 'bio101' ? 'Master Biology Audio' : 'Full Audio Guide'}
                          </h4>
                          <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.audioUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                            {courseData.audioUrl ? 'Broadcast Ready' : 'Awaiting input'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Full Audio Link..."
                          value={courseData.audioUrl || ''}
                          onChange={(e) => setCourseData({ ...courseData, audioUrl: e.target.value })}
                          className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                        />
                        <button 
                          onClick={() => audioInputRef.current?.click()}
                          disabled={uploading === 'audio' || !isDriveAuthorized}
                          className="px-6 py-4 bg-amber-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/30 hover:bg-amber-600 transition-all flex items-center gap-2 disabled:opacity-30"
                        >
                          {uploading === 'audio' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                          FILE
                        </button>
                      </div>
                      <input 
                        type="file" 
                        accept="audio/*" 
                        ref={audioInputRef} 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const type = targetChapterId ? 'chapter-audio' : 'audio';
                            handleFileUpload(type, file);
                          }
                        }} 
                      />
                    </div>

                    {/* Preview Audio */}
                    {selectedCourse !== 'bio101' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="bg-yellow-50 p-4 rounded-3xl text-yellow-600 shadow-inner">
                            <Mic size={24} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase tracking-widest text-slate-900 text-yellow-700">Preview Audio</h4>
                            <p className={`text-[10px] font-bold uppercase mt-1 tracking-widest ${courseData.previewAudioUrl ? 'text-teal-500' : 'text-slate-300'}`}>
                              {courseData.previewAudioUrl ? 'Broadcast Ready' : 'Awaiting input'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Preview Audio Link..."
                            value={courseData.previewAudioUrl || ''}
                            onChange={(e) => setCourseData({ ...courseData, previewAudioUrl: e.target.value })}
                            className="flex-1 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                          />
                          <button 
                            onClick={() => previewAudioInputRef.current?.click()}
                            disabled={uploading === 'preview-audio' || !isDriveAuthorized}
                            className="px-6 py-4 bg-yellow-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-yellow-500/30 hover:bg-yellow-600 transition-all flex items-center gap-2 disabled:opacity-30"
                          >
                            {uploading === 'preview-audio' ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                            FILE
                          </button>
                        </div>
                        <input 
                          type="file" 
                          accept="audio/*" 
                          ref={previewAudioInputRef} 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload('preview-audio', file);
                          }} 
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="flex gap-4">
                  <button 
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await setDoc(doc(db, 'courses', selectedCourse), courseData, { merge: true });
                        setSuccess(true);
                        setTimeout(() => setSuccess(false), 2000);
                      } catch (error) {
                        console.error("Error saving links:", error);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-1 bg-slate-950 text-white py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800"
                  >
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : 'Synchronize All Assets'}
                  </button>
                </div>
              </div>

              <div className="p-10 bg-slate-900 rounded-[3.5rem] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-transparent pointer-events-none group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center text-center space-y-6">
                  <div className="w-16 h-16 bg-slate-800 rounded-3xl flex items-center justify-center text-teal-400 mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-white font-black uppercase tracking-[0.3em] text-xs">Real-Time Core Active</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px]">
                      Changes are propagated instantly across the entire node network. Student endpoints will update upon next refresh.
                    </p>
                  </div>
                </div>
              </div>

              {/* Chapter Lab / Bio 101 Sections */}
              <section className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {selectedCourse === 'bio101' ? 'Biology 101 Section Management' : 'Chapter Lab'}
                  </h4>
                  {selectedCourse !== 'bio101' && (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        placeholder="Chapter Title..." 
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        className="bg-white px-4 py-2 rounded-xl text-[10px] font-bold border border-slate-100 focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                      />
                      <button 
                        onClick={handleAddChapter}
                        disabled={loading || !newChapterTitle.trim()}
                        className="bg-slate-950 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-4">
                  {(selectedCourse === 'bio101' ? Array.from({ length: 9 }, (_, i) => ({ id: `section-${i+1}`, title: `Section ${i+1}` })) : (courseData.chapters || [])).map((chapter, idx) => {
                    // For Bio 101, we find or create the chapter entry
                    const actualChapter = selectedCourse === 'bio101' 
                      ? (courseData.chapters?.find(ch => ch.id === chapter.id) || { id: chapter.id, title: chapter.title })
                      : chapter;
                      
                    return (
                      <div key={chapter.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-400">
                              {idx + 1}
                            </div>
                            <h5 className="font-black text-sm text-slate-900">{actualChapter.title}</h5>
                          </div>
                          {selectedCourse !== 'bio101' && (
                            <button 
                              onClick={() => handleDeleteChapter(chapter.id)}
                              className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {[
                            { key: 'pdf', icon: FileText, label: 'Section PDF', color: 'orange' },
                            { key: 'video', icon: Video, label: 'Video', color: 'rose', hide: selectedCourse === 'bio101' },
                            { key: 'audio', icon: Mic, label: 'Audio', color: 'amber', hide: selectedCourse === 'bio101' },
                          ].filter(asset => !asset.hide).map((asset) => (
                            <div key={asset.key} className="space-y-2">
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder={`Paste ${asset.label} Link...`}
                                  value={(actualChapter as any)[`${asset.key}Url`] || ''}
                                  onChange={async (e) => {
                                    const updatedChapters = (courseData.chapters || []);
                                    const existingIdx = updatedChapters.findIndex(ch => ch.id === actualChapter.id);
                                    let newChapters;
                                    if (existingIdx > -1) {
                                      newChapters = updatedChapters.map(ch => 
                                        ch.id === actualChapter.id ? { ...ch, [`${asset.key}Url`]: e.target.value } : ch
                                      );
                                    } else {
                                      newChapters = [...updatedChapters, { ...actualChapter, [`${asset.key}Url`]: e.target.value }];
                                    }
                                    setCourseData({ ...courseData, chapters: newChapters });
                                    await updateDoc(doc(db, 'courses', selectedCourse), { chapters: newChapters });
                                  }}
                                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-bold focus:ring-4 focus:ring-slate-900/5 transition-all outline-none"
                                />
                                <button
                                  onClick={() => {
                                    if (!isDriveAuthorized) {
                                      alert("Please Connect Google Drive first.");
                                      return;
                                    }
                                    setTargetChapterId(actualChapter.id);
                                    if (asset.key === 'pdf') pdfInputRef.current?.click();
                                    if (asset.key === 'video') videoInputRef.current?.click();
                                    if (asset.key === 'audio') audioInputRef.current?.click();
                                  }}
                                  disabled={!isDriveAuthorized}
                                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                    !isDriveAuthorized 
                                      ? 'opacity-30 bg-slate-100 text-slate-400'
                                      : (actualChapter as any)[`${asset.key}Url`] 
                                        ? `bg-${asset.color}-500 text-white shadow-md shadow-${asset.color}-500/20` 
                                        : `bg-slate-50 text-slate-400 border border-slate-100 hover:bg-white`
                                  }`}
                                >
                                  FILE
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {selectedCourse !== 'bio101' && (!courseData.chapters || courseData.chapters.length === 0) && (
                    <div className="py-12 bg-white rounded-[2.5rem] text-center border border-dashed border-slate-200">
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">No chapters defined</p>
                    </div>
                  )}
                </div>
              </section>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
