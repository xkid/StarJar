import React from 'react';
import { Child } from '../types';
import { Trophy, ChevronRight } from 'lucide-react';

interface ChildCardProps {
  child: Child;
  onClick: () => void;
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-slate-100 overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-purple-400 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      
      <div className="flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-slate-100 p-1 shadow-inner overflow-hidden">
            <img 
              src={child.avatarUrl} 
              alt={child.name} 
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {child.totalPoints >= 100 && (
            <div className="absolute -top-1 -right-1 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm border border-white flex items-center gap-1">
              <Trophy className="w-3 h-3" />
              Lv.{Math.floor(child.totalPoints / 100) + 1}
            </div>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">
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
