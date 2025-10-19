// contexts/GoalContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const GoalContext = createContext();

export function GoalProvider({ children }) {
  const [goals, setGoals] = useState(() => {
    const savedGoals = localStorage.getItem('goals');
    return savedGoals ? JSON.parse(savedGoals) : { daily: '', monthly: '' };
  });

  useEffect(() => {
    localStorage.setItem('goals', JSON.stringify(goals));
  }, [goals]);

  const updateGoal = (type, goal) => {
    setGoals(prev => ({ ...prev, [type]: goal }));
  };

  return (
    <GoalContext.Provider value={{ goals, updateGoal }}>
      {children}
    </GoalContext.Provider>
  );
}