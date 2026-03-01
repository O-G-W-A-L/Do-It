import React from 'react';
import { useTasks } from '../hooks/useTasks';
import PomodoroTimer from '../components/PomodoroTimer';

export default function FocusMode() {
  const { tasks, view } = useTasks();
  // Pick next focus task
  const focusTasks = tasks.filter(t => t.focusBlock).slice(0,1);

  if (focusTasks.length === 0) {
    return <div className="p-6">No tasks scheduled for focus mode.</div>;
  }

  const task = focusTasks[0];

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-100">
      <h2 className="text-3xl font-bold mb-6">Focus Mode</h2>
      <div className="w-full max-w-xl bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-2">{task.title}</h3>
        <p className="text-gray-600 mb-4">{task.description}</p>
        <PomodoroTimer taskId={task.id} />
      </div>
    </div>
  );
}

