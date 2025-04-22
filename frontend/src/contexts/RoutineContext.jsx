// src/contexts/RoutineContext.jsx

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// shape of a routine item:
// { id, title, time, type, completed }

const STORAGE_KEY = 'my_app_routines';
const RoutineContext = createContext();

export function RoutineProvider({ children }) {
  // 1. Load initial state from localStorage (or fall back to [])
  const [routines, setRoutines] = useState(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (err) {
      console.error('Failed to read routines from storage:', err);
      return [];
    }
  });

  // 2. Any time routines change, write back to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
    } catch (err) {
      console.error('Failed to write routines to storage:', err);
    }
  }, [routines]);

  // 3. API methods

  const addRoutine = useCallback(
    ({ id, title, time = '', type = 'personal' }) => {
      setRoutines((prev) => {
        // Prevent duplicate IDs
        if (prev.some((r) => r.id === (id || null))) return prev;
        return [
          ...prev,
          {
            id: id || Date.now(),
            title,
            time,
            type,
            completed: false,
          },
        ];
      });
    },
    []
  );

  const toggleRoutine = useCallback((id) => {
    setRoutines((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      )
    );
  }, []);

  const deleteRoutine = useCallback((id) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRoutine = useCallback((updated) => {
    setRoutines((prev) =>
      prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
    );
  }, []);

  return (
    <RoutineContext.Provider
      value={{
        routines,
        addRoutine,
        toggleRoutine,
        deleteRoutine,
        updateRoutine,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
}

export const useRoutines = () => useContext(RoutineContext);
