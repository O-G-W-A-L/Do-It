import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin   from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarView({ tasks, onEventDrop, onDateCreate }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const allEvents = [];

    tasks.forEach(task => {
      const baseColor = task.priority === 'high' ? '#e53e3e' : '#3182ce';

      // Due date event
      if (task.due_date) {
        allEvents.push({
          id:    `${task.id}-due`,
          title: task.title,
          start: task.due_date,
          color: baseColor,
        });
      }

      // Specific date override
      if (task.specific_due_date) {
        allEvents.push({
          id:    `${task.id}-specific`,
          title: `${task.title} (Specific)`,
          start: task.specific_due_date,
          color: '#805ad5',
        });
      }

      // Reminder
      if (task.reminder_datetime) {
        allEvents.push({
          id:    `${task.id}-reminder`,
          title: `${task.title} (Reminder)`,
          start: task.reminder_datetime,
          color: '#38a169',
        });
      }

      // Alarm as time-only event
      if (task.alarm_time) {
        const today = new Date();
        const [h, m] = task.alarm_time.split(':');
        const alarmDate = new Date(today);
        alarmDate.setHours(+h, +m, 0, 0);

        allEvents.push({
          id:    `${task.id}-alarm`,
          title: `${task.title} (Alarm)`,
          start: alarmDate.toISOString(),
          color: '#f6ad55',
        });
      }
    });

    setEvents(allEvents);
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
        if (title) onDateCreate({ title, due_date: info.dateStr });
      }}
      eventDrop={info => {
        onEventDrop(info.event.id.split('-')[0], { due_date: info.event.startStr });
      }}
      height="auto"
    />
  );
}
