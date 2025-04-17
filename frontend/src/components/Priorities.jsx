// src/components/Priorities.jsx

import React from 'react';
import TaskCard from './TaskCard';

export default function Priorities({ tasks, onSelectTask }) {
  // Group tasks by their priority category
  const mustDo   = tasks.filter(t => t.priority === 'Must Do');
  const shouldDo = tasks.filter(t => t.priority === 'Should Do');
  const couldDo  = tasks.filter(t => t.priority === 'Could Do');
  const mightDo  = tasks.filter(t => t.priority === 'Might Do');

  const sections = [
    { title: 'Must Do',   items: mustDo },
    { title: 'Should Do', items: shouldDo },
    { title: 'Could Do',  items: couldDo },
    { title: 'Might Do',  items: mightDo },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {sections.map(({ title, items }) => (
        <div key={title}>
          <h3 className="font-semibold mb-2">{title}</h3>
          <ul className="space-y-2">
            {items.length > 0 ? (
              items.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onSelectTask(task)}
                />
              ))
            ) : (
              <li className="text-gray-400">No tasks</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}
