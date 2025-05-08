import React, { useState } from 'react';
import {
  FiPlusCircle, FiX, FiEdit, FiTrash, FiCheckSquare, 
  FiClock, FiTag, FiAlertCircle
} from 'react-icons/fi';
import { useRoutines } from '../contexts/RoutineContext';

// Exported so CalendarView can import it
export const RoutineTypes = [
  { label: 'Personal', value: 'personal', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  { label: 'Work',     value: 'work',     color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { label: 'Fitness',  value: 'fitness',  color: 'bg-red-100 text-red-700 border-red-200' },
  { label: 'Custom',   value: 'custom',   color: 'bg-purple-100 text-purple-700 border-purple-200' },
];

export default function RoutineTracker() {
  const { routines, addRoutine, toggleRoutine, deleteRoutine, updateRoutine } = useRoutines();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState('personal');

  const completedCount = routines.filter(r => r.completed).length;
  const totalCount = routines.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const openModal = (routine = null) => {
    if (routine) {
      setEditing(routine);
      setNewTitle(routine.title);
      setNewTime(routine.time);
      setNewType(routine.type);
    } else {
      setNewTitle('');
      setNewTime('');
      setNewType('personal');
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
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
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">Routine Tracker</h1>
              <p className="text-indigo-100 text-sm">Build and maintain your daily habits</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-white text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 font-medium"
              >
                <FiPlusCircle /> Add Routine
              </button>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="bg-indigo-50 px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-indigo-800">Completion Progress</h2>
            <span className="text-sm font-medium text-indigo-800">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-white rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-indigo-700">
            {completedCount} of {totalCount} routines completed
          </div>
        </div>

        {/* Routines List */}
        <div className="p-6">
          {routines.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiAlertCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No routines yet</h3>
              <p className="text-gray-500 mb-6">Start by adding your first routine</p>
              <button
                onClick={() => openModal()}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Your First Routine
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {routines.map(r => {
                const typeDef = RoutineTypes.find(t => t.value === r.type) || RoutineTypes[0];
                return (
                  <li
                    key={r.id}
                    className={`rounded-xl border transition-all ${
                      r.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-md'
                    }`}
                  >
                    <div className="p-4 flex items-center">
                      <button 
                        onClick={() => toggleRoutine(r.id)}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        aria-label={r.completed ? "Mark as incomplete" : "Mark as complete"}
                      >
                        <FiCheckSquare
                          className={`w-6 h-6 ${r.completed ? 'text-green-600' : 'text-gray-400'}`}
                        />
                      </button>
                      
                      <div className="ml-3 flex-1">
                        <h3 className={`font-medium ${r.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                          {r.title}
                        </h3>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          {r.time && (
                            <span className="flex items-center text-xs text-gray-500">
                              <FiClock className="mr-1" /> {r.time}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${typeDef.color}`}>
                            {typeDef.label}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openModal(r)}
                          className="p-2 text-gray-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-full transition-colors"
                          aria-label="Edit routine"
                        >
                          <FiEdit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => deleteRoutine(r.id)}
                          className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                          aria-label="Delete routine"
                        >
                          <FiTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-4 rounded-t-xl flex justify-between items-center text-white">
              <h2 className="text-xl font-semibold">
                {editing ? 'Edit Routine' : 'Add New Routine'}
              </h2>
              <button 
                onClick={closeModal}
                className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Routine Title
                </label>
                <input
                  type="text"
                  placeholder="What's your routine?"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiClock className="mr-1 text-indigo-600" /> Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiTag className="mr-1 text-indigo-600" /> Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RoutineTypes.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setNewType(t.value)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                        newType === t.value 
                          ? `${t.color} ring-2 ring-indigo-500 ring-offset-1` 
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRoutine}
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all"
                >
                  {editing ? 'Update' : 'Add'} Routine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}