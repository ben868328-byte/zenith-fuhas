export interface Chapter {
  id: string;
  title: string;
  pdfUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  previewPdfUrl?: string;
  previewVideoUrl?: string;
  previewAudioUrl?: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  description: string;
  image: string;
  pdfUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  previewPdfUrl?: string;
  previewVideoUrl?: string;
  previewAudioUrl?: string;
  chapters?: Chapter[];
}

export const COURSES: Course[] = [
  { id: 'chm101', code: 'CHM 101', title: 'General Chemistry I', description: 'Fundamental principles of chemistry.', image: 'https://images.unsplash.com/photo-1541339907198-e08756eaa539?auto=format&fit=crop&q=80&w=400', videoUrl: 'https://www.youtube.com/watch?v=k3rRrl9J2F4' },
  { id: 'phy101', code: 'PHY 101', title: 'General Physics I', description: 'Basic mechanics and properties of matter.', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400' },
  { id: 'phy103', code: 'PHY 103', title: 'General Physics III', description: 'Advanced mechanics and thermodynamics.', image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400' },
  { id: 'bio101', code: 'BIO 101', title: 'General Biology I', description: 'Introduction to biological sciences.', image: 'https://images.unsplash.com/photo-1530210124550-912dc1381cb8?auto=format&fit=crop&q=80&w=400', videoUrl: 'https://drive.google.com/file/d/1gfrv07F7wqQr_RkOMmLEEnYjQa3b9RI1/preview' },
  { id: 'mth101', code: 'MTH 101', title: 'General Mathematics I', description: 'Algebra and Trigonometry.', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=400' },
  { id: 'cos101', code: 'COS 101', title: 'Introduction to Computer Science', description: 'Basics of computing and problem solving.', image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400' },
  { id: 'gst101', code: 'GST 101', title: 'Use of English', description: 'Basic communication skills in English.', image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400' },
  { id: 'get101', code: 'GET 101', title: 'Engineer-in-Society', description: 'Role of engineering in modern society.', image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=400' },
  { id: 'get103', code: 'GET 103', title: 'Engineering Graphics', description: 'Introduction to technical drawing.', image: 'https://images.unsplash.com/photo-1536412597336-ade727560201?auto=format&fit=crop&q=80&w=400' },
  { id: 'french', code: 'FRN 101', title: 'Elementary French', description: 'Basic grammar and conversation.', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=400' },
  { id: 'igb101', code: 'IGB 101', title: 'Igbo Language I', description: 'Basic Igbo language and culture.', image: 'https://images.unsplash.com/photo-1523050335102-c32c75130629?auto=format&fit=crop&q=80&w=400' },
  { id: 'gls101', code: 'GLS 101', title: 'General Library Studies', description: 'Information literacy and research skills.', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&q=80&w=400' },
];

export const ELIGIBLE_FREE_COURSES = ['phy101', 'bio101', 'gst101', 'get103', 'igb101'];

export const ADMIN_EMAIL = 'ben868328@gmail.com';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isPremium: boolean; // Standard Access
  role: 'student' | 'admin';
  enrolledCourses: string[];
  grantedCourses?: string[]; // Single Course Unlock IDs
  completedChapters?: { [courseId: string]: string[] }; // courseId -> list of chapterIds
}
