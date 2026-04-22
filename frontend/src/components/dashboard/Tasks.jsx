import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { 
  CheckSquare, Plus, Search, Edit, Trash2, Calendar, 
  Sparkles, X, ChevronRight, ChevronLeft, ArrowRight, ArrowLeft, 
  AlertCircle, Clock, Check, ChevronDown, RefreshCw, List, Kanban 
} from 'lucide-react';

const DEFAULT_TASKS = [
  { id: 1, text: 'Review quarterly tax filing draft', description: 'Cross-check GST breakdowns and check for outlier transactions.', priority: 'high', status: 'To Do', deadline: '5:00 PM' },
  { id: 2, text: 'Deploy checkout auto-reminder logic', description: 'Configure email triggers for outstanding customer balances.', priority: 'medium', status: 'In Progress', deadline: 'Tomorrow' },
  { id: 3, text: 'Consolidate Acrux invoices logs', description: 'Match bank receipts with invoice INV-203940.', priority: 'high', status: 'Completed', deadline: 'Completed' },
  { id: 4, text: 'Follow up with Vikram Singh', description: 'Discuss Apex Tech Labs advisory renewal options.', priority: 'low', status: 'To Do', deadline: 'Friday' }
];

export default function Tasks({ user, onBack }) {
  const navigate = useNavigate();
  // Tasks list
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks from database
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const data = await api.get('/tasks');
        setTasks(data.map(t => ({
          id: t._id,
          text: t.text,
          description: t.description || '',
          priority: t.priority || 'medium',
          status: t.status || (t.done ? 'Completed' : 'To Do'),
          deadline: t.deadline || 'Today'
        })));
      } catch (err) {
        console.error("Failed to fetch tasks from database", err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // --- CRUD States ---
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({ text: '', description: '', priority: 'medium', status: 'To Do', deadline: getTodayString() });

  // --- Search & Filtering ---
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');

  // --- Aggregated Stats ---
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const pending = total - completed;
    const high = tasks.filter(t => t.priority === 'high' && t.status !== 'Completed').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, pending, high, completionRate };
  }, [tasks]);

  // --- Task Transitions ---
  const moveTask = async (taskId, newStatus) => {
    try {
      const updated = await api.put(`/tasks/${taskId}`, { status: newStatus, done: newStatus === 'Completed' });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: updated.status, done: updated.done } : t));
    } catch (err) {
      console.error("Failed to move task", err);
    }
  };

  const [error, setError] = useState('');

  // --- CRUD Handlers ---
  const handleOpenAddModal = (initialStatus = 'To Do') => {
    setEditingTask(null);
    setTaskForm({ text: '', description: '', priority: 'medium', status: initialStatus, deadline: getTodayString() });
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    const isValidDate = task.deadline && /^\d{4}-\d{2}-\d{2}$/.test(task.deadline);
    setTaskForm({
      text: task.text,
      description: task.description || '',
      priority: task.priority || 'medium',
      status: task.status || 'To Do',
      deadline: isValidDate ? task.deadline : getTodayString()
    });
    setError('');
    setShowAddModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.text.trim()) return;

    if (!editingTask && user?.plan === 'Starter' && tasks.length >= 10) {
      setError('Free plan task limit reached (maximum 10 tasks allowed). Please upgrade to Premium for unlimited tasks.');
      return;
    }

    try {
      if (editingTask) {
        // Edit
        const updated = await api.put(`/tasks/${editingTask.id}`, taskForm);
        setTasks(prev => prev.map(t => 
          t.id === editingTask.id 
            ? { ...t, ...updated, id: updated._id } 
            : t
        ));
      } else {
        // Add
        const newTask = {
          ...taskForm,
          description: taskForm.description.trim() || 'No description provided.',
          deadline: taskForm.deadline || getTodayString()
        };
        const created = await api.post('/tasks', newTask);
        setTasks(prev => [...prev, {
          id: created._id,
          text: created.text,
          description: created.description || '',
          priority: created.priority || 'medium',
          status: created.status || 'To Do',
          deadline: created.deadline || 'Today'
        }]);
      }
      setShowAddModal(false);
    } catch (err) {
      console.error("Failed to save task", err);
      setError(err.response?.data?.message || err.message || 'Failed to save task.');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/tasks/${id}`);
        setTasks(prev => prev.filter(t => t.id !== id));
      } catch (err) {
        console.error("Failed to delete task", err);
      }
    }
  };

  // --- Filtered Tasks ---
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = t.text.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
      return matchSearch && matchPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  // Group tasks by Kanban columns
  const columns = useMemo(() => {
    return {
      'To Do': filteredTasks.filter(t => t.status === 'To Do'),
      'In Progress': filteredTasks.filter(t => t.status === 'In Progress'),
      'Completed': filteredTasks.filter(t => t.status === 'Completed')
    };
  }, [filteredTasks]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Tasks...</p>
        </div>
      </div>
    );
  }

  const isStarter = user?.plan === 'Starter';

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Task Planner</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Workspace Operations</h2>
          </div>
        </div>

        <button
          onClick={() => handleOpenAddModal('To Do')}
          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer flex items-center gap-1.5"
        >
          <Plus size={14} strokeWidth={2.5} />
          <span>New Task</span>
        </button>
      </div>

      {isStarter && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-[20px] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-orange-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="animate-pulse" />
              <span>Starter Plan Limitations</span>
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-orange-200/90 font-semibold leading-normal">
              You are currently on the Free plan, which is limited to a maximum of 10 tasks total. You have utilized <strong className="text-orange-500 font-black">{tasks.length} of 10</strong> available slots. Upgrade to Premium for unlimited workspace tasks and Team Connect.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings', { state: { activeTab: 'billing' } })}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md shrink-0 cursor-pointer"
          >
            Upgrade Plan
          </button>
        </div>
      )}

      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Tasks */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-5 text-left relative overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 border-t-2 border-t-orange-500/60">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Total Tasks</p>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
              <CheckSquare size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2.5">{stats.total}</h3>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Operational checklist items</p>
        </div>

        {/* Pending checklist */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-5 text-left relative overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 border-t-2 border-t-blue-500/60">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Pending Work</p>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-50 mt-2.5">{stats.pending}</h3>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">To Do + In Progress tasks</p>
        </div>

        {/* High Priority count */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-5 text-left relative overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 border-t-2 border-t-rose-500/60">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">High Priority</p>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertCircle size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-rose-500 mt-2.5">{stats.high}</h3>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Pending high importance items</p>
        </div>

        {/* Completion rate */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] p-5 text-left relative overflow-hidden shadow-2xs hover:shadow-xs transition-all duration-300 border-t-2 border-t-emerald-500/60">
          <div className="flex justify-between items-start">
            <p className="text-[10px] font-black uppercase text-zinc-450 tracking-wider">Completion Rate</p>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Check size={15} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-2.5">{stats.completionRate}%</h3>
          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">Autopilot efficiency score</p>
        </div>

      </div>

      {/* Search & filters controls */}
      <div className="p-4 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[20px] flex flex-col md:flex-row gap-3 justify-between items-center shadow-2xs">
        
        {/* Left controls: Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              placeholder="Search task descriptions/titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs font-semibold text-zinc-850 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* View Mode Toggle Switch */}
          <div className="flex bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setViewMode('list')}
              className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <List size={13} />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-orange-500 text-white shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Kanban size={13} />
              <span>Board</span>
            </button>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl text-xs font-bold w-full md:w-auto">
          {['All', 'high', 'medium', 'low'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`flex-1 sm:flex-initial px-3.5 py-1 rounded-lg transition-all cursor-pointer capitalize ${
                filterPriority === p 
                  ? 'bg-orange-500 text-white' 
                  : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
              }`}
            >
              {p === 'All' ? 'All Priorities' : `${p}`}
            </button>
          ))}
        </div>

      </div>

      {/* 2. Unified Tasks List or Kanban Board */}
      {viewMode === 'list' ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-3xl p-5 shadow-2xs space-y-4 text-left">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-900">
            <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-widest flex items-center gap-2">
              <CheckSquare size={16} className="text-orange-500" />
              <span>Operation Checklist</span>
            </h3>
            <span className="text-[10px] font-extrabold text-zinc-400">
              Showing {filteredTasks.length} task{filteredTasks.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="divide-y divide-zinc-100 dark:divide-zinc-900/60">
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all"
                >
                  {/* Left content: Checkbox status and Text */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => moveTask(task.id, task.status === 'Completed' ? 'To Do' : 'Completed')}
                      className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-zinc-300 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 hover:border-orange-500'
                      }`}
                      title={task.status === 'Completed' ? "Mark as Incomplete" : "Mark as Completed"}
                    >
                      {task.status === 'Completed' && <Check size={11} strokeWidth={3} />}
                    </button>
                    
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className={`font-black text-sm text-zinc-900 dark:text-zinc-50 leading-tight tracking-tight ${task.status === 'Completed' ? 'line-through text-zinc-400 dark:text-zinc-650' : ''}`}>
                          {task.text}
                        </h4>
                        
                        {/* Priority Badge */}
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                        }`}>
                          {task.priority}
                        </span>

                        {/* Status Badge */}
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          task.status === 'To Do' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                          task.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                      <p className={`text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed max-w-3xl ${task.status === 'Completed' ? 'text-zinc-400 dark:text-zinc-600' : ''}`}>
                        {task.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Content: Due date & Actions */}
                  <div className="flex items-center gap-4 md:justify-end shrink-0 pl-8 md:pl-0">
                    <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 text-2xs font-bold">
                      <Clock size={11} />
                      <span>{task.deadline}</span>
                    </div>

                    <div className="flex items-center gap-1 border-l border-zinc-100 dark:border-zinc-900 pl-3">
                      {/* Inline select status */}
                      <select
                        value={task.status}
                        onChange={(e) => moveTask(task.id, e.target.value)}
                        className="text-[10px] font-black text-zinc-500 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                      >
                        <option value="To Do" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">To Do</option>
                        <option value="In Progress" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">In Progress</option>
                        <option value="Completed" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Completed</option>
                      </select>

                      <button
                        onClick={() => handleOpenEditModal(task)}
                        className="p-1.5 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                        title="Edit task"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors"
                        title="Delete task"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 border border-dashed border-zinc-200 dark:border-zinc-900/60 rounded-2xl flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-650 gap-2.5">
                <CheckSquare size={24} className="stroke-[1.5] text-zinc-350 dark:text-zinc-700" />
                <span className="text-2xs font-black uppercase tracking-wider">No matching tasks found</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {Object.entries(columns).map(([colName, colTasks]) => (
            <div key={colName} className="bg-slate-50/40 dark:bg-zinc-900/10 backdrop-blur-xs border border-zinc-200/60 dark:border-zinc-900 rounded-3xl p-5 space-y-4.5 shadow-3xs transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-850">
              
              {/* Column Header */}
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200/70 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    colName === 'To Do' ? 'bg-orange-500 ring-4 ring-orange-500/10 animate-pulse' :
                    colName === 'In Progress' ? 'bg-blue-500 ring-4 ring-blue-500/10' :
                    'bg-emerald-500 ring-4 ring-emerald-500/10'
                  }`} />
                  <span className="font-black text-xs text-zinc-850 dark:text-zinc-200 uppercase tracking-widest">{colName}</span>
                </div>
                <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-850 px-2.5 py-0.5 rounded-full shadow-3xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Column cards container */}
              <div className="space-y-3.5 min-h-[300px]">
                {colTasks.length > 0 ? (
                  colTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`bg-white dark:bg-zinc-950 border border-[#e8ecf4]/80 dark:border-zinc-900 rounded-2xl p-4 text-left shadow-2xs hover:shadow-lg dark:hover:shadow-black/25 hover:-translate-y-1 transition-all duration-300 relative group overflow-hidden border-l-4 ${
                        task.status === 'Completed' 
                          ? 'border-l-emerald-500/80 bg-zinc-50/50 dark:bg-zinc-900/10' 
                          : task.priority === 'high' 
                            ? 'border-l-rose-500' 
                            : task.priority === 'medium' 
                              ? 'border-l-amber-500' 
                              : 'border-l-sky-500'
                      }`}
                    >
                      {/* Top tags */}
                      <div className="flex justify-between items-center gap-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          task.status === 'Completed'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                              : task.priority === 'medium'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                        }`}>
                          {task.status === 'Completed' ? 'Completed' : `${task.priority} Priority`}
                        </span>

                        {/* Due Info */}
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Clock size={10} className="text-zinc-400 dark:text-zinc-500" />
                          <span>{task.deadline}</span>
                        </span>
                      </div>

                      {/* Task details */}
                      <div className="space-y-1 mt-3">
                        <h4 className={`font-black text-sm text-zinc-900 dark:text-zinc-50 leading-snug tracking-tight ${task.status === 'Completed' ? 'line-through text-zinc-400 dark:text-zinc-600' : ''}`}>
                          {task.text}
                        </h4>
                        <p className={`text-[10px] text-zinc-500 dark:text-zinc-450 leading-relaxed font-medium ${task.status === 'Completed' ? 'text-zinc-455 dark:text-zinc-650' : ''}`}>
                          {task.description}
                        </p>
                      </div>

                      {/* Footer Actions / Navigation */}
                      <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900/60 pt-3 mt-3.5">
                        
                        {/* Edit / Delete */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1.5 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-all duration-200"
                            title="Edit Task"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-900 cursor-pointer transition-all duration-200"
                            title="Delete Task"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        {/* Transitions controls */}
                        <div className="flex gap-1.5 items-center">
                          {colName !== 'To Do' && (
                            <button
                              onClick={() => moveTask(task.id, colName === 'Completed' ? 'In Progress' : 'To Do')}
                              title={colName === 'Completed' ? "Move to In Progress" : "Move to To Do"}
                              className="w-6 h-6 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-orange-500/5 hover:border-orange-500/30 cursor-pointer transition-all duration-200 shadow-2xs"
                            >
                              <ArrowLeft size={10} strokeWidth={2.5} />
                            </button>
                          )}
                          {colName !== 'Completed' && (
                            <button
                              onClick={() => moveTask(task.id, colName === 'To Do' ? 'In Progress' : 'Completed')}
                              title={colName === 'To Do' ? "Move to In Progress" : "Move to Completed"}
                              className="w-6 h-6 flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-orange-500 dark:hover:text-orange-400 border border-zinc-200 dark:border-zinc-800 rounded-full hover:bg-orange-500/5 hover:border-orange-500/30 cursor-pointer transition-all duration-200 shadow-2xs"
                            >
                              <ArrowRight size={10} strokeWidth={2.5} />
                            </button>
                          )}
                        </div>

                      </div>

                    </div>
                  ))
                ) : (
                  <div className="py-16 border border-dashed border-zinc-200 dark:border-zinc-900/60 rounded-2xl flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 gap-2">
                    <CheckSquare size={20} className="stroke-[1.5] text-zinc-350 dark:text-zinc-700" />
                    <span className="text-3xs font-black uppercase tracking-wider">No active items</span>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}

      {/* 3. Add/Edit Task Form Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-650 cursor-pointer"
            >
              <X size={16} />
            </button>

            <h3 className="text-base font-black text-zinc-900 dark:text-zinc-50 mb-4 text-left">
              {editingTask ? 'Edit Task checklist' : 'Create Task checklist'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4 text-left">
              
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-2 text-red-800 dark:text-red-300 text-[11px] font-black">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Task Title *</label>
                <input
                  type="text"
                  required
                  value={taskForm.text}
                  onChange={(e) => setTaskForm({ ...taskForm, text: e.target.value })}
                  placeholder="e.g. Review invoice breakdowns"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Task Description */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="e.g. Cross-check tax totals, verify UPI VPAs before sending..."
                  rows="2.5"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Priority Level</label>
                  <div className="relative">
                    <select
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="appearance-none w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="low" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Low Priority</option>
                      <option value="medium" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Medium Priority</option>
                      <option value="high" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">High Priority</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* Status Column */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Board Status</label>
                  <div className="relative">
                    <select
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                      className="appearance-none w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                    >
                      <option value="To Do" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">To Do</option>
                      <option value="In Progress" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">In Progress</option>
                      <option value="Completed" className="bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">Completed</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Due / Deadline Date *</label>
                <input
                  type="date"
                  required
                  value={taskForm.deadline}
                  onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/80 rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-orange-500 cursor-pointer"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl text-xs font-black hover:opacity-90 transition-all shadow-md cursor-pointer"
                >
                  Save Task
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
