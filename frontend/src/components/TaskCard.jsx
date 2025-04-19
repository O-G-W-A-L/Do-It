import React from 'react';
import { FiChevronRight } from 'react-icons/fi';

export default function TaskCard({ task, onClick }) {
  return (
    <li
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition cursor-pointer flex justify-between items-center"
    >
      <div>
        <h4 className="font-semibold">{task.title}</h4>
        {task.due_date && (
          <small className="text-gray-500">{new Date(task.due_date).toLocaleDateString()}</small>
        )}
      </div>
      <FiChevronRight className="text-gray-400" />
    </li>
  );
}
