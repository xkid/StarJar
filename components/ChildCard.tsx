import React from 'react';
import { Child } from '../types';
import { Trophy, ChevronRight, GripVertical } from 'lucide-react';

interface ChildCardProps extends React.HTMLAttributes<HTMLDivElement> {
  child: Child;
  onClick: () => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onClick, className, ...props }) => {
  return (
    <div 
      className={`group relative bg-white rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden flex items-center gap-3 sm:gap-5 ${className || ''}`}
      {...props}
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-indigo-400 p-1">
        <GripVertical className="w-6 h-6" />
      </div>

      <div 
        className="flex-1 flex items-center gap-3 sm:gap-5 cursor-pointer"
        onClick={onClick}
      >
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 p-1 shadow-inner overflow-hidden">
            <img 
              src={child.avatarUrl} 
              alt={child.name} 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {child.totalPoints >= 100 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              <span className="hidden sm:inline">Lv.{Math.floor(child.totalPoints / 100) + 1}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors truncate">
            {child.name}
          </h3>
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-black ${child.totalPoints < 0 ? 'text-rose-500' : 'text-indigo-500'}`}>
              {child.totalPoints}
            </span>
            <span className="text-sm font-medium text-slate-400">pts</span>
          </div>
        </div>

        <div className="text-slate-300 group-hover:text-indigo-400 transition-colors">
          <ChevronRight className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default ChildCard;