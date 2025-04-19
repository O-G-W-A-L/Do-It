import React, { useState, useEffect } from 'react';

const URGENCY_OPTIONS = [
  'Must Do',
  'Should Do',
  'Could Do',
  'Might Do'
];

const TYPE_OPTIONS = [
  'Personal',
  'Work',
  'Routine'
];

export default function TaskDetail({ task = {}, onSave }) {
  const [form, setForm] = useState({
    id: task.id,
    title: '',
    description: '',
    due_date: '',
    priority: 'Should Do',
    type: 'Personal',
    subtasks: [],
    newSubtask: ''
  });

  useEffect(() => {
    if (task) {
      setForm({
        id: task.id,
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date ? task.due_date.slice(0, 10) : '',
        priority: task.priority || 'Should Do',
        type: task.type || 'Personal',
        subtasks: task.subtasks || [],
        newSubtask: ''
      });
    }
  }, [task]);

  const change = (name, value) =>
    setForm(f => ({ ...f, [name]: value }));

  const addSub = () => {
    if (form.newSubtask.trim()) {
      setForm(f => ({
        ...f,
        subtasks: [...f.subtasks, { title: f.newSubtask, done: false }],
        newSubtask: ''
      }));
    }
  };

  const submit = e => {
    e.preventDefault();
    const { newSubtask, ...payload } = form;
    onSave(payload);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium">Task Name</label>
        <input
          name="title"
          value={form.title}
          onChange={e => change('title', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={e => change('description', e.target.value)}
          className="mt-1 w-full p-2 border rounded h-24 resize-none"
        />
      </div>

      {/* Urgency */}
      <div>
        <label className="block text-sm font-medium">Urgency</label>
        <select
          name="priority"
          value={form.priority}
          onChange={e => change('priority', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        >
          {URGENCY_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium">Type</label>
        <select
          name="type"
          value={form.type}
          onChange={e => change('type', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        >
          {TYPE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
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
          onChange={e => change('due_date', e.target.value)}
          className="mt-1 w-full p-2 border rounded"
        />
      </div>

      {/* Subtasks */}
      <div>
        <label className="block text-sm font-medium mb-1">Subtasks</label>
        <ul className="mb-2 space-y-2">
          {form.subtasks.map((st, i) => (
            <li key={i} className="flex items-center gap-2">
              <input type="checkbox" checked={st.done} readOnly />
              <span>{st.title}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.newSubtask}
            onChange={e => change('newSubtask', e.target.value)}
            placeholder="New subtask"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="button"
            onClick={addSub}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Save */}
      <button
        type="submit"
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
      >
        {form.id ? 'Save Changes' : 'Create Task'}
      </button>
    </form>
  );
}
