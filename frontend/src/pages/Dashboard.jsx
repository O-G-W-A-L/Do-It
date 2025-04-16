import React from 'react';
//import TopBar from '../components/TopBar';
import Sidebar from '../components/Sidebar';
import TaskList from '../components/TaskList';
import { useTasks } from '../hooks/useTasks';

export default function Dashboard() {
  // Container logic: fetch & filter tasks
  const {
    tasks,
    view,
    setView,
    filteredTasks,
    isLoading,
    error
  } = useTasks();

  if (isLoading) return <div>Loading tasks…</div>;
  if (error)      return <div>Error loading tasks.</div>;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentView={view} onViewChange={setView} />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="p-6 overflow-auto">
          <TaskList tasks={filteredTasks} />
        </main>
      </div>
    </div>
  );
}

