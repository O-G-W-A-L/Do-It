import React from 'react';
import { Link } from 'react-router-dom';

export default function TaskCard({ task }) {
  return (
    <li className="bg-white p-4 rounded shadow flex justify-between items-center">
      <div>
        <Link
          to={`/tasks/${task.id}`}
          className="text-lg font-medium hover:underline"
        >
          {task.title}
        </Link>
        <div className="text-sm text-gray-500">
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </div>
      </div>
      <button className="px-3 py-1 border rounded">
        {task.completed ? '✓' : 'Mark Done'}
      </button>
    </li>
  );
}

