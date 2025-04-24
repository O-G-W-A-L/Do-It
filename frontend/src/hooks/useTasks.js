// src/hooks/useTasks.js
import { useState, useEffect, useCallback } from 'react';
import api from '../axiosInstance';

export function useTasks() {
  const [tasks, setTasks]       = useState([]);
  const [view, setView]         = useState('all');
  const [isLoading, setLoading] = useState(true);
  const [error, setError]       = useState(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    console.log("[useTasks] Fetching tasks...");
    try {
      const res = await api.get('/api/tasks/');
      if (!cancelled) {
        console.log("[useTasks] Tasks fetched:", res.data);
        setTasks(res.data);
      }
    } catch (err) {
      if (!cancelled) {
        const msg = err.message || 'Error fetching tasks';
        console.error("[useTasks] Error fetching tasks:", msg);
        setError(msg);
      }
    } finally {
      if (!cancelled) {
        setLoading(false);
        console.log("[useTasks] Done loading tasks.");
      }
    }
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ─── Filtering by view ──────────────────────────────────────────────────
  const filteredTasks = tasks.filter(t => {
    if (!t.due_date) return true;
    const due = new Date(t.due_date);
    const now = new Date();
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

  useEffect(() => {
    console.log(`[useTasks] Current view: ${view}`, filteredTasks);
  }, [view, tasks]);

  // ─── Validation ────────────────────────────────────────────────────────
  const validate = data => {
    const errs = [];
    if (!data.title?.trim()) errs.push('Title is required');
    if (!data.due_date) errs.push('Due date is required');
    else if (isNaN(new Date(data.due_date).getTime())) errs.push('Invalid due date format');
    return errs;
  };

  // ─── Create ────────────────────────────────────────────────────────────
  const createTask = async taskData => {
    console.log("[useTasks] Creating task:", taskData);
    const errs = validate(taskData);
    if (errs.length) throw new Error(errs.join(', '));

    const payload = {
      ...taskData,
      title: taskData.title.trim(),
      due_date: new Date(taskData.due_date).toISOString(),
    };

    try {
      const res = await api.post('/tasks/', payload);
      setTasks(prev => [...prev, res.data]);
      return res.data;
    } catch (err) {
      const msg = err.response?.data || err.message;
      console.error("[useTasks] Error creating task:", msg);
      setError(msg);
      throw new Error(msg);
    }
  };

  // ─── Update ────────────────────────────────────────────────────────────
  const updateTask = async (id, taskData) => {
    console.log(`[useTasks] Updating task ${id}:`, taskData);
    const errs = validate(taskData);
    if (errs.length) throw new Error(errs.join(', '));

    const payload = {
      ...taskData,
      due_date: new Date(taskData.due_date).toISOString(),
    };

    try {
      const res = await api.put(`/tasks/${id}/`, payload);
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (err) {
      const msg = err.response?.data || err.message;
      console.error(`[useTasks] Error updating task ${id}:`, msg);
      setError(msg);
      throw new Error(msg);
    }
  };

  // ─── Delete ────────────────────────────────────────────────────────────
  const deleteTask = async id => {
    console.log(`[useTasks] Deleting task ${id}`);
    try {
      await api.delete(`/tasks/${id}/`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const msg = err.response?.data || err.message;
      console.error(`[useTasks] Error deleting task ${id}:`, msg);
      setError(msg);
      throw new Error(msg);
    }
  };

  // ─── Toggle Complete ───────────────────────────────────────────────────
  const toggleComplete = async id => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');
    console.log(`[useTasks] Toggling complete for ${id}`);
    try {
      const res = await api.patch(`/tasks/${id}/`, { is_done: !task.is_done });
      setTasks(prev => prev.map(t => t.id === id ? res.data : t));
      return res.data;
    } catch (err) {
      const msg = err.response?.data || err.message;
      console.error(`[useTasks] Error toggling complete ${id}:`, msg);
      setError(msg);
      throw new Error(msg);
    }
  };

  return {
    tasks,
    filteredTasks,
    view,
    setView,
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  };
}
