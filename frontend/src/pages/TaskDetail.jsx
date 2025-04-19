import React, { useState, useEffect } from 'react';

const URGENCY = ['Must Do', 'Should Do', 'Could Do', 'Might Do'];

export default function TaskDetail({ task = {}, onSave }) {
  const [data, setData] = useState({
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    priority: 'Should Do',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (task.id !== undefined) {
      const preloadedData = {
        title: task.title || '',
        description: task.description || '',
        due_date: task.due_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        priority: task.priority || 'Should Do',
      };
      console.log("Loaded task for editing:", preloadedData);
      setData(preloadedData);
    }
  }, [task]);

  const validate = () => {
    const errs = {};
    if (!data.title.trim()) errs.title = 'Title is required';
    if (!data.due_date) errs.due_date = 'Please select a due date';
    else if (isNaN(new Date(data.due_date).getTime())) errs.due_date = 'Invalid date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
    console.log(`Changed ${name}:`, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      console.warn("Validation failed:", errors);
      return;
    }

    const payload = {
      ...data,
      due_date: new Date(data.due_date).toISOString(), // Send as ISO string
    };

    console.log("Submitting task payload:", payload);

    try {
      const result = await onSave(payload);
      console.log("onSave result:", result);
      setData({
        title: '',
        description: '',
        due_date: new Date().toISOString().split('T')[0],
        priority: 'Should Do',
      });
    } catch (err) {
      console.error('Error during submission:', err);
      setErrors({
        submit: err.response?.data?.due_date?.[0] || err.message || 'Submission failed',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.submit && <div className="text-red-700">{errors.submit}</div>}

      <input
        name="title"
        value={data.title}
        onChange={handleChange}
        placeholder="Title"
        required
        className="w-full border rounded px-3 py-2"
      />
      {errors.title && <p className="text-red-500">{errors.title}</p>}

      <textarea
        name="description"
        value={data.description}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      />

      <input
        name="due_date"
        type="date"
        value={data.due_date}
        onChange={handleChange}
        required
        className="w-full border rounded px-3 py-2"
      />
      {errors.due_date && <p className="text-red-500">{errors.due_date}</p>}

      <select
        name="priority"
        value={data.priority}
        onChange={handleChange}
        className="w-full border rounded px-3 py-2"
      >
        {URGENCY.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        Save Task
      </button>
    </form>
  );
}