import React from 'react';
import TaskCard from './TaskCard';

export default function TaskList({ tasks }) {
  if (!tasks || tasks.length === 0) {
    return <div className="text-gray-400">No tasks found.</div>;
  }

  return (
    <ul className="space-y-4">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </ul>
  );
}
