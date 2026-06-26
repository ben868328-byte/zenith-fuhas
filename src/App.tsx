/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { Layout } from './components/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import VideoLessons from './pages/VideoLessons';
import VideoViewer from './pages/VideoViewer';
import AudioLessons from './pages/AudioLessons';
import AudioViewer from './pages/AudioViewer';
import Quizzes from './pages/Quizzes';
import QuizViewer from './pages/QuizViewer';
import PDFViewer from './pages/PDFViewer';
import CBTExam from './pages/CBTExam';
import Upgrade from './pages/Upgrade';
import Profile from './pages/Profile';
import AdminPanel from './pages/Admin';

import RevisionHub from './pages/Revision';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/courses" element={<CourseList />} />
            <Route path="/courses/:id" element={<CourseDetail />} />
            <Route path="/videos" element={<VideoLessons />} />
            <Route path="/video/:id" element={<VideoViewer />} />
            <Route path="/audio" element={<AudioLessons />} />
            <Route path="/audio/:id" element={<AudioViewer />} />
            <Route path="/quizzes" element={<Quizzes />} />
            <Route path="/quiz/:id" element={<QuizViewer />} />
            <Route path="/pdf/:id" element={<PDFViewer />} />
            <Route path="/exam" element={<CBTExam />} />
            <Route path="/revision" element={<RevisionHub />} />
            <Route path="/upgrade" element={<Upgrade />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
