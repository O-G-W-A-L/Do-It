import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView({ tasks, onEventDrop, onDateCreate }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(tasks.map(t => ({
      id: t.id,
      title: t.title,
      start: t.dueDate,
      color: t.priority === 'high' ? '#e53e3e' : '#3182ce',
    })));
  }, [tasks]);

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={events}
      editable
      dateClick={info => {
        const title = prompt('New task title:');
        if (title) onDateCreate({ title, dueDate: info.dateStr });
      }}
      eventDrop={info => {
        onEventDrop(info.event.id, { dueDate: info.event.startStr });
      }}
      height="auto"
    />
  );
}
