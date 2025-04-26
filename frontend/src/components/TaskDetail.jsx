// src/components/TaskDetail.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiTrash, FiPlus } from 'react-icons/fi';
import TaskMenu from './TaskMenu';
import { useTasks } from '../hooks/useTasks';

const URGENCY_BADGES = {
  'Must Do': 'bg-red-100 text-red-700',
  'Should Do': 'bg-yellow-100 text-yellow-700',
  'Could Do': 'bg-blue-100 text-blue-700',
  'Might Do': 'bg-gray-100 text-gray-700',
};

const TYPE_BADGES = {
  Personal: 'bg-blue-100 text-blue-800',
  Work: 'bg-green-100 text-green-800',
  Routine: 'bg-purple-100 text-purple-800',
  Fitness: 'bg-red-100 text-red-800',
};

export default function TaskDetail({ task = null }) {
  const { updateTaskSubtasks } = useTasks();

  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtaskTitle, setNewSub] = useState('');

  useEffect(() => {
    // Ensure all subtasks have a valid `done` boolean
    const safeSubtasks = (task?.subtasks || []).map(st => ({
      title: st.title || '',
      done: typeof st.done === 'boolean' ? st.done : false,
    }));
    setSubtasks(safeSubtasks);
    setNewSub('');
  }, [task]);

  if (!task) {
    return <div className="p-4 text-gray-500">No task selected.</div>;
  }

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '—';

  const saveSubtasks = (newList) => {
    setSubtasks(newList);
    updateTaskSubtasks(task.id, newList);
  };

  const addSubtask = () => {
    const title = newSubtaskTitle.trim();
    if (!title) return;
    const newList = [...subtasks, { title, done: false }];
    saveSubtasks(newList);
    setNewSub('');
  };

  const toggleDone = (idx) => {
    const newList = subtasks.map((st, i) =>
      i === idx ? { ...st, done: !st.done } : st
    );
    saveSubtasks(newList);
  };

  const removeSubtask = (idx) => {
    const newList = subtasks.filter((_, i) => i !== idx);
    saveSubtasks(newList);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{task.title}</h2>
        <TaskMenu task={task} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {task.priority && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${URGENCY_BADGES[task.priority]}`}>
            {task.priority}
          </span>
        )}
        {task.type && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${TYPE_BADGES[task.type]}`}>
            {task.type}
          </span>
        )}
      </div>

      {/* Due Date */}
      <div>
        <h3 className="text-sm font-medium text-gray-600">Due Date</h3>
        <p className="mt-1 text-gray-800">{dueDateStr}</p>
      </div>

      {/* Doing List */}
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-2">To-Do List</h3>

        {/* Add new subtask */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="New subtask..."
            value={newSubtaskTitle}
            onChange={e => setNewSub(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={addSubtask}
            className="p-2 bg-green-600 text-white rounded hover:bg-green-700"
            aria-label="Add subtask"
          >
            <FiPlus />
          </button>
        </div>

        {/* List of subtasks */}
        {subtasks.length === 0 ? (
          <p className="text-gray-500">No subtasks added.</p>
        ) : (
          <ul className="space-y-2">
            {subtasks.map((st, i) => (
              <li key={i} className="flex items-center justify-between">
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!st.done} // ✅ Force checked to always be true/false
                    onChange={() => toggleDone(i)}
                    className="h-4 w-4 text-green-600"
                  />
                  <span className={st.done ? 'line-through text-gray-500' : ''}>
                    {st.title}
                  </span>
                </label>
                <button
                  onClick={() => removeSubtask(i)}
                  className="text-red-500 hover:text-red-700"
                  aria-label="Remove subtask"
                >
                  <FiTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

TaskDetail.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title: PropTypes.string,
    due_date: PropTypes.string,
    priority: PropTypes.string,
    type: PropTypes.string,
    subtasks: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        done: PropTypes.bool, // ✅ not required, we handle undefined ourselves
      })
    ),
  }),
};
