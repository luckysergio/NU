import React from 'react';
import Sidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-linear-to-br from-emerald-50 to-green-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden bg-linear-to-br from-emerald-50/50 to-green-50/50">
        
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="container mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>

      <style>{`
        /* Custom Scrollbar untuk Main Content */
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #d1fae5;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #10b981;
          border-radius: 10px;
          transition: all 0.2s ease;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #059669;
        }

        /* Untuk Firefox */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #10b981 #d1fae5;
        }
      `}</style>
    </div>
  );
};

export default MainLayout;