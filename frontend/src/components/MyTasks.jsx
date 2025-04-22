import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle } from 'react-icons/fi';
import TaskCard from './TaskCard';

export default function MyTasks({
  tasks = [],
  onAddTask = () => {},
  onSelectTask = () => {},
}) {
  const [newTask, setNewTask] = useState({
    title: '',
    due_date: '',
    priority: 'Should Do',
    type: 'Personal',
  });
  const [isAddOpen, setIsAddOpen] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    onAddTask({ ...newTask });
    setNewTask({ title: '', due_date: '', priority: 'Should Do', type: 'Personal' });
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Add‑Task Panel */}
      <div className="p-4 bg-white rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isAddOpen ? 'Add New Task' : 'Quick Add'}
          </h3>
          <button
            type="button"
            onClick={() => setIsAddOpen(o => !o)}
            className="text-blue-500 hover:text-blue-700 focus:outline-none"
          >
            {isAddOpen
              ? 'Hide'
              : <span className="flex items-center gap-1"><FiPlusCircle /> Add Task</span>
            }
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
              <option value="Must Do">Must Do</option>
              <option value="Should Do">Should Do</option>
              <option value="Could Do">Could Do</option>
              <option value="Might Do">Might Do</option>
            </select>
            <select
              name="type"
              value={newTask.type}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            >
              <option value="Personal">Personal</option>
              <option value="Work">Work</option>
              <option value="Routine">Routine</option>
            </select>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none"
              >
                Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="text-gray-400 p-4">No tasks found.</div>
      ) : (
        <ul className="space-y-4">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onSelectTask(task)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

MyTasks.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    due_date: PropTypes.string,
    priority: PropTypes.string,
    type: PropTypes.string,
  })),
  onAddTask: PropTypes.func,
  onSelectTask: PropTypes.func,
};
