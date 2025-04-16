import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchTaskById, updateTask } from '../api/tasks';
import RichTextEditor from '../components/RichTextEditor';
import DatePicker from '../components/DatePicker';
import Select from '../components/Select';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [form, setForm] = useState({});

  useEffect(() => {
    fetchTaskById(id).then(data => {
      setTask(data);
      setForm(data);
    });
  }, [id]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await updateTask(id, form);
    navigate('/');
  };

  if (!task) return <div>Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-semibold mb-4">Edit Task</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          className="w-full border rounded p-2"
        />
        <RichTextEditor
          value={form.description}
          onChange={value => handleChange('description', value)}
        />
        <DatePicker
          value={form.dueDate}
          onChange={date => handleChange('dueDate', date)}
        />
        <Select
          label="Priority"
          options={['Low','Medium','High']}
          value={form.priority}
          onChange={val => handleChange('priority', val)}
        />
        {/* Add more fields: status, subtasks, reminders, tags, etc. */}
        <div className="flex justify-end space-x-2">
          <button type="button" onClick={() => navigate(-1)} className="px-4 py-2">Cancel</button>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}

