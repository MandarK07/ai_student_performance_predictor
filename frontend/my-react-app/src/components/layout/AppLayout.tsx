import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans">
      <div className="z-50 shrink-0 no-print">
        <Navbar onToggleSidebar={() => setIsOpen((v) => !v)} />
      </div>
      
      {/* Container for Sidebar and MainContent */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isOpen && (
          <div 
            className="fixed inset-0 top-16 z-40 bg-black/30 backdrop-blur-sm md:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
          />
        )}
        
        {/* Sidebar begins below Navbar */}
        <div className="no-print">
          <Sidebar isOpen={isOpen} />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full relative z-0">
          <div className="max-w-7xl mx-auto h-full animate-in fade-in duration-500">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
