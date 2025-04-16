import { useState, useEffect, useMemo } from 'react';
import api from '../axiosInstance';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('all');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api.get('/api/tasks/')  // now protected by JWT
      .then(res => { if (!cancelled) setTasks(res.data); })
      .catch(err => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, []);

  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      const due = new Date(t.dueDate);
      switch (view) {
        case 'today':
          return due.toDateString() === now.toDateString();
        case 'upcoming': {
          const diffDays = (due - now) / (1000*60*60*24);
          return diffDays >= 0 && diffDays <= 7;
        }
        case 'highImpact':
          return t.priority === 'High';
        case 'focusMode':
          return Boolean(t.focusBlock);
        default:
          return true;
      }
    });
  }, [tasks, view]);

  return { tasks, view, setView, filteredTasks, isLoading, error };
}
