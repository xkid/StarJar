import React, { useMemo } from 'react';
import { ActivityLog } from '../types';
import { Calendar, Trash2, Pencil } from 'lucide-react';

interface HistoryViewProps {
  logs: ActivityLog[];
  onEdit: (log: ActivityLog) => void;
  onDelete: (log: ActivityLog) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ logs, onEdit, onDelete }) => {
  const groupedLogs = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    
    // Sort descending
    const sorted = [...logs].sort((a, b) => b.timestamp - a.timestamp);

    sorted.forEach(log => {
      const date = new Date(log.timestamp);
      const key = `${date.getFullYear()}-${date.getMonth()}`; // e.g. "2023-9" for Oct 2023
      if (!groups[key]) groups[key] = [];
      groups[key].push(log);
    });

    return groups;
  }, [logs]);

  const getMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const date = new Date(parseInt(year), parseInt(month));
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No activity recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.keys(groupedLogs).map(key => (
        <div key={key} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 font-semibold text-slate-600 text-sm uppercase tracking-wider">
            {getMonthName(key)}
          </div>
          <div className="divide-y divide-slate-100">
            {groupedLogs[key].map(log => (
              <div key={log.id} className="group flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-10 rounded-full ${
                    log.points > 0 ? 'bg-green-400' : 'bg-rose-400'
                  }`}></div>
                  <div>
                    <p className="font-medium text-slate-800">{log.description}</p>
                    <p className="text-xs text-slate-500 capitalize">
                      {new Date(log.timestamp).toLocaleDateString(undefined, { day: 'numeric', weekday: 'short' })} • {log.category}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className={`text-lg font-bold ${log.points > 0 ? 'text-green-600' : 'text-rose-600'}`}>
                    {log.points > 0 ? '+' : ''}{log.points}
                  </div>
                  
                  {/* Actions - visible on hover or mobile always */}
                  <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => onEdit(log)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDelete(log)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoryView;
