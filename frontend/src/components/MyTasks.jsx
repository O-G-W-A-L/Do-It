import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle } from 'react-icons/fi';
import TaskCard from './TaskCard';

export default function MyTasks({
  tasks,
  onAddTask,
  onSelectTask,
  onEdit,
  onDelete,
  onToggleComplete,
  onSetTimer,
  onSetAlarm,
  onSetReminder,
  onMakeRoutine,
  onSpecificDate,
}) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', due_date: '', priority: 'Should Do', type: 'Personal'
  });

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
      {/* ─ Add Task Panel ───────────────────────────────────────────────── */}
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
              : <span className="flex items-center gap-1"><FiPlusCircle /> Add Task</span>}
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
              {['Must Do','Should Do','Could Do','Might Do'].map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <select
              name="type"
              value={newTask.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              {['Personal','Work','Routine'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─ Task List ────────────────────────────────────────────────────── */}
      {tasks.length === 0 ? (
        <div className="text-gray-400 p-4">No tasks found.</div>
      ) : (
        <ul className="space-y-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={onSelectTask}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleComplete={onToggleComplete}
              onSetTimer={onSetTimer}
              onSetAlarm={onSetAlarm}
              onSetReminder={onSetReminder}
              onMakeRoutine={onMakeRoutine}
              onSpecificDate={onSpecificDate}
            />
          ))}
        </ul>
      )}
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
  onSetTimer:       PropTypes.func.isRequired,
  onSetAlarm:       PropTypes.func.isRequired,
  onSetReminder:    PropTypes.func.isRequired,
  onMakeRoutine:    PropTypes.func.isRequired,
  onSpecificDate:   PropTypes.func.isRequired,
};
