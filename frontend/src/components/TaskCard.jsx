// src/components/TaskCard.jsx
import React from 'react';
import PropTypes from 'prop-types';
import TaskMenu from './TaskMenu';

// Type-to-style mapping
const TYPE_BADGES = {
  Personal: 'bg-blue-100 text-blue-800',
  Work:     'bg-green-100 text-green-800',
  Routine:  'bg-purple-100 text-purple-800',
  Fitness:  'bg-red-100 text-red-800',
};

export default function TaskCard({
  task,
  onClick,
  onEdit            = () => {},
  onSetTimer        = () => {},
  onSetAlarm        = () => {},
  onSetReminder     = () => {},
  onMakeRoutine     = () => {},
  onSpecificDate    = () => {},
  onDelete          = () => {},
  onToggleComplete  = () => {},
}) {
  const now = new Date();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isMissed = dueDate && dueDate < now && !task.is_done;

  const badgeClass = TYPE_BADGES[task.type] || 'bg-gray-100 text-gray-800';

  return (
    <li
      className={`
        flex items-center justify-between p-4 rounded-lg transition
        ${task.is_done
          ? 'bg-gray-50 opacity-50 line-through text-gray-400'
          : isMissed
            ? 'bg-red-50'
            : 'hover:shadow-lg'}
        shadow-md
      `}
    >
      {/* ✔️ Complete toggle + Task Info */}
      <div className="flex items-center gap-3 flex-1">
        <input
          type="checkbox"
          checked={!!task.is_done}
          onChange={() => onToggleComplete(task.id)}
          className="h-5 w-5 text-green-600"
          aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
        />

        <div
          onClick={() => onClick(task)}
          role="button"
          tabIndex={0}
          onKeyPress={e => e.key === 'Enter' && onClick(task)}
          className="flex-1 cursor-pointer space-y-1"
        >
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold">{task.title}</h4>
            {task.type && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
                {task.type}
              </span>
            )}
          </div>
          {task.due_date && (
            <small
              className={`block ${
                isMissed ? 'text-red-600' : 'text-gray-500'
              }`}
            >
              {new Date(task.due_date).toLocaleString(undefined, {
                weekday: 'short',
                month:   'short',
                day:     'numeric',
                hour:    '2-digit',
                minute:  '2-digit',
              })}
            </small>
          )}
        </div>
      </div>

      {/* ⋯ menu with all your actions + delete */}
      <TaskMenu
        task={task}
        onEdit         = {() => onEdit(task.id)}
        onSetTimer     = {minutes => onSetTimer(task.id, minutes)}
        onSetAlarm     = {dt => onSetAlarm(task.id, dt)}
        onSetReminder  = {dt => onSetReminder(task.id, dt)}
        onMakeRoutine  = {() => onMakeRoutine(task.id)}
        onSpecificDate = {date => onSpecificDate(task.id, date)}
        onDelete       = {() => onDelete(task.id)}
      />
    </li>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id:       PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title:    PropTypes.string.isRequired,
    due_date: PropTypes.string,
    type:     PropTypes.string,
    is_done:  PropTypes.bool,
  }).isRequired,
  onClick:        PropTypes.func.isRequired,
  onEdit:         PropTypes.func,
  onSetTimer:     PropTypes.func,
  onSetAlarm:     PropTypes.func,
  onSetReminder:  PropTypes.func,
  onMakeRoutine:  PropTypes.func,
  onSpecificDate: PropTypes.func,
  onDelete:       PropTypes.func,
  onToggleComplete: PropTypes.func,
};
