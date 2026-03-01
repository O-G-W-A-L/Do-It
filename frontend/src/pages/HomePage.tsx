import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle, FiX, FiCheck, FiCalendar, FiFlag, FiTag } from 'react-icons/fi';
import TaskCard from '../components/TaskCard';

export default function HomePage({
  tasks,
  onAddTask,
  onSelectTask,
  onToggleComplete,
}) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', due_date: '', priority: 'Should Do', type: 'Personal'
  });

  const today = useMemo(() => new Date(), []);

  // Filter only one-time tasks due today
  const todaysTasks = useMemo(
    () =>
      tasks.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate()
        );
      }),
    [tasks, today]
  );

  // Compute progress
  const todayProgress = useMemo(() => {
    const total = todaysTasks.length;
    const done = todaysTasks.filter(t => t.is_done).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [todaysTasks]);

  // Group by category/type
  const groupedByType = useMemo(() => {
    return todaysTasks.reduce((acc, t) => {
      const cat = t.type || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {});
  }, [todaysTasks]);

  // Quick-add handlers
  const handleChange = e => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };
  
  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    onAddTask(newTask);
    setNewTask({ title: '', due_date: '', priority: 'Should Do', type: 'Personal' });
    setAddOpen(false);
  };

  // Get today's date in YYYY-MM-DD format for the date input
  const todayFormatted = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  return (
    <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-indigo-900 to-cyan-700 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className="text-indigo-100">
          {todayProgress.total === 0 
            ? "You don't have any tasks scheduled for today." 
            : `You have ${todayProgress.total - todayProgress.done} tasks remaining for today.`}
        </p>
      </section>

      {/* Quick Add Panel */}
      <section className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {isAddOpen ? 'Add New Task' : 'Quick Add'}
          </h3>
          <button
            onClick={() => setAddOpen(o => !o)}
            className="text-indigo-700 hover:text-indigo-900 focus:outline-none transition-colors"
          >
            {isAddOpen ? (
              <FiX className="w-5 h-5" />
            ) : (
              <span className="flex items-center gap-1">
                <FiPlusCircle className="w-5 h-5" /> Add Task
              </span>
            )}
          </button>
        </div>
        
        {isAddOpen && (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Task Title</label>
              <input
                type="text"
                name="title"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiCalendar className="mr-1 text-indigo-600" /> Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={newTask.due_date}
                  onChange={handleChange}
                  min={todayFormatted}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiFlag className="mr-1 text-indigo-600" /> Priority
                </label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {['Must Do', 'Should Do', 'Could Do', 'Might Do'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiTag className="mr-1 text-indigo-600" /> Category
                </label>
                <select
                  name="type"
                  value={newTask.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {['Personal', 'Work', 'Routine', 'Fitness'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center"
              >
                <FiCheck className="mr-1" /> Add Task
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Today's Tasks */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">Today's Tasks</h3>
          {todayProgress.total > 0 && (
            <div className="text-sm text-gray-600">
              {todayProgress.done}/{todayProgress.total} completed
            </div>
          )}
        </div>
        
        {todayProgress.total === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiCheck className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-green-600 font-medium text-lg">You've completed all tasks for today!</p>
            <p className="text-gray-500 mt-2">Enjoy your free time or plan ahead for tomorrow.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(groupedByType).map(([category, items]) => (
              <div key={category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-3">
                  <h4 className="font-semibold text-gray-800">{category}</h4>
                </div>
                <ul className="p-4 space-y-3">
                  {items.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={onSelectTask}
                      onToggleComplete={() => onToggleComplete(task.id)}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Progress Bar */}
      {todayProgress.total > 0 && (
        <section className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Today's Progress</h3>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-indigo-600 to-cyan-600 transition-all duration-500 rounded-full"
              style={{ width: `${todayProgress.pct}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm">
            <p className="text-gray-600">
              {todayProgress.done}/{todayProgress.total} completed
            </p>
            <p className="font-medium text-indigo-700">{todayProgress.pct}%</p>
          </div>
        </section>
      )}
    </div>
  );
}

HomePage.propTypes = {
  tasks: PropTypes.array.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onSelectTask: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
};