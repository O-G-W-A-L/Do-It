import React, { useState, useRef, useEffect } from 'react';
import {
  FiEdit,
  FiClock,
  FiBell,
  FiRepeat,
  FiCalendar,
  FiTrash2,
  FiMoreVertical,
  FiX
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
  const menuRef = useRef(null);
  const modalRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const closeAll = () => {
    setOpen(false);
    setAction(null);
  };

  const actions = [
    {
      label: 'Edit',
      icon: <FiEdit className="text-indigo-600" />,
      handler: () => {
        onEdit(task.id);
        closeAll();
      },
    },
    {
      label: 'Set Timer',
      icon: <FiClock className="text-cyan-600" />,
      handler: () => setAction('timer'),
    },
    {
      label: 'Set Alarm',
      icon: <FiBell className="text-yellow-600" />,
      handler: () => setAction('alarm'),
    },
    {
      label: 'Set Reminder',
      icon: <FiCalendar className="text-green-600" />,
      handler: () => setAction('reminder'),
    },
    {
      label: 'Make Routine',
      icon: <FiRepeat className="text-purple-600" />,
      handler: () => {
        onMakeRoutine(task.id);
        closeAll();
      },
    },
    {
      label: 'Specific Date',
      icon: <FiCalendar className="text-blue-600" />,
      handler: () => setAction('date'),
    },
    {
      label: 'Delete',
      icon: <FiTrash2 className="text-red-600" />,
      handler: () => {
        onDelete(task.id);
        closeAll();
      },
    },
  ];

  const renderModal = () => {
    if (!action) return null;

    let title, inputType, placeholder, icon;
    switch (action) {
      case 'timer':
        title = 'Set a Timer';
        inputType = 'number';
        placeholder = 'Minutes (e.g. 25)';
        icon = <FiClock className="text-cyan-600" />;
        break;
      case 'alarm':
        title = 'Set Alarm Time';
        inputType = 'time';
        placeholder = '';
        icon = <FiBell className="text-yellow-600" />;
        break;
      case 'reminder':
        title = 'Set Reminder';
        inputType = 'datetime-local';
        placeholder = '';
        icon = <FiCalendar className="text-green-600" />;
        break;
      case 'date':
        title = 'Pick a Specific Date';
        inputType = 'date';
        placeholder = '';
        icon = <FiCalendar className="text-blue-600" />;
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
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={closeAll}
      >
        <form
          ref={modalRef}
          onClick={e => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md mx-4 animate-fadeIn"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 flex items-center">
              {icon}
              <span className="ml-2">{title}</span>
            </h3>
            <button 
              type="button" 
              onClick={closeAll}
              className="text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <input
              type={inputType}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={placeholder}
              required
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeAll}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-2 text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <FiMoreVertical className="w-5 h-5" />
      </button>

      {open && (
        <ul className="absolute right-0 mt-1 w-56 bg-white rounded-xl border border-gray-100 shadow-xl z-10 overflow-hidden animate-fadeIn">
          {actions.map(({ label, icon, handler }, idx) => (
            <li
              key={idx}
              className="border-b border-gray-50 last:border-0"
            >
              <button
                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                onClick={handler}
              >
                <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
                <span className="text-gray-700">{label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {renderModal()}
    </div>
  );
}

TaskMenu.propTypes = {
  task: PropTypes.shape({ id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired }).isRequired,
  onEdit: PropTypes.func,
  onSetTimer: PropTypes.func,
  onSetAlarm: PropTypes.func,
  onSetReminder: PropTypes.func,
  onMakeRoutine: PropTypes.func,
  onSpecificDate: PropTypes.func,
  onDelete: PropTypes.func,
};