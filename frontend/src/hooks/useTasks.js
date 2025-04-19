import { useState, useEffect } from 'react';
import api from '../axiosInstance';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('all');
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    console.log("[useTasks] Fetching tasks...");

    api.get('/api/tasks/')
      .then(res => {
        if (!cancelled) {
          console.log("[useTasks] Tasks fetched:", res.data);
          setTasks(res.data);
        }
      })
      .catch(err => {
        if (!cancelled) {
          const errMsg = err.message || 'Error fetching tasks';
          console.error("[useTasks] Error fetching tasks:", errMsg);
          setError(errMsg);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          console.log("[useTasks] Done loading tasks.");
        }
      });

    return () => { cancelled = true; };
  }, []);

  const filteredTasks = tasks.filter(t => {
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
    console.log(`[useTasks] Current view: ${view}`);
    console.log("[useTasks] Filtered tasks:", filteredTasks);
  }, [view, tasks]);

  const validateTaskData = (taskData) => {
    const errors = [];
    if (!taskData.title?.trim()) errors.push('Title is required');
    if (!taskData.due_date) errors.push('Due date is required');
    else {
      const date = new Date(taskData.due_date);
      if (isNaN(date.getTime())) errors.push('Invalid due date format');
    }
    return errors;
  };

  const createTask = async (taskData) => {
    console.log("[useTasks] Creating task:", taskData);
    try {
      const validationErrors = validateTaskData(taskData);
      if (validationErrors.length > 0) {
        console.warn("[useTasks] Validation errors:", validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      const formattedData = {
        ...taskData,
        title: taskData.title.trim(),
        due_date: new Date(taskData.due_date).toISOString(),
        description: taskData.description?.trim() || '',
        priority: taskData.priority || 'Should Do',
        type: taskData.type || 'Personal',
        focus_block: !!taskData.focus_block,
        project: taskData.project || null,
        routine: taskData.routine || null,
        goal: taskData.goal || null,
      };

      console.log("[useTasks] Formatted task for POST:", formattedData);

      const response = await api.post('/api/tasks/', formattedData);
      console.log("[useTasks] Task created successfully:", response.data);
      setTasks(prev => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      console.error("[useTasks] Error creating task:", errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateTask = async (taskId, updatedData) => {
    console.log(`[useTasks] Updating task ${taskId}:`, updatedData);
    try {
      const validationErrors = validateTaskData(updatedData);
      if (validationErrors.length > 0) {
        console.warn("[useTasks] Validation errors:", validationErrors);
        throw new Error(validationErrors.join(', '));
      }

      const formattedData = {
        ...updatedData,
        due_date: new Date(updatedData.due_date).toISOString(),
      };

      const response = await api.put(`/api/tasks/${taskId}/`, formattedData);
      console.log("[useTasks] Task updated successfully:", response.data);

      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, ...response.data } : task
      ));

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data || err.message;
      console.error(`[useTasks] Error updating task ${taskId}:`, errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    tasks,
    view,
    setView,
    filteredTasks,
    isLoading,
    error,
    createTask,
    updateTask
  };
}