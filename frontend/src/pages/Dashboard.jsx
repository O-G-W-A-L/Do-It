// src/pages/Dashboard.jsx
import React, { useState, useCallback } from 'react';
import Sidebar         from '../components/Sidebar';
import TopBar          from '../components/TopBar';
import HomePage        from './HomePage';
import MyTasks         from '../components/MyTasks';
import CalendarView    from '../components/CalendarView';
import Priorities      from '../components/Priorities';
import TaskDetail      from '../components/TaskDetail';
import RoutineTracker  from '../components/RoutineTracker';
import MyProgress      from '../components/MyProgress';
import { useTasks }    from '../hooks/useTasks';
import { useRoutines } from '../contexts/RoutineContext';

export default function Dashboard() {
  const [view, setView]              = useState('home');
  const [selectedTask, setSelected]  = useState(null);
  const [operationError, setOpError] = useState(null);

  // Task CRUD hooks
  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
  } = useTasks();

  // Routine management hook
  const { routines, addRoutine } = useRoutines();

  // Wrapper to convert a task into a routine
  const handleMakeRoutine = useCallback(id => {
    const task = tasks.find(t => t.id === id);
    if (!task) throw new Error('Task not found');

    // Map the Task fields to your Routine shape
    addRoutine({
      title: task.title,
      time:  task.time || '',             // if your Task model has a time field
      type:  task.type.toLowerCase(),     // match your RoutineTracker values
    });
  }, [tasks, addRoutine]);

  // Save (create or update) from TaskDetail
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
      title:    '',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'Should Do',
      type:     'Personal',
    });
    setView('create');
    setOpError(null);
  };

  const editTask = task => {
    setSelected(task);
    setView('edit');
    setOpError(null);
  };

  const renderMain = () => {
    if (isLoading) return <div>Loading…</div>;
    if (error)     return <div className="text-red-600">Error: {error}</div>;

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
            onSetTimer={updateTask}
            onSetAlarm={updateTask}
            onSetReminder={updateTask}
            onMakeRoutine={handleMakeRoutine}
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
                title:    '',
                due_date: dateStr,
                priority: 'Should Do',
                type:     'Personal',
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
      <Sidebar
        currentView={view}
        onViewChange={v => {
          setView(v);
          setSelected(null);
          setOpError(null);
        }}
        onAddTask={startCreate}
      />
      <div className="flex-1 flex flex-col">
        <TopBar
          title={
            view === 'create'
              ? 'New Task'
              : view === 'edit'
                ? 'Edit Task'
                : view.charAt(0).toUpperCase() + view.slice(1)
          }
        />
        <main className="p-6 overflow-auto">{renderMain()}</main>
      </div>
    </div>
  );
}
