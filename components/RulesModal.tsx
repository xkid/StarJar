import React, { useState, useEffect } from 'react';
import { Rule } from '../types';
import { getRules, saveRules, addRule, updateRule, deleteRule } from '../services/storage';
import { X, Plus, Trash2, Pencil, Save, BookOpen } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [points, setPoints] = useState(5);
  const [category, setCategory] = useState<Rule['category']>('chore');

  useEffect(() => {
    setRules(getRules());
  }, []);

  const handleAddNew = () => {
    setIsAdding(true);
    setEditingId(null);
    setTitle('');
    setPoints(5);
    setCategory('chore');
  };

  const handleEdit = (rule: Rule) => {
    setEditingId(rule.id);
    setIsAdding(false);
    setTitle(rule.title);
    setPoints(rule.points);
    setCategory(rule.category);
  };

  const handleSave = () => {
    if (!title.trim()) return;

    if (isAdding) {
      const newRule = addRule({ title: title.trim(), points, category });
      setRules([...rules, newRule]);
      setIsAdding(false);
    } else if (editingId) {
      const updatedRule: Rule = { id: editingId, title: title.trim(), points, category };
      updateRule(updatedRule);
      setRules(rules.map(r => r.id === editingId ? updatedRule : r));
      setEditingId(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this rule?")) {
      deleteRule(id);
      setRules(rules.filter(r => r.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const cancelEdit = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-b border-slate-100">
          <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            Manage Rules
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {(!isAdding && !editingId) ? (
            <div className="space-y-4">
              <button 
                onClick={handleAddNew}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add New Rule
              </button>

              {rules.length === 0 ? (
                <p className="text-center text-slate-400 py-4 text-sm font-medium">No rules defined yet.</p>
              ) : (
                <ul className="space-y-3">
                  {rules.map(rule => (
                    <li key={rule.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                      <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-bold text-slate-700 truncate">{rule.title}</h4>
                        <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                          {rule.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className={`font-black text-sm whitespace-nowrap px-2 py-1 rounded-lg ${rule.points >= 0 ? 'bg-indigo-100 text-indigo-600' : 'bg-red-100 text-red-600'}`}>
                          {rule.points > 0 ? '+' : ''}{rule.points} pts
                        </span>
                        
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(rule)} className="p-1.5 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded min-w-[28px] flex items-center justify-center">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rule.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded min-w-[28px] flex items-center justify-center">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="space-y-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
              <h3 className="font-bold text-indigo-900 mb-2">
                {isAdding ? 'Create New Rule' : 'Edit Rule'}
              </h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g., Helping hang clothes"
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:ring-0 outline-none font-medium text-slate-700"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Points</label>
                  <input 
                    type="number" 
                    value={points} 
                    onChange={e => setPoints(Number(e.target.value))} 
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-black text-slate-700"
                  />
                  <span className="text-[10px] text-slate-400 font-medium">Use negative for deductions</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value as Rule['category'])}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 outline-none font-medium text-slate-700"
                  >
                    <option value="chore">Chore</option>
                    <option value="behavior">Behavior</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={cancelEdit}
                  className="flex-1 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!title.trim()}
                  className="flex-1 py-2 font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RulesModal;
