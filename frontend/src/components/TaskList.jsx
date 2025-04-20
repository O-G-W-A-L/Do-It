import React from 'react';
import TaskCard from './TaskCard';

export default function TaskList({ tasks, onSelectTask }) {
  // 1. Handle empty or undefined tasks array  
  if (!tasks || tasks.length === 0) {
    return <div className="text-gray-400">No tasks found.</div>;
  }

  // 2. Render each task with a stable key for optimal reconciliation  
  return (
    <ul className="space-y-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => onSelectTask(task)}
        />
      ))}
    </ul>
  );
}
