import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin   from '@fullcalendar/daygrid';
import timeGridPlugin  from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { RoutineTypes } from './RoutineTracker';

// Map routine types to actual background‐color hex codes
const TYPE_BG_HEX = {
  personal: '#ebf8ff',
  work:     '#f0fff4',
  routine:  '#faf5ff',
  fitness:  '#fff5f5',
};

export default function CalendarView({
  tasks,
  routines = [],
  onEventDrop,
  onDateCreate,
}) {
  // Track the current visible date range
  const [viewRange, setViewRange] = useState({ startStr: '', endStr: '' });

  // Build events only when tasks, routines, or viewRange change
  const events = useMemo(() => {
    const todayDate = new Date().toISOString().split('T')[0];

    // 1) One-off tasks
    const taskEvents = tasks.map(t => ({
      id:    String(t.id),
      title: t.title,
      start: t.due_date,
      color: t.priority === 'Must Do' ? '#e53e3e' : '#3182ce',
    }));

    // 2) Label each routine once on "today"
    const routineLabels = routines.map(r => ({
      id:      `routine-label-${r.id}`,
      title:   r.title,
      start:   todayDate,
      allDay:  true,
      color:   '#2d3748', // dark text for contrast
    }));

    // 3) Background span across the visible range
    const routineBackgrounds = (viewRange.startStr && viewRange.endStr)
      ? routines.map(r => ({
          id:           `routine-bg-${r.id}`,
          start:        viewRange.startStr,
          end:          viewRange.endStr,
          rendering:    'background',
          allDay:       true,
          backgroundColor: TYPE_BG_HEX[r.type.toLowerCase()] || '#edf2f7',
        }))
      : [];

    return [...taskEvents, ...routineLabels, ...routineBackgrounds];
  }, [tasks, routines, viewRange.startStr, viewRange.endStr]);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left:  'prev,next today',
        center:'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={events}
      editable
      // Update viewRange when calendar navigates
      datesSet={dateInfo => {
        setViewRange({
          startStr: dateInfo.startStr,
          endStr:   dateInfo.endStr,
        });
      }}
      dateClick={info => {
        const title = prompt('New task title:');
        if (title) onDateCreate({ title, due_date: info.dateStr });
      }}
      eventDrop={info => {
        // Only drop task events, not routine backgrounds/labels
        if (!info.event.id.startsWith('routine-')) {
          onEventDrop(info.event.id, { due_date: info.event.startStr });
        }
      }}
      height="auto"
    />
  );
}
