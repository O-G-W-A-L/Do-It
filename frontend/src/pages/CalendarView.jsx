import React from 'react';
import Calendar from '../components/Calendar';
import { useTasks } from '../hooks/useTasks';

export default function CalendarView() {
  const { tasks, isLoading, error } = useTasks();

  if (isLoading) return <div>Loading calendar…</div>;
  if (error)      return <div>Failed to load calendar.</div>;

  // Transform tasks into calendar events
  const events = tasks.map(t => ({
    id: t.id,
    title: t.title,
    start: t.due_date,
    end: t.due_date
  }));

  return (
    <div className="h-full p-6 bg-white">
      <h2 className="text-2xl font-semibold mb-4">Calendar</h2>
      <Calendar events={events} />
    </div>
  );
}

