import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import TaskList from '../components/TaskList';
import TaskDetail from '../components/TaskDetail';
import CalendarView from '../components/CalendarView';
import Priorities from '../components/Priorities';
import { useTasks } from '../hooks/useTasks';

export default function Dashboard() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedTask, setSelectedTask] = useState(null);
  const { tasks, updateTask, createTask } = useTasks();

  // Create or update, then reset to home
  const handleSave = taskData => {
    if (taskData.id) updateTask(taskData.id, taskData);
    else createTask(taskData);
    setSelectedTask(null);
    setCurrentView('home');
  };

  // Handlers
  const selectTask = task => {
    setSelectedTask(task);
    setCurrentView('edit');
  };
  const startCreate = () => {
    setSelectedTask({});
    setCurrentView('create');
  };

  // Filters
  const todayTasks = tasks.filter(t => {
    const today = new Date();
    const d = new Date(t.dueDate);
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });
  const upcomingTasks = tasks.filter(t => {
    const today = new Date(),
      d = new Date(t.dueDate);
    const days = (d - today) / (1000 * 60 * 60 * 24);
    return days > 0 && days <= 7;
  });
  const urgencyTasks = tasks.filter(t => {
    const today = new Date(),
      d = new Date(t.dueDate);
    const days = (d - today) / (1000 * 60 * 60 * 24);
    return days <= 3 && t.priority === 'Must Do';
  });

  // Main content
  let content;
  if (currentView === 'create' || currentView === 'edit') {
    content = <TaskDetail task={selectedTask} onSave={handleSave} />;
  } else {
    switch (currentView) {
      case 'today':
        content = <TaskList tasks={todayTasks} onSelectTask={selectTask} />;
        break;
      case 'upcoming':
        content = <TaskList tasks={upcomingTasks} onSelectTask={selectTask} />;
        break;
      case 'priorities':
        content = <Priorities tasks={urgencyTasks} onSelectTask={selectTask} />;
        break;
      case 'calendar':
        content = (
          <CalendarView
            tasks={tasks}
            onDateCreate={info => {
              setSelectedTask({ title: '', description: '', dueDate: info.dateStr });
              setCurrentView('create');
            }}
            onEventDrop={(id, upd) => updateTask(id, upd)}
          />
        );
        break;
      default:
        content = <div className="p-6 text-gray-500">Select a view from the sidebar</div>;
    }
  }

  return (
    <div className="flex h-screen bg-[#f7f8f6] text-gray-800">
      <Sidebar
        currentView={currentView}
        onViewChange={view => {
          setCurrentView(view);
          setSelectedTask(null);
        }}
        onAddTask={startCreate}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar
          title={
            currentView === 'home'
              ? 'Home'
              : currentView.charAt(0).toUpperCase() + currentView.slice(1)
          }
        />

        <main className="flex-1 overflow-auto p-6 w-full">{content}</main>
      </div>
    </div>
  );
}
