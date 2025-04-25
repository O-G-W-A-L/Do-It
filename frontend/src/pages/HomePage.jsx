// src/pages/HomePage.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle } from 'react-icons/fi';
import { useRoutines } from '../contexts/RoutineContext';
import TaskCard from '../components/TaskCard';

// Static mappings
const URGENCY_STYLES = {
  'Must Do':   'bg-red-100 text-red-700',
  'Should Do': 'bg-yellow-100 text-yellow-700',
  'Could Do':  'bg-blue-100 text-blue-700',
  'Might Do':  'bg-gray-100 text-gray-700',
};

const QUOTES = [
  "“The only way to do great work is to love what you do.” – Steve Jobs",
  "“You miss 100% of the shots you don’t take.” – Wayne Gretzky",
  "“Success is not final; failure is not fatal.” – Winston Churchill",
];

export default function HomePage({
  tasks,
  onAddTask,
  onSelectTask,
  onDeleteTask,
  onToggleComplete,
}) {
  const { routines } = useRoutines();
  const [quick, setQuick] = useState({ title: '', due_date: '' });

  // Memoize “today” to avoid needless re-computations
  const today = useMemo(() => new Date(), []);

  // 1) Tasks due today
  const todaysTasks = useMemo(
    () =>
      tasks.filter(t => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return (
          d.getFullYear() === today.getFullYear() &&
          d.getMonth()    === today.getMonth() &&
          d.getDate()     === today.getDate()
        );
      }),
    [tasks, today]
  );

  // 2) Group today’s by type
  const groupedByType = useMemo(() => {
    return todaysTasks.reduce((acc, t) => {
      const type = t.type || 'Uncategorized';
      if (!acc[type]) acc[type] = [];
      acc[type].push(t);
      return acc;
    }, {});
  }, [todaysTasks]);

  // 3) Next upcoming (not done)
  const nextEvent = useMemo(() => {
    const upcoming = tasks
      .filter(t => t.due_date && !t.is_done && new Date(t.due_date) > new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    return upcoming[0] || null;
  }, [tasks]);

  // 4) TODAY’S TASKS PROGRESS ← ADDED
  const todayProgress = useMemo(() => {
    const total = todaysTasks.length;
    const done  = todaysTasks.filter(t => t.is_done).length;
    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0
    };
  }, [todaysTasks]);

  // 5) Contextual grouping (Type – Priority)
  const groupedContext = useMemo(() => {
    return tasks.reduce((acc, t) => {
      const key = `${t.type} – ${t.priority}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(t);
      return acc;
    }, {});
  }, [tasks]);

  // 6) Random “Must Do” focus
  const randomFocus = useMemo(() => {
    const mustDos = tasks.filter(t => t.priority === 'Must Do' && !t.is_done);
    if (!mustDos.length) return null;
    return mustDos[Math.floor(Math.random() * mustDos.length)];
  }, [tasks]);

  // 7) Quick-add handler
  const handleQuickAdd = () => {
    if (!quick.title.trim()) return;
    onAddTask({
      ...quick,
      priority: 'Should Do',
      type:     'Personal',
    });
    setQuick({ title: '', due_date: '' });
  };

  // 8) One-off random quote
  const quote = useMemo(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
    []
  );

  return (
    <div className="space-y-8">
      {/* Welcome & Quick-Add */}
      <section className="bg-white p-6 rounded shadow flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Welcome back!</h2>
          <p className="text-gray-600">Here's your daily snapshot.</p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          <input
            type="text"
            name="title"
            placeholder="New task..."
            value={quick.title}
            onChange={e => setQuick(q => ({ ...q, title: e.target.value }))}
            className="p-2 border rounded flex-1"
          />
          <input
            type="date"
            name="due_date"
            value={quick.due_date}
            onChange={e => setQuick(q => ({ ...q, due_date: e.target.value }))}
            className="p-2 border rounded"
          />
          <button
            onClick={handleQuickAdd}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-1 hover:bg-blue-700"
          >
            <FiPlusCircle /> Add
          </button>
        </div>
      </section>

      {/* Today's Tasks */}
      <section>
        <h3 className="text-xl font-semibold mb-4">Today's Tasks</h3>
        {Object.entries(groupedByType).length > 0 ? (
          Object.entries(groupedByType).map(([type, items]) => (
            <div key={type} className="mb-6">
              <h4 className="text-lg font-medium mb-2">{type}</h4>
              <ul className="space-y-2">
                {items.map(task => (
                  <li
                    key={task.id}
                    className={`
                      flex items-center justify-between p-4 rounded transition
                      ${task.is_done
                        ? 'bg-gray-50 opacity-50 line-through text-gray-400'
                        : 'bg-white hover:shadow-md'}
                    `}
                  >
                    {/* ✔️ Toggle done */}
                    <input
                      type="checkbox"
                      checked={!!task.is_done}
                      onChange={() => onToggleComplete(task.id)}
                      className="h-5 w-5 text-green-600 mr-4"
                      aria-label={task.is_done ? 'Mark incomplete' : 'Mark complete'}
                    />

                    {/* Task info */}
                    <div
                      onClick={() => onSelectTask(task)}
                      className="flex-1 cursor-pointer"
                    >
                      <h5 className="font-semibold">{task.title}</h5>
                      {task.due_date && (
                        <small className="text-gray-500">
                          {new Date(task.due_date).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </small>
                      )}
                    </div>

                    {/* Priority badge */}
                    <span
                      className={`px-2 py-1 rounded-full text-sm font-medium ${
                        URGENCY_STYLES[task.priority]
                      }`}
                    >
                      {task.priority}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No tasks scheduled for today.</p>
        )}
      </section>

      {/* Next Event */}
      {nextEvent && (
        <section className="bg-white p-4 rounded shadow">
          <strong>Next Event:</strong> {nextEvent.title} on{' '}
          {new Date(nextEvent.due_date).toLocaleString([], {
            weekday: 'short',
            month:   'short',
            day:     'numeric',
            hour:    '2-digit',
            minute:  '2-digit',
          })}
        </section>
      )}

      {/* Today's Task Progress ← UPDATED SECTION */}
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Today's Progress</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 h-4 rounded overflow-hidden">
            <div
              className="bg-green-500 h-full transition-width"
              style={{ width: `${todayProgress.pct}%` }}
            />
          </div>
          <span>
            {todayProgress.done}/{todayProgress.total} completed
          </span>
        </div>
      </section>

      {/* By Context */}
      <section>
        <h3 className="text-xl font-semibold mb-2">By Context</h3>
        {Object.entries(groupedContext).map(([group, items]) => (
          <div key={group} className="mb-4">
            <h4 className="font-medium">{group}</h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {items.map(t => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onClick={() => onSelectTask(t)}
                  onToggleComplete={onToggleComplete}
                />
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Focus Suggestion */}
      {randomFocus && (
        <section className="bg-yellow-50 p-4 rounded shadow">
          <h3 className="text-lg font-semibold">Focus Suggestion</h3>
          <p>You might want to work on: <strong>{randomFocus.title}</strong></p>
        </section>
      )}

      {/* Motivational Quote */}
      <footer className="mt-8 text-center italic text-gray-600">{quote}</footer>
    </div>
  );
}

HomePage.propTypes = {
  tasks:            PropTypes.array.isRequired,
  onAddTask:        PropTypes.func.isRequired,
  onSelectTask:     PropTypes.func.isRequired,
  onDeleteTask:     PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
};
