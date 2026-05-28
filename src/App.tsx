import React, { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import Layout from './components/Layout';
import Home from './pages/Home';
import CalendarPage from './pages/Calendar';
import RequestForm from './pages/Request';
import AdminDashboard from './pages/Admin';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onNavigate={setCurrentPage} />;
      case 'calendar':
        return <CalendarPage onNavigate={setCurrentPage} />;
      case 'request':
        return <RequestForm />;
      case 'admin':
        return <AdminDashboard onNavigate={setCurrentPage} />;
      default:
        return <Home onNavigate={setCurrentPage} />;
    }
  };

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      <AnimatePresence mode="wait">
        {renderPage()}
      </AnimatePresence>
    </Layout>
  );
}
