// src/components/MyTasks.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle } from 'react-icons/fi';
import TaskCard from './TaskCard';
import { useRoutines } from '../contexts/RoutineContext';

export default function MyTasks({
  tasks,
  onAddTask,
  onSelectTask,
  onEdit,
  onDelete,
  onToggleComplete,
  onMakeRoutine,
  onSetTimer,
  onSetAlarm,
  onSetReminder,
  onSpecificDate,
}) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', due_date: '', priority: 'Should Do', type: 'Personal'
  });

  // Pull in routines and today marker
  const { routines } = useRoutines();
  const todayStr = new Date().toISOString().split('T')[0];

  // Convert routines to pseudo-tasks if not done today
  const routineTasks = useMemo(
    () =>
      routines
        .filter(r => r.lastCompleted !== todayStr)
        .map(r => ({
          id:       `routine-${r.id}`,
          title:    r.title,
          due_date: '',           // no fixed date
          type:     'Routine',
          is_done:  false,
        })),
    [routines, todayStr]
  );

  // Combine backend tasks + routine pseudo-tasks
  const combinedTasks = useMemo(
    () => [...routineTasks, ...tasks],
    [routineTasks, tasks]
  );

  // Group by type (including "Routine")
  const groupedByType = useMemo(() => {
    return combinedTasks.reduce((acc, t) => {
      const category = t.type || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(t);
      return acc;
    }, {});
  }, [combinedTasks]);

  // Handlers for adding new task
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

  return (
    <div className="space-y-6">
      {/* ─ Add Task Panel ─ */}
      <div className="p-4 bg-white rounded-lg shadow-md">
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
              : (
                <span className="flex items-center gap-1">
                  <FiPlusCircle /> Add Task
                </span>
              )}
          </button>
        </div>
        {isAddOpen && (
          <div className="space-y-3">
            <input
              type="text"
              name="title"
              placeholder="Task title"
              value={newTask.title}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
            <input
              type="date"
              name="due_date"
              value={newTask.due_date}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <select
              name="priority"
              value={newTask.priority}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {['Must Do', 'Should Do', 'Could Do', 'Might Do'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              name="type"
              value={newTask.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {['Personal', 'Work', 'Routine'].map(t => (
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
      </div>

      {/* ─ Task List by Type ─ */}
      {combinedTasks.length === 0
        ? (
          <div className="text-gray-400 p-4">No tasks found.</div>
        )
        : (
          Object.entries(groupedByType).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <h3 className="text-lg font-semibold">{category}</h3>
              <ul className="space-y-4">
                {items.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={onSelectTask}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleComplete={task.id.startsWith('routine-')
                      // for routines, call toggleRoutine
                      ? () => onMakeRoutine(task.id.replace('routine-', ''))
                      : () => onToggleComplete(task.id)}
                    onSetTimer={onSetTimer}
                    onSetAlarm={onSetAlarm}
                    onSetReminder={onSetReminder}
                    onMakeRoutine={onMakeRoutine}
                    onSpecificDate={onSpecificDate}
                  />
                ))}
              </ul>
            </div>
          ))
        )
      }
    </div>
  );
}

MyTasks.propTypes = {
  tasks:            PropTypes.array.isRequired,
  onAddTask:        PropTypes.func.isRequired,
  onSelectTask:     PropTypes.func.isRequired,
  onEdit:           PropTypes.func.isRequired,
  onDelete:         PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onMakeRoutine:    PropTypes.func.isRequired,    // invoked for routine completion
  onSetTimer:       PropTypes.func.isRequired,
  onSetAlarm:       PropTypes.func.isRequired,
  onSetReminder:    PropTypes.func.isRequired,
  onSpecificDate:   PropTypes.func.isRequired,
};
