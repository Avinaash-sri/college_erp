import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';
import FloatingAIAssistant from './FloatingAIAssistant';

export default function Layout() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <Header
        onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 relative">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Floating AI Assistant Widget - STRICTLY STUDENT-ONLY */}
      {user?.role === 'student' && <FloatingAIAssistant />}
    </div>
  );
}

