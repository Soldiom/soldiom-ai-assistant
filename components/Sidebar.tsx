import React from 'react';
import { Icons } from '../constants';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, onNewChat }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 z-20 bg-black/20 backdrop-blur-sm transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      {/* Sidebar Content */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-[260px] bg-gray-50 border-r border-gray-200
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Top Header */}
        <div className="p-3">
          <button 
             onClick={onNewChat}
             className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-200/50 transition-colors group text-gray-700"
          >
             <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center">
                    <span className="text-white text-xs font-bold">S</span>
                </div>
                <span className="font-medium text-sm">New chat</span>
             </div>
             <div className="text-gray-400 group-hover:text-gray-600">
                <Icons.NewChat />
             </div>
          </button>
        </div>

        {/* History Area (Mocked for visual) */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          <div className="text-xs font-medium text-gray-500 px-2 py-2">Today</div>
          {['Cybersecurity trends 2025', 'React implementation guide', 'Medical diagnosis check'].map((item, i) => (
             <button key={i} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200/50 truncate">
                {item}
             </button>
          ))}
          
          <div className="text-xs font-medium text-gray-500 px-2 py-2 mt-4">Previous 7 Days</div>
           {['AI Ethics Paper', 'Python script help'].map((item, i) => (
             <button key={i+10} className="w-full text-left px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-200/50 truncate">
                {item}
             </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
           <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-200/50 text-sm text-gray-700">
               <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center font-bold text-xs">
                 U
               </div>
               <div className="flex flex-col text-left">
                  <span className="font-medium">User Account</span>
                  <span className="text-xs text-gray-500">Free Plan</span>
               </div>
           </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;