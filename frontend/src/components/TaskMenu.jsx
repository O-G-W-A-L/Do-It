// src/components/TaskMenu.jsx
import React, { useState } from 'react';
import {
  FiEdit,
  FiClock,
  FiBell,
  FiRepeat,
  FiCalendar,
  FiClock as FiTimerIcon,
} from 'react-icons/fi';
import { useRoutines } from '../contexts/RoutineContext';

export default function TaskMenu({ task }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState(null);
  const { addRoutine } = useRoutines();

  // Clears any open modal/state
  const closeAll = () => {
    setOpen(false);
    setAction(null);
  };

  const actions = [
    {
      label: 'Edit',
      icon: <FiEdit />,
      onClick: () => {
        // Trigger your inline edit or modal
        console.log('Edit', task.id);
        closeAll();
      }
    },
    {
      label: 'Set Timer',
      icon: <FiClock />,
      onClick: () => setAction('timer')
    },
    {
      label: 'Set Alarm',
      icon: <FiBell />,
      onClick: () => setAction('alarm')
    },
    {
      label: 'Set Reminder',
      icon: <FiCalendar />,
      onClick: () => setAction('reminder')
    },
    {
      label: 'Make Routine',
      icon: <FiRepeat />,
      onClick: () => {
        addRoutine({
          id: task.id,
          title: task.title,
          time: '',
          type: task.type || 'custom'
        });
        closeAll();
      }
    },
    {
      label: 'Specific Date',
      icon: <FiCalendar />,
      onClick: () => setAction('date')
    }
  ];

  // VERY lightweight inline “modals” — replace with your own
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
        break;
      case 'reminder':
        title = 'Set Reminder Date & Time';
        inputType = 'datetime-local';
        break;
      case 'date':
        title = 'Pick a Specific Date';
        inputType = 'date';
        break;
      default:
        return null;
    }

    const handleSubmit = e => {
      e.preventDefault();
      const value = e.target.elements[0].value;
      console.log(`${action} value for task ${task.id}:`, value);
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
          {actions.map(({ label, icon, onClick }, i) => (
            <li
              key={i}
              className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => { onClick(); }}
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
