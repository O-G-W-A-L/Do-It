import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCourseContext } from '../contexts/CourseContext';
import { useAuth } from '../contexts/AuthContext';

export default function Calendar() {
  const [events, setEvents] = useState([]);
  const { enrollments, getCourseModules } = useCourseContext();
  const { user } = useAuth();

  useEffect(() => {
    if (enrollments && enrollments.length > 0) {
      generateCalendarEvents();
    }
  }, [enrollments, getCourseModules]);

  const generateCalendarEvents = async () => {
    const calendarEvents = [];

    for (const enrollment of enrollments) {
      if (enrollment.status !== 'active' && enrollment.status !== 'completed') continue;

      // enrollment.course is a number (course ID), enrollment.course_title is the name
      const courseId = enrollment.course;
      const courseTitle = enrollment.course_title;
      
      if (!courseId) continue;

      const enrolledDate = new Date(enrollment.enrolled_at);

      // Add course start event
      calendarEvents.push({
        id: `course-start-${enrollment.id}`,
        title: `Start: ${courseTitle}`,
        start: enrolledDate.toISOString().split('T')[0],
        backgroundColor: '#10B981',
        borderColor: '#10B981',
        textColor: '#ffffff',
        extendedProps: {
          type: 'course_start',
          courseId: courseId,
          enrollmentId: enrollment.id
        }
      });

      // Fetch modules for this course
      try {
        const modules = await getCourseModules(courseId) as any[];
        if (modules && modules.length > 0) {
          modules.forEach((module: any) => {
            // Calculate module due date: enrolled_date + (module.order - 1) weeks
            const moduleDueDate = new Date(enrolledDate);
            moduleDueDate.setDate(moduleDueDate.getDate() + (module.order - 1) * 7);

            calendarEvents.push({
              id: `module-${enrollment.id}-${module.id}`,
              title: `${courseTitle}: ${module.title}`,
              start: moduleDueDate.toISOString().split('T')[0],
              backgroundColor: '#3B82F6',
              borderColor: '#3B82F6',
              textColor: '#ffffff',
              extendedProps: {
                type: 'module_due',
                courseId: courseId,
                moduleId: module.id,
                enrollmentId: enrollment.id
              }
            });
          });
        }
      } catch (error) {
        console.error('Error fetching modules for course:', courseId, error);
      }
    }

    setEvents(calendarEvents);
  };

  const handleEventClick = (info) => {
    const { extendedProps } = info.event;
    // Could navigate to course or module, but for now just log
    console.log('Event clicked:', extendedProps);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">My Calendar</h2>
        <p className="text-gray-600 mb-6">
          View your course schedules and project deadlines. Events are calculated based on your enrollment dates and course structure.
        </p>

        <div className="calendar-container">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay'
            }}
            initialView="dayGridMonth"
            events={events}
            eventClick={handleEventClick}
            height="auto"
            aspectRatio={1.35}
            eventDisplay="block"
            dayMaxEvents={3}
            moreLinkClick="popover"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Course Start</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Module Due</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Course Completion</span>
          </div>
        </div>
      </div>
    </div>
  );
}
