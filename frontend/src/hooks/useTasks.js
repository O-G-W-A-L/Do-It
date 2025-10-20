import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api.js';

export function useTasks() {
  const [tasks, setTasks]       = useState([]);
  const [view, setView]         = useState('all');
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);

  // Fetch Tasks
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api.get('/api/tasks/')
      .then(res => {
        if (!cancelled) {
          setTasks(res.data);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err.message || 'Error fetching tasks');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, []);

  // ─── Filtered Tasks ───────────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(t => {
      if (!t.due_date) return true;
      const due = new Date(t.due_date);
      switch (view) {
        case 'today':
          return due.toDateString() === now.toDateString();
        case 'upcoming':
          return (due - now) / (1000 * 60 * 60 * 24) <= 7;
        case 'highImpact':
          return t.priority === 'Must Do';
        case 'focusMode':
          return t.focus_block;
        default:
          return true;
      }
    });
  }, [tasks, view]);

  // ─── Validation ──────────────────────────────────────────────────────
  const validate = useCallback(data => {
    const errs = [];
    if (!data.title?.trim()) errs.push('Title is required');
    if (!data.due_date) errs.push('Due date is required');
    else if (isNaN(new Date(data.due_date).getTime()))
      errs.push('Invalid due date format');
    return errs;
  }, []);

  // ─── Create Task ──────────────────────────────────────────────────────
  const createTask = useCallback(async taskData => {
    const errs = validate(taskData);
    if (errs.length) throw new Error(errs.join(', '));

    const payload = {
      ...taskData,
      title:     taskData.title.trim(),
      due_date:  new Date(taskData.due_date).toISOString(),
      subtasks:  taskData.subtasks || [],
    };

    const res = await api.post('/api/tasks/', payload);
    setTasks(prev => [...prev, res.data]);
    return res.data;
  }, [validate]);

  // ─── Update Entire Task ───────────────────────────────────────────────
  const updateTask = useCallback(async (id, taskData) => {
    const errs = validate(taskData);
    if (errs.length) throw new Error(errs.join(', '));

    const payload = {
      ...taskData,
      due_date: new Date(taskData.due_date).toISOString(),
      subtasks: taskData.subtasks || [],
    };

    const res = await api.put(`/api/tasks/${id}/`, payload);
    setTasks(prev => prev.map(t => t.id === id ? res.data : t));
    return res.data;
  }, [validate]);

  // ─── Delete Task ──────────────────────────────────────────────────────
  const deleteTask = useCallback(async id => {
    await api.delete(`/api/tasks/${id}/`);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  // ─── Toggle Task Complete ─────────────────────────────────────────────
  const toggleComplete = useCallback(async id => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    const res = await api.patch(`/api/tasks/${id}/`, {
      is_done: !task.is_done
    });
    setTasks(prev => prev.map(t => t.id === id ? res.data : t));
    return res.data;
  }, [tasks]);

  // Update Only Subtasks
  const updateTaskSubtasks = useCallback(async (id, newSubtasks) => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    const res = await api.patch(`/api/tasks/${id}/`, {
      subtasks: newSubtasks
    });

    setTasks(prev => prev.map(t => t.id === id ? res.data : t));
    return res.data;
  }, [tasks]);

  return {
    tasks,
    filteredTasks,
    view,
    setView,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    updateTaskSubtasks, // 👈 make sure you export it!
  };
}
