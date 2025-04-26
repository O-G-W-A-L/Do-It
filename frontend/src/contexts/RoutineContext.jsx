// src/contexts/RoutineContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';

const STORAGE_KEY = 'my_app_routines';
const RoutineContext = createContext();

export function RoutineProvider({ children }) {
  // 1) Load initial state and migrate old items to include lastCompleted
  const [routines, setRoutines] = useState(() => {
    try {
      const json = localStorage.getItem(STORAGE_KEY);
      const arr  = json ? JSON.parse(json) : [];
      // Ensure every routine has a lastCompleted field
      return arr.map(r => ({
        ...r,
        lastCompleted: r.lastCompleted || null,
      }));
    } catch {
      return [];
    }
  });

  // 2) Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }, [routines]);

  // Utility to get today in YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // 3) Add new routine
  const addRoutine = useCallback(({ id, title, time = '', type = 'personal' }) => {
    setRoutines(prev => {
      if (prev.some(r => r.id === (id || null))) return prev;
      return [
        ...prev,
        {
          id:            id ?? Date.now(),
          title,
          time,
          type,
          lastCompleted: null,        // ← init
        },
      ];
    });
  }, []);

  // 4) Toggle today’s completion
  const toggleRoutine = useCallback(id => {
    setRoutines(prev =>
      prev.map(r => {
        if (r.id !== id) return r;
        // If already completed today, un-complete; else mark complete
        const newDate = r.lastCompleted === todayStr ? null : todayStr;
        return { ...r, lastCompleted: newDate };
      })
    );
  }, [todayStr]);

  // 5) Delete and update remain unchanged
  const deleteRoutine = useCallback(id => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  const updateRoutine = useCallback(updated => {
    setRoutines(prev =>
      prev.map(r => (r.id === updated.id ? { ...r, ...updated } : r))
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
