import React, { useState } from 'react';
import {
  FiPlusCircle, FiX, FiEdit, FiTrash, FiCheckSquare
} from 'react-icons/fi';
import { useRoutines } from '../contexts/RoutineContext';

const RoutineTypes = [
  { label: 'Personal', value: 'personal', color: 'bg-blue-100 text-blue-700' },
  { label: 'Work',     value: 'work',     color: 'bg-green-100 text-green-700' },
  { label: 'Fitness',  value: 'fitness',  color: 'bg-red-100 text-red-700' },
  { label: 'Custom',   value: 'custom',   color: 'bg-purple-100 text-purple-700' },
];

export default function RoutineTracker() {
  const { routines, addRoutine, toggleRoutine, deleteRoutine, updateRoutine } = useRoutines();

  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [newTitle, setNewTitle]         = useState('');
  const [newTime, setNewTime]           = useState('');
  const [newType, setNewType]           = useState('personal');

  const completedCount = routines.filter(r => r.completed).length;

  const openModal = (routine = null) => {
    if (routine) {
      setEditing(routine);
      setNewTitle(routine.title);
      setNewTime(routine.time);
      setNewType(routine.type);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setNewTitle('');
    setNewTime('');
    setNewType('personal');
  };

  const saveRoutine = () => {
    if (!newTitle.trim()) return;
    if (editing) {
      updateRoutine({ id: editing.id, title: newTitle, time: newTime, type: newType });
    } else {
      addRoutine({ title: newTitle, time: newTime, type: newType });
    }
    closeModal();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Routine Tracker</h1>
        <div className="flex items-center gap-4">
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg font-medium">
            {completedCount} completed
          </span>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          >
            <FiPlusCircle /> Add Routine
          </button>
        </div>
      </header>

      <ul className="space-y-3">
        {routines.map(r => {
          const typeDef = RoutineTypes.find(t => t.value === r.type);
          return (
            <li
              key={r.id}
              className={`flex items-center justify-between p-4 rounded shadow-sm border ${
                r.completed ? 'bg-green-50' : 'bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3 w-full">
                <button onClick={() => toggleRoutine(r.id)}>
                  <FiCheckSquare
                    className={r.completed ? 'text-green-600' : 'text-gray-400'}
                  />
                </button>
                <div className="flex-1">
                  <h3 className="font-medium">{r.title}</h3>
                  {r.time && <p className="text-sm text-gray-500">{r.time}</p>}
                  <span className={`text-xs px-2 py-0.5 rounded ${typeDef.color}`}>
                    {typeDef.label}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openModal(r)}>
                  <FiEdit className="text-blue-500 hover:text-blue-700" />
                </button>
                <button onClick={() => deleteRoutine(r.id)}>
                  <FiTrash className="text-red-500 hover:text-red-700" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <header className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editing ? 'Edit' : 'Add'} Routine
              </h2>
              <button onClick={closeModal}>
                <FiX />
              </button>
            </header>

            <input
              type="text"
              placeholder="Title"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />
            <input
              type="time"
              value={newTime}
              onChange={e => setNewTime(e.target.value)}
              className="border p-2 rounded w-full mb-2"
            />

            <div className="flex gap-2 mb-4">
              {RoutineTypes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setNewType(t.value)}
                  className={`px-3 py-1 rounded ${t.color} ${
                    newType === t.value ? 'ring-2 ring-offset-1 ring-indigo-500' : ''
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <footer className="flex justify-end gap-2">
              <button
                onClick={closeModal}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={saveRoutine}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editing ? 'Update' : 'Add'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
