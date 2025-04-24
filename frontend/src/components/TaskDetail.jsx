// src/components/TaskDetail.jsx
import React from 'react';
import PropTypes from 'prop-types';
import TaskMenu from './TaskMenu';

const URGENCY_BADGES = {
  'Must Do':   'bg-red-100 text-red-700',
  'Should Do': 'bg-yellow-100 text-yellow-700',
  'Could Do':  'bg-blue-100 text-blue-700',
  'Might Do':  'bg-gray-100 text-gray-700',
};

const TYPE_BADGES = {
  Personal: 'bg-blue-100 text-blue-800',
  Work:     'bg-green-100 text-green-800',
  Routine:  'bg-purple-100 text-purple-800',
  Fitness:  'bg-red-100 text-red-800',
};

export default function TaskDetail({ task = null }) {
  if (!task) {
    return <div className="p-4 text-gray-500">No task selected.</div>;
  }

  const dueDateStr = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        year:  'numeric',
        month: 'short',
        day:   'numeric'
      })
    : '—';

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      {/* Header with Title + Menu */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{task.title}</h2>
        <TaskMenu task={task} />
      </div>

      {/* Priority & Type Badges */}
      <div className="flex flex-wrap gap-2">
        {task.priority && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${URGENCY_BADGES[task.priority]}`}
          >
            {task.priority}
          </span>
        )}
        {task.type && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${TYPE_BADGES[task.type]}`}
          >
            {task.type}
          </span>
        )}
      </div>

      {/* Due Date */}
      <div>
        <h3 className="text-sm font-medium text-gray-600">Due Date</h3>
        <p className="mt-1 text-gray-800">{dueDateStr}</p>
      </div>

      {/* Subtasks */}
      {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 mb-2">Subtasks</h3>
          <ul className="space-y-2">
            {task.subtasks.map((st, i) => (
              <li key={i} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={st.done}
                  readOnly
                  className="form-checkbox"
                />
                <span className={st.done ? 'line-through text-gray-500' : ''}>
                  {st.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

TaskDetail.propTypes = {
  task: PropTypes.shape({
    id:        PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    title:     PropTypes.string,
    due_date:  PropTypes.string,
    priority:  PropTypes.string,
    type:      PropTypes.string,
    subtasks:  PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string,
        done:  PropTypes.bool
      })
    ),
  }),
};
