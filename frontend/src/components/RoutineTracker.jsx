import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiPlusCircle } from 'react-icons/fi';

const mockRoutineData = [
  { id: 1, title: 'Morning Meditation', time: '06:30 AM', completed: false },
  { id: 2, title: 'Workout', time: '07:00 AM', completed: false },
  { id: 3, title: 'Daily Planning', time: '08:00 AM', completed: false },
];

export default function RoutineTracker() {
  const [routines, setRoutines] = useState([]);
  const [newRoutine, setNewRoutine] = useState('');
  const [newTime, setNewTime] = useState('');

  useEffect(() => {
    setRoutines(mockRoutineData);
  }, []);

  const toggleComplete = (id) => {
    setRoutines((prev) =>
      prev.map((routine) =>
        routine.id === id ? { ...routine, completed: !routine.completed } : routine
      )
    );
  };

  const addRoutine = () => {
    if (newRoutine.trim() && newTime.trim()) {
      const newEntry = {
        id: Date.now(),
        title: newRoutine,
        time: newTime,
        completed: false,
      };
      setRoutines((prev) => [...prev, newEntry]);
      setNewRoutine('');
      setNewTime('');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Routine Tracker</h1>

      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          placeholder="Routine Title"
          className="border px-3 py-2 rounded w-1/2"
          value={newRoutine}
          onChange={(e) => setNewRoutine(e.target.value)}
        />
        <input
          type="time"
          className="border px-3 py-2 rounded"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
          onClick={addRoutine}
        >
          <FiPlusCircle /> Add
        </button>
      </div>

      <ul className="space-y-3">
        {routines.map((routine) => (
          <li
            key={routine.id}
            className={`flex items-center justify-between px-4 py-3 rounded shadow-sm border transition-all duration-300 ${
              routine.completed ? 'bg-green-100 text-green-700' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <div>
              <h3 className="text-lg font-medium">{routine.title}</h3>
              <p className="text-sm text-gray-500">{routine.time}</p>
            </div>
            <button
              onClick={() => toggleComplete(routine.id)}
              className={`text-sm px-3 py-1 rounded border font-semibold transition-all ${
                routine.completed ? 'border-green-600 text-green-600' : 'border-blue-600 text-blue-600 hover:bg-blue-50'
              }`}
            >
              {routine.completed ? 'Done' : 'Mark Done'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

