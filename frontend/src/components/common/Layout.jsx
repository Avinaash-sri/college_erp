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
    <div className="h-screen h-[100dvh] bg-slate-50 flex flex-col font-sans overflow-hidden w-full max-w-full">
      <Header
        onMenuToggle={() => setMobileMenuOpen((prev) => !prev)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex flex-1 min-h-0 w-full overflow-hidden relative">
        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 overflow-y-auto h-full w-full min-w-0">
          <div className="max-w-7xl mx-auto w-full pb-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Assistant Widget - STRICTLY STUDENT-ONLY */}
      {user?.role === 'student' && <FloatingAIAssistant />}
    </div>
  );
}

