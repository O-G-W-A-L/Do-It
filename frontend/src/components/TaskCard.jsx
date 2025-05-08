import React from 'react';
import PropTypes from 'prop-types';
import { FiClock } from 'react-icons/fi';
import TaskMenu from './TaskMenu';

// Type-to-style mapping
const TYPE_BADGES = {
  Personal: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  Work: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  Routine: 'bg-purple-100 text-purple-800 border-purple-200',
  Fitness: 'bg-red-100 text-red-800 border-red-200',
};

// Priority-to-style mapping
const PRIORITY_INDICATORS = {
  'Must Do': 'bg-red-500',
  'Should Do': 'bg-yellow-500',
  'Could Do': 'bg-blue-500',
  'Might Do': 'bg-gray-500',
};

export default function TaskCard({
  task,
  onClick,
  onEdit = () => {},
  onSetTimer = () => {},
  onSetAlarm = () => {},
  onSetReminder = () => {},
  onMakeRoutine = () => {},
  onSpecificDate = () => {},
  onDelete = () => {},
  onToggleComplete = () => {},
}) {
  const now = new Date();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const isMissed = dueDate && dueDate < now && !task.is_done;

  const badgeClass = TYPE_BADGES[task.type] || 'bg-gray-100 text-gray-800 border-gray-200';
  const priorityIndicator = PRIORITY_INDICATORS[task.priority] || 'bg-gray-500';

  // Format the due date in a more readable way
  const formatDueDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today or tomorrow
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <li
      className={`
        rounded-xl transition-all duration-300
        ${task.is_done
          ? 'bg-gray-50 border border-gray-100'
          : isMissed
            ? 'bg-red-50 border border-red-100 shadow-md'
            : 'bg-white border border-gray-100 shadow-md hover:shadow-lg hover:translate-y-[-2px]'}
      `}
    >
      <div className="flex items-start p-4">
        {/* Priority indicator */}
        <div className={`w-1 self-stretch rounded-full ${priorityIndicator} mr-3 flex-shrink-0`}></div>
        
        {/* Checkbox and content */}
        <div className="flex items-start gap-3 flex-1">
          <div className="pt-1">
            <input
              type="checkbox"
              checked={!!task.is_done}
              onChange={() => onToggleComplete(task.id)}
              className="h-5 w-5 rounded-full text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
              aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
            />
          </div>

          <div
            onClick={() => onClick(task)}
            role="button"
            tabIndex={0}
            onKeyPress={e => e.key === 'Enter' && onClick(task)}
            className="flex-1 cursor-pointer space-y-2"
          >
            <div className="space-y-1">
              <h4 className={`font-medium ${task.is_done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {task.title}
              </h4>
              
              <div className="flex flex-wrap gap-2 items-center">
                {task.type && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
                    {task.type}
                  </span>
                )}
                
                {task.due_date && (
                  <span
                    className={`text-xs flex items-center ${
                      isMissed ? 'text-red-600' : 'text-gray-500'
                    }`}
                  >
                    <FiClock className="mr-1" />
                    {formatDueDate(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Task menu */}
        <TaskMenu
          task={task}
          onEdit={() => onEdit(task.id)}
          onSetTimer={minutes => onSetTimer(task.id, minutes)}
          onSetAlarm={dt => onSetAlarm(task.id, dt)}
          onSetReminder={dt => onSetReminder(task.id, dt)}
          onMakeRoutine={() => onMakeRoutine(task.id)}
          onSpecificDate={date => onSpecificDate(task.id, date)}
          onDelete={() => onDelete(task.id)}
        />
      </div>
    </li>
  );
}

TaskCard.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    due_date: PropTypes.string,
    type: PropTypes.string,
    is_done: PropTypes.bool,
    priority: PropTypes.string,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onSetTimer: PropTypes.func,
  onSetAlarm: PropTypes.func,
  onSetReminder: PropTypes.func,
  onMakeRoutine: PropTypes.func,
  onSpecificDate: PropTypes.func,
  onDelete: PropTypes.func,
  onToggleComplete: PropTypes.func,
};