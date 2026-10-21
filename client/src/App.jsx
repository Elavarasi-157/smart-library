import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

// Common Components
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { AiAssistantDrawer } from './components/ai/AiAssistantDrawer';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { RoleAuthPage } from './pages/public/RoleAuthPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { BookSearchPage } from './pages/student/BookSearchPage';
import { BookDetailsPage } from './pages/student/BookDetailsPage';
import { MyBooksPage } from './pages/student/MyBooksPage';
import { FinesAndPaymentsPage } from './pages/student/FinesAndPaymentsPage';
import { AcademicSyllabusPage } from './pages/student/AcademicSyllabusPage';
import { AcademicResourcesPage } from './pages/student/AcademicResourcesPage';
import { BookRequestPage } from './pages/student/BookRequestPage';
import { StudentTicketsPage } from './pages/student/StudentTicketsPage';
import { StudentProfilePage } from './pages/student/StudentProfilePage';

// Librarian Pages
import { LibrarianDashboard } from './pages/librarian/LibrarianDashboard';
import { IssueReturnDeskPage } from './pages/librarian/IssueReturnDeskPage';
import { BookInventoryPage } from './pages/librarian/BookInventoryPage';
import { MissingBooksPage } from './pages/librarian/MissingBooksPage';
import { LibrarianTicketsPage } from './pages/librarian/LibrarianTicketsPage';

// HOD Pages
import { HodDashboard } from './pages/hod/HodDashboard';
import { HodBookRequestsPage } from './pages/hod/HodBookRequestsPage';
import { HodResourceApprovalsPage } from './pages/hod/HodResourceApprovalsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagementPage } from './pages/admin/UserManagementPage';
import { AdminBookApprovalsPage } from './pages/admin/AdminBookApprovalsPage';
import { LibrarySettingsPage } from './pages/admin/LibrarySettingsPage';
import { AuditLogsPage } from './pages/admin/AuditLogsPage';
import { AnalyticsReportsPage } from './pages/admin/AnalyticsReportsPage';

function AppContent() {
  const { user, loading } = useAuth();
  
  // Public View State: 'LANDING' | 'AUTH'
  const [publicView, setPublicView] = useState('LANDING');
  const [selectedAuthRole, setSelectedAuthRole] = useState('STUDENT');
  
  // Active Page State for authenticated users
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [searchInitialQuery, setSearchInitialQuery] = useState('');
  const [initialMissingBook, setInitialMissingBook] = useState(null);

  // Right-Side AI Assistant Drawer State
  const [isAiOpen, setIsAiOpen] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') setActivePage('admin-dashboard');
      else if (user.role === 'HOD') setActivePage('hod-dashboard');
      else if (user.role === 'LIBRARIAN') setActivePage('librarian-dashboard');
      else setActivePage('dashboard');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B111E] flex items-center justify-center text-xs font-semibold text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-pulse">
            MIT
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <span>Loading Madras Institute of Technology Library Portal...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, render public pages
  if (!user) {
    if (publicView === 'AUTH') {
      return (
        <RoleAuthPage
          selectedRole={selectedAuthRole}
          onBackClick={() => setPublicView('LANDING')}
          onChangeRole={(newRole) => setSelectedAuthRole(newRole)}
        />
      );
    }
    return (
      <LandingPage
        onSelectRole={(role) => {
          setSelectedAuthRole(role);
          setPublicView('AUTH');
        }}
      />
    );
  }

  // Helper functions for page transitions
  function handleSelectBook(bookId) {
    setSelectedBookId(bookId);
    setActivePage('book-details');
  }

  function handleRaiseMissingTicket(book) {
    setInitialMissingBook(book);
    setActivePage('tickets');
  }

  // Render Role-Based Pages
  function renderActivePage() {
    // Book Details View (accessible to all roles)
    if (activePage === 'book-details' && selectedBookId) {
      return (
        <BookDetailsPage
          bookId={selectedBookId}
          onBack={() => setActivePage('search')}
          onSelectBook={handleSelectBook}
          onRaiseMissingTicket={handleRaiseMissingTicket}
        />
      );
    }

    // Student Pages
    if (activePage === 'dashboard') {
      return (
        <StudentDashboard
          onNavigate={(page) => setActivePage(page)}
          onSelectBook={handleSelectBook}
        />
      );
    }
    if (activePage === 'search') {
      return (
        <BookSearchPage
          initialQuery={searchInitialQuery}
          onSelectBook={handleSelectBook}
        />
      );
    }
    if (activePage === 'my-books') {
      return <MyBooksPage onNavigate={(page) => setActivePage(page)} />;
    }
    if (activePage === 'fines') {
      return <FinesAndPaymentsPage />;
    }
    if (activePage === 'syllabus') {
      return <AcademicSyllabusPage onSelectBook={handleSelectBook} />;
    }
    if (activePage === 'resources') {
      return <AcademicResourcesPage />;
    }
    if (activePage === 'book-requests') {
      return <BookRequestPage />;
    }
    if (activePage === 'tickets') {
      return <StudentTicketsPage initialMissingBook={initialMissingBook} />;
    }
    if (activePage === 'profile' || activePage === 'settings') {
      return <StudentProfilePage />;
    }

    // Librarian Pages
    if (activePage === 'librarian-dashboard') {
      return <LibrarianDashboard onNavigate={(page) => setActivePage(page)} />;
    }
    if (activePage === 'issue-return') {
      return <IssueReturnDeskPage />;
    }
    if (activePage === 'inventory') {
      return <BookInventoryPage />;
    }
    if (activePage === 'missing-books') {
      return <MissingBooksPage />;
    }
    if (activePage === 'librarian-tickets') {
      return <LibrarianTicketsPage />;
    }
    if (activePage === 'crowd-management') {
      return <IssueReturnDeskPage />;
    }

    // HOD Pages
    if (activePage === 'hod-dashboard') {
      return <HodDashboard onNavigate={(page) => setActivePage(page)} />;
    }
    if (activePage === 'hod-requests') {
      return <HodBookRequestsPage />;
    }
    if (activePage === 'hod-resources') {
      return <HodResourceApprovalsPage />;
    }

    // Admin Pages
    if (activePage === 'admin-dashboard') {
      return <AdminDashboard onNavigate={(page) => setActivePage(page)} />;
    }
    if (activePage === 'users') {
      return <UserManagementPage />;
    }
    if (activePage === 'admin-approvals') {
      return <AdminBookApprovalsPage />;
    }
    if (activePage === 'library-settings') {
      return <LibrarySettingsPage />;
    }
    if (activePage === 'audit-logs') {
      return <AuditLogsPage />;
    }
    if (activePage === 'analytics') {
      return <AnalyticsReportsPage />;
    }

    // Fallback to Dashboard
    return <StudentDashboard onNavigate={(page) => setActivePage(page)} onSelectBook={handleSelectBook} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B111E] text-slate-900 dark:text-slate-100 flex flex-col transition-colors font-sans">
      
      {/* Top Fixed Navbar */}
      <Navbar
        onOpenSearch={() => setActivePage('search')}
        activePage={activePage}
        setActivePage={setActivePage}
        onToggleAi={() => setIsAiOpen(!isAiOpen)}
      />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-8">
        {/* Desktop Sidebar */}
        <Sidebar activePage={activePage} setActivePage={setActivePage} />

        {/* Dynamic Page Content View */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* Right-Side AI Assistant Drawer */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        onSelectBook={handleSelectBook}
      />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav activePage={activePage} setActivePage={setActivePage} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
