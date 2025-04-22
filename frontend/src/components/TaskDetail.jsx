import React, { useState, useEffect } from 'react';
import TaskMenu from './TaskMenu';

const URGENCY_OPTIONS = ['Must Do', 'Should Do', 'Could Do', 'Might Do'];
const TYPE_OPTIONS = ['Personal', 'Work', 'Routine'];

export default function TaskDetail({ task = {}, onSave }) {
  const [form, setForm] = useState({
    id: task.id || null,
    title: '',
    due_date: '',
    priority: 'Should Do',
    type: 'Personal',
    subtasks: [],
    newSubtask: '',
  });

  useEffect(() => {
    if (task) {
      setForm({
        id: task.id || null,
        title: task.title || '',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        priority: task.priority || 'Should Do',
        type: task.type || 'Personal',
        subtasks: task.subtasks || [],
        newSubtask: '',
      });
    }
  }, [task]);

  const handleChange = (name, value) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const addSubtask = () => {
    if (form.newSubtask.trim()) {
      setForm((prev) => ({
        ...prev,
        subtasks: [...prev.subtasks, { title: prev.newSubtask, done: false }],
        newSubtask: '',
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { newSubtask, ...payload } = form;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Task Details</h2>
        <TaskMenu task={form} />
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Task Name</label>
        <input
          type="text"
          name="title"
          value={form.title}
          onChange={(e) => handleChange('title', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
          required
        />
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium">Urgency</label>
        <select
          name="priority"
          value={form.priority}
          onChange={(e) => handleChange('priority', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        >
          {URGENCY_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          name="type"
          value={form.type}
          onChange={(e) => handleChange('type', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Due Date */}
      <div>
        <label className="block text-sm font-medium">Due Date</label>
        <input
          type="date"
          name="due_date"
          value={form.due_date}
          onChange={(e) => handleChange('due_date', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        />
      </div>

      {/* Subtasks */}
      <div>
        <label className="block text-sm font-medium mb-1">Subtasks</label>
        <ul className="space-y-2 mb-2">
          {form.subtasks.map((sub, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={sub.done} readOnly />
              <span>{sub.title}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.newSubtask}
            onChange={(e) => handleChange('newSubtask', e.target.value)}
            placeholder="New subtask"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="button"
            onClick={addSubtask}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {form.id ? 'Save Changes' : 'Create Task'}
      </button>
    </form>
  );
}
