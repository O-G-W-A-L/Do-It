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
  onSelect,
  onEdit,
  onSetTimer,
  onSetAlarm,
  onSetReminder,
  onMakeRoutine,
  onSpecificDate
}) {
  const badgeClass = TYPE_BADGES[task?.type] || 'bg-gray-100 text-gray-800';

  return (
    <li className="bg-white p-4 rounded-lg shadow hover:shadow-md transition flex justify-between items-center gap-4">
      {/* Task Info */}
      <div
        className="flex-1 cursor-pointer space-y-1"
        onClick={() => onSelect(task)}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => { if (e.key === 'Enter') onSelect(task); }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold text-base">{task.title}</h4>
          {task?.type && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClass}`}>
              {task.type}
            </span>
          )}
        </div>
        {task?.due_date && (
          <small className="text-gray-500 block">
            {new Date(task.due_date).toLocaleString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </small>
        )}
      </div>

      {/* Task Options */}
      <TaskMenu
        task={task}
        onEdit={() => onEdit(task.id)}
        onSetTimer={(minutes) => onSetTimer(task.id, minutes)}
        onSetAlarm={(datetime) => onSetAlarm(task.id, datetime)}
        onSetReminder={(datetime) => onSetReminder(task.id, datetime)}
        onMakeRoutine={() => onMakeRoutine(task.id)}
        onSpecificDate={(date) => onSpecificDate(task.id, date)}
      />
    </li>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id:           PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title:        PropTypes.string.isRequired,
    due_date:     PropTypes.string,
    type:         PropTypes.string,
  }).isRequired,
  onSelect:       PropTypes.func.isRequired,
  onEdit:         PropTypes.func.isRequired,
  onSetTimer:     PropTypes.func.isRequired,
  onSetAlarm:     PropTypes.func.isRequired,
  onSetReminder:  PropTypes.func.isRequired,
  onMakeRoutine:  PropTypes.func.isRequired,
  onSpecificDate: PropTypes.func.isRequired,
};
