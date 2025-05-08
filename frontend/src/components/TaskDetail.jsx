import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FiTrash, FiPlus, FiCalendar, FiFlag, FiTag, FiList, FiArrowLeft } from 'react-icons/fi';
import TaskMenu from './TaskMenu';
import { useTasks } from '../hooks/useTasks';
import { useNavigate } from 'react-router-dom';

const URGENCY_BADGES = {
  'Must Do': 'bg-red-100 text-red-700 border-red-200',
  'Should Do': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Could Do': 'bg-blue-100 text-blue-700 border-blue-200',
  'Might Do': 'bg-gray-100 text-gray-700 border-gray-200',
};

const TYPE_BADGES = {
  Personal: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Work: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Routine: 'bg-purple-100 text-purple-800 border-purple-200',
  Fitness: 'bg-red-100 text-red-800 border-red-200',
};

export default function TaskDetail({ task = null }) {
  const { updateTaskSubtasks } = useTasks();
  const navigate = useNavigate();

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
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiList className="w-8 h-8 text-indigo-600" />
        </div>
        <p className="text-gray-500 text-lg">No task selected</p>
        <p className="text-gray-400 mt-2">Select a task to view its details or create a new one</p>
      </div>
    );
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
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 text-indigo-700 hover:text-indigo-900 transition-colors"
      >
        <FiArrowLeft className="w-5 h-5" />
      </button>
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white">
        <h2 className="text-2xl font-bold mt-4">{task.title}</h2>
        <div className="flex flex-wrap gap-2 mt-4">
          {task.priority && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${URGENCY_BADGES[task.priority]}`}>
              {task.priority}
            </span>
          )}
          {task.type && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${TYPE_BADGES[task.type]}`}>
              {task.type}
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Due Date */}
          <div className="bg-indigo-50 rounded-xl p-4">
            <h3 className="text-sm font-medium text-gray-600 flex items-center mb-2">
              <FiCalendar className="mr-2 text-indigo-600" /> Due Date
            </h3>
            <p className="text-gray-800 font-medium">{dueDateStr}</p>
          </div>
          
          {/* Task Actions */}
          <div className="bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-600">Actions</h3>
            <TaskMenu task={task} />
          </div>
        </div>

        {/* Doing List */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <FiList className="mr-2 text-indigo-600" /> To-Do List
          </h3>

          {/* Add new subtask */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="Add a new subtask..."
              value={newSubtaskTitle}
              onChange={e => setNewSub(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              onKeyPress={e => e.key === 'Enter' && addSubtask()}
            />
            <button
              onClick={addSubtask}
              className="p-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-md transition-all"
              aria-label="Add subtask"
            >
              <FiPlus className="w-5 h-5" />
            </button>
          </div>

          {/* List of subtasks */}
          {subtasks.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-500">No subtasks added yet.</p>
              <p className="text-gray-400 text-sm mt-1">Break down your task into smaller steps</p>
            </div>
          ) : (
            <ul className="space-y-2 bg-gray-50 rounded-xl p-4">
              {subtasks.map((st, i) => (
                <li 
                  key={i} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    st.done ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-100'
                  }`}
                >
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!st.done}
                      onChange={() => toggleDone(i)}
                      className="h-5 w-5 rounded-full text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                    />
                    <span className={st.done ? 'line-through text-gray-500' : 'text-gray-800'}>
                      {st.title}
                    </span>
                  </label>
                  <button
                    onClick={() => removeSubtask(i)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Remove subtask"
                  >
                    <FiTrash className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
        done: PropTypes.bool,
      })
    ),
  }),
};