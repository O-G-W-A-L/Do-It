import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import HomePage from './HomePage';
import MyTasks from '../components/MyTasks';
import CalendarView from '../components/CalendarView';
import Priorities from '../components/Priorities';
import TaskDetail from '../components/TaskDetail';
import RoutineTracker from '../components/RoutineTracker';
import MyProgress from '../components/MyProgress';
import { useTasks } from '../hooks/useTasks';
import { useRoutines } from '../contexts/RoutineContext';

export default function Dashboard() {
  const [view, setView] = useState('home');
  const [selectedTask, setSelected] = useState(null);
  const [operationError, setOpError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Task CRUD
  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();

  // Routine
  const { routines, addRoutine, toggleRoutine } = useRoutines();

  const handleMakeRoutine = useCallback(id => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error(`Task ${id} not found`);
    addRoutine({
      title: task.title,
      time: task.time || '',
      type: task.type.toLowerCase(),
    });
  }, [tasks, addRoutine]);

  const handleSave = useCallback(
    async taskData => {
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
        setOpError(err.message || 'Operation failed');
      }
    },
    [selectedTask, createTask, updateTask]
  );

  const startCreate = () => {
    setSelected({
      title: '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Should Do',
      type: 'Personal',
    });
    setView('create');
    setOpError(null);
  };

  const editTask = task => {
    setSelected(task);
    setView('edit');
    setOpError(null);
  };

  const handleViewChange = useCallback(v => {
    setView(v);
    setSelected(null);
    setOpError(null);
    setIsSidebarOpen(false);
  }, []);

  const renderMain = () => {
    if (isLoading) return <div>Loading…</div>;
    if (error) return <div className="text-red-600">Error: {error}</div>;

    if (view === 'create' || view === 'edit') {
      return (
        <>
          {operationError && (
            <div className="mb-4 bg-red-100 border-red-400 text-red-700 px-4 py-3 rounded">
              {operationError}
            </div>
          )}
          <TaskDetail
            task={selectedTask}
            onSave={handleSave}
            onSpecificDate={() => {}}
          />
        </>
      );
    }

    switch (view) {
      case 'home':
        return (
          <HomePage
            tasks={tasks}
            onAddTask={createTask}
            onSelectTask={editTask}
            onToggleComplete={toggleComplete}
            onMakeRoutine={handleMakeRoutine}
            onToggleRoutine={toggleRoutine}
          />
        );

      case 'mytasks':
        return (
          <MyTasks
            tasks={tasks}
            onAddTask={createTask}
            onSelectTask={editTask}
            onEdit={editTask}
            onDelete={deleteTask}
            onToggleComplete={toggleComplete}
            onMakeRoutine={handleMakeRoutine}
            onToggleRoutine={toggleRoutine}
            onSetTimer={updateTask}
            onSetAlarm={updateTask}
            onSetReminder={updateTask}
            onSpecificDate={updateTask}
          />
        );

      case 'priorities':
        return (
          <Priorities
            tasks={tasks}
            onSelectTask={editTask}
            onDeleteTask={deleteTask}
            onToggleComplete={toggleComplete}
          />
        );

      case 'calendar':
        return (
          <CalendarView
            tasks={tasks}
            routines={routines}
            onDateCreate={({ dateStr }) => {
              setSelected({
                title: '',
                due_date: dateStr,
                priority: 'Should Do',
                type: 'Personal',
              });
              setView('create');
            }}
            onEventDrop={async (id, updateInfo) => {
              try {
                await updateTask(id, updateInfo);
              } catch (err) {
                setOpError(err.message);
              }
            }}
            onDeleteEvent={deleteTask}
            onToggleComplete={toggleComplete}
          />
        );

      case 'routine':
        return <RoutineTracker />;

      case 'progress':
        return <MyProgress tasks={tasks} routines={routines} />;

      default:
        return <div>Select a view or create a new task</div>;
    }
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed z-40 h-screen w-64 transform transition-transform duration-200 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0`}
      >
        <Sidebar
          currentView={view}
          onViewChange={handleViewChange}
          onAddTask={startCreate}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          title={
            view === 'create'
              ? 'New Task'
              : view === 'edit'
              ? 'Edit Task'
              : view.charAt(0).toUpperCase() + view.slice(1)
          }
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-6 overflow-auto bg-gray-50">{renderMain()}</main>
      </div>
    </div>
  );
}