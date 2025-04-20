import React, { useState, useCallback } from 'react';
import Sidebar     from '../components/Sidebar';
import TopBar      from '../components/TopBar';
import TaskList    from '../components/TaskList';
import CalendarView from '../components/CalendarView';
import Priorities  from '../components/Priorities';
import TaskDetail  from '../components/TaskDetail';
import { useTasks } from '../hooks/useTasks';
import RoutineTracker from '../components/RoutineTracker';

export default function Dashboard() {
  const [view, setView]               = useState('home');
  const [selectedTask, setSelected]   = useState(null);
  const [operationError, setOpError]  = useState(null);
  const { tasks, isLoading, error, createTask, updateTask } = useTasks();

  // Called by TaskDetail with new or edited data
  const handleSave = useCallback(async (taskData) => {
    setOpError(null);
    try {
      if (selectedTask?.id) {
        await updateTask(selectedTask.id, taskData);
      } else {
        await createTask(taskData);
      }
      setSelected(null);
      setView('home');
    } catch (err) {
      setOpError(err.message);
    }
  }, [selectedTask, createTask, updateTask]);

  // Prepare form for creating a new task
  const startCreate = () => {
    setSelected({
      title:       '',
      description: '',
      due_date:    new Date().toISOString().split('T')[0],
      priority:    'Should Do',
    });
    setView('create');
    setOpError(null);
  };

  // Prepare form for editing an existing task
  const editTask = (task) => {
    setSelected(task);
    setView('edit');
    setOpError(null);
  };

  // Determine which main view to render
  const renderMain = () => {
    if (isLoading) return <div>Loading...</div>;
    if (error)     return <div className="text-red-600">Error: {error}</div>;

    if (view === 'create' || view === 'edit') {
      return (
        <>
          {operationError && (
            <div className="mb-4 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded">
              {operationError}
            </div>
          )}
          {/* Pass createTask/updateTask logic into the form */}
          <TaskDetail task={selectedTask} onSave={handleSave} />
        </>
      );
    }

    switch (view) {
      case 'today':
      case 'upcoming':
        return <TaskList tasks={tasks} onSelectTask={editTask} />;
      case 'priorities':
        return <Priorities tasks={tasks} onSelectTask={editTask} />;
      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            onDateCreate={({ dateStr }) => {
              setSelected({ title: '', description: '', due_date: dateStr, priority: 'Should Do' });
              setView('create');
            }}
            onEventDrop={async (id, updateInfo) => {
              try { await updateTask(id, updateInfo); }
              catch (err) { setOpError(err.message); }
            }}
          />
        );
        case 'routine':
          return <RoutineTracker />;
      default:
        return <div>Select a view or create a new task</div>;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar
        currentView={view}
        onViewChange={(v) => { setView(v); setSelected(null); setOpError(null); }}
        onAddTask={startCreate}
      />
      <div className="flex-1 flex flex-col">
        <TopBar title={
          view === 'create' ? 'New Task'
          : view === 'edit'   ? 'Edit Task'
          : view.charAt(0).toUpperCase() + view.slice(1)
        }/>
        <main className="p-6 overflow-auto">{renderMain()}</main>
      </div>
    </div>
  );
}
