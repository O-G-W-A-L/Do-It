import React, { useState } from 'react';
import { FiCpu, FiPlus, FiEdit3 } from 'react-icons/fi';
import PropTypes from 'prop-types';

// Simulated AI task generation (replace with actual backend call)
const generateAITasks = (previousTasks = []) => {
  // In real use: fetch('/api/generate-tasks', { method: 'POST', body: JSON.stringify(previousTasks) })
  return [
    {
      id: crypto.randomUUID(),
      title: 'Review monthly budget report',
      dueDate: '05/30/2025',
      priority: 'Must Do',
      category: 'Work',
    },
    {
      id: crypto.randomUUID(),
      title: '30-minute cardio workout',
      dueDate: '05/25/2025',
      priority: 'Should Do',
      category: 'Fitness',
    },
    {
      id: crypto.randomUUID(),
      title: 'Declutter desktop folders',
      dueDate: '05/26/2025',
      priority: 'Could Do',
      category: 'Routine',
    },
  ];
};

export default function AITaskGenerator({ onTasksGenerated }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const newTasks = await generateAITasks(); // Simulate previous tasks
    setTasks(newTasks);
    setLoading(false);
    if (onTasksGenerated) onTasksGenerated(newTasks);
  };

  const handleEdit = (id, field, value) => {
    const updated = tasks.map((task) =>
      task.id === id ? { ...task, [field]: value } : task
    );
    setTasks(updated);
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-indigo-900 flex items-center">
        <FiCpu className="mr-2" /> AI Task Generator
      </h2>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition disabled:opacity-50"
      >
        <FiPlus className="mr-2" />
        {loading ? 'Generating...' : 'Generate Tasks'}
      </button>

      {tasks.length > 0 && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 shadow-sm bg-white"
            >
              <div className="mb-2">
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={task.title}
                  onChange={(e) => handleEdit(task.id, 'title', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Due Date</label>
                  <input
                    type="text"
                    value={task.dueDate}
                    onChange={(e) => handleEdit(task.id, 'dueDate', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                    placeholder="MM/DD/YYYY"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={task.priority}
                    onChange={(e) => handleEdit(task.id, 'priority', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option>Must Do</option>
                    <option>Should Do</option>
                    <option>Could Do</option>
                    <option>Might Do</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={task.category}
                    onChange={(e) => handleEdit(task.id, 'category', e.target.value)}
                    className="w-full mt-1 px-3 py-2 border rounded-md"
                  >
                    <option>Work</option>
                    <option>Personal</option>
                    <option>Routine</option>
                    <option>Fitness</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

AITaskGenerator.propTypes = {
  onTasksGenerated: PropTypes.func, // Callback to push tasks to global/task state
};
