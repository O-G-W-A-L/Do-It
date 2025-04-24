// src/components/TaskMenu.jsx
import React, { useState } from 'react';
import {
  FiEdit,
  FiClock,
  FiBell,
  FiRepeat,
  FiCalendar,
  FiTrash2,
} from 'react-icons/fi';
import PropTypes from 'prop-types';

export default function TaskMenu({
  task,
  onEdit = () => {},
  onSetTimer = () => {},
  onSetAlarm = () => {},
  onSetReminder = () => {},
  onMakeRoutine = () => {},
  onSpecificDate = () => {},
  onDelete = () => {},
}) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);

  const closeAll = () => {
    setOpen(false);
    setAction(null);
  };

  const actions = [
    {
      label: 'Edit',
      icon: <FiEdit />,
      handler: () => {
        onEdit(task.id);
        closeAll();
      },
    },
    {
      label: 'Set Timer',
      icon: <FiClock />,
      handler: () => setAction('timer'),
    },
    {
      label: 'Set Alarm',
      icon: <FiBell />,
      handler: () => setAction('alarm'),
    },
    {
      label: 'Set Reminder',
      icon: <FiCalendar />,
      handler: () => setAction('reminder'),
    },
    {
      label: 'Make Routine',
      icon: <FiRepeat />,
      handler: () => {
        onMakeRoutine(task.id);
        closeAll();
      },
    },
    {
      label: 'Specific Date',
      icon: <FiCalendar />,
      handler: () => setAction('date'),
    },
    {
      label: 'Delete',
      icon: <FiTrash2 />,
      handler: () => {
        onDelete(task.id);
        closeAll();
      },
    },
  ];

  const renderModal = () => {
    if (!action) return null;

    let title, inputType, placeholder;
    switch (action) {
      case 'timer':
        title = 'Set a Timer (minutes)';
        inputType = 'number';
        placeholder = 'e.g. 25';
        break;
      case 'alarm':
        title = 'Set Alarm Time';
        inputType = 'time';
        placeholder = '';
        break;
      case 'reminder':
        title = 'Set Reminder Date & Time';
        inputType = 'datetime-local';
        placeholder = '';
        break;
      case 'date':
        title = 'Pick a Specific Date';
        inputType = 'date';
        placeholder = '';
        break;
      default:
        return null;
    }

    const handleSubmit = e => {
      e.preventDefault();
      const value = e.target.elements[0].value;
      switch (action) {
        case 'timer':
          onSetTimer(task.id, Number(value));
          break;
        case 'alarm':
          onSetAlarm(task.id, value);
          break;
        case 'reminder':
          onSetReminder(task.id, value);
          break;
        case 'date':
          onSpecificDate(task.id, value);
          break;
      }
      closeAll();
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
        onClick={closeAll}
      >
        <form
          onClick={e => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded shadow-lg w-80"
        >
          <h3 className="text-lg font-semibold mb-4">{title}</h3>
          <input
            type={inputType}
            className="w-full p-2 border rounded mb-4"
            placeholder={placeholder}
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={closeAll}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        ⋯
      </button>

      {open && (
        <ul className="absolute right-0 mt-1 w-52 bg-white border rounded shadow-lg z-10">
          {actions.map(({ label, icon, handler }, idx) => (
            <li
              key={idx}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={handler}
            >
              {icon}
              <span>{label}</span>
            </li>
          ))}
        </ul>
      )}

      {renderModal()}
    </div>
  );
}

TaskMenu.propTypes = {
  task:           PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired }).isRequired,
  onEdit:         PropTypes.func,
  onSetTimer:     PropTypes.func,
  onSetAlarm:     PropTypes.func,
  onSetReminder:  PropTypes.func,
  onMakeRoutine:  PropTypes.func,
  onSpecificDate: PropTypes.func,
  onDelete:       PropTypes.func,
};
