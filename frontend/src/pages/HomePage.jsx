import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle } from 'react-icons/fi';
import TaskCard from '../components/TaskCard';

export default function HomePage({
  tasks,
  onAddTask,
  onSelectTask,
  onToggleComplete,
}) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask]   = useState({
    title: '', due_date: '', priority: 'Should Do', type: 'Personal'
  });

  const today = useMemo(() => new Date(), []);

  // 1) Filter only one-time tasks due today
  const todaysTasks = useMemo(
    () =>
      tasks.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth()    === today.getMonth() &&
          d.getDate()     === today.getDate()
        );
      }),
    [tasks, today]
  );

  // 2) Compute progress
  const todayProgress = useMemo(() => {
    const total = todaysTasks.length;
    const done  = todaysTasks.filter(t => t.is_done).length;
    const pct   = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [todaysTasks]);

  // 3) Group by category/type
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
    setNewTask({ title:'', due_date:'', priority:'Should Do', type:'Personal' });
    setAddOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Quick Add Panel */}
      <section className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isAddOpen ? 'Add New Task' : 'Quick Add'}
          </h3>
          <button
            onClick={() => setAddOpen(o => !o)}
            className="text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            {isAddOpen
              ? 'Hide'
              : <span className="flex items-center gap-1"><FiPlusCircle /> Add Task</span>}
          </button>
        </div>
        {isAddOpen && (
          <div className="space-y-3">
            <input
              type="text" name="title" placeholder="Task title"
              value={newTask.title} onChange={handleChange}
              className="w-full p-2 border rounded" required
            />
            <input
              type="date" name="due_date"
              value={newTask.due_date} onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <select
              name="priority" value={newTask.priority} onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {['Must Do','Should Do','Could Do','Might Do'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              name="type" value={newTask.type} onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {['Personal','Work','Routine','Fitness'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Today's Tasks */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold">Today's Tasks</h3>
        {todayProgress.total === 0 ? (
          <p className="text-green-600">🎉 You’ve completed all tasks for today!</p>
        ) : (
          Object.entries(groupedByType).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h4 className="text-lg font-medium">{category}</h4>
              <ul className="space-y-4">
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
          ))
        )}
      </section>

      {/* Progress Bar */}
      {todayProgress.total > 0 && (
        <section className="bg-white p-6 rounded shadow">
          <h3 className="text-xl font-semibold mb-4">Today's Progress</h3>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 bg-blue-600 transition-all duration-300"
              style={{ width: `${todayProgress.pct}%` }}
            />
          </div>
          <p className="mt-1 text-sm text-gray-700">
            {todayProgress.done}/{todayProgress.total} done ({todayProgress.pct}%)
          </p>
        </section>
      )}
    </div>
  );
}

HomePage.propTypes = {
  tasks:            PropTypes.array.isRequired,
  onAddTask:        PropTypes.func.isRequired,
  onSelectTask:     PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
};
