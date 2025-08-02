'use client';

import { useState } from 'react';
import { 
  getEventsForRange,
  getCurrentSemester,
  getKeyAcademicDates,
  type CalendarEvent 
} from '@/lib/actions/academic-calendar.actions';
import { 
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiInfo,
  FiClock,
  FiMapPin,

  FiList,
  FiGrid
} from 'react-icons/fi';
import {  FaUniversity } from 'react-icons/fa';
import { format, addDays, addMonths, isSameMonth, isSameDay } from 'date-fns';
import Modal from '@/components/ui/modal'

export default function AcademicCalendarManager({ 
  initialEvents,
  initialSemester,
  initialKeyDates,
}: { 
  initialEvents: CalendarEvent[];
  initialSemester: Awaited<ReturnType<typeof getCurrentSemester>>;
  initialKeyDates: Awaited<ReturnType<typeof getKeyAcademicDates>>;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<'month' | 'list'>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [semester, setSemester] = useState(initialSemester);
  const [keyDates, setKeyDates] = useState(initialKeyDates);
  const [isLoading, setIsLoading] = useState(false);

  // Navigation functions
  const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Get days for the current month view
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDate = new Date(monthStart);
  const endDate = new Date(monthEnd);

  // Filter events for the current month
  const monthEvents = events.filter(event => 
    isSameMonth(event.start, currentDate) || 
    isSameMonth(event.end, currentDate)
  );

  // Group events by day
  const eventsByDay: Record<string, CalendarEvent[]> = {};
  monthEvents.forEach(event => {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Handle multi-day events
    let currentDay = new Date(eventStart);
    while (currentDay <= eventEnd) {
      const dayKey = format(currentDay, 'yyyy-MM-dd');
      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      eventsByDay[dayKey].push(event);
      currentDay = addDays(currentDay, 1);
    }
  });

  // Generate days for the month view
  const days = [];
  let day = new Date(startDate);
  while (day <= endDate) {
    days.push(new Date(day));
    day = addDays(day, 1);
  }

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  // Refresh data
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const [currentSemester, semesterEvents, importantDates] = await Promise.all([
        getCurrentSemester(),
        getEventsForRange(startDate, endDate),
        getKeyAcademicDates(semester?.id || 0)
      ]);
      
      setSemester(currentSemester);
      setEvents(semesterEvents);
      setKeyDates(importantDates);
    } catch (error) {
      console.error('Error refreshing calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
          <FaUniversity className="h-8 w-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Academic Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshData}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('month')}
            className={`p-2 rounded-md ${activeView === 'month' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <FiGrid className="h-5 w-5" />
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`p-2 rounded-md ${activeView === 'list' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}
          >
            <FiList className="h-5 w-5" />
          </button>
        </div>
        
        {/* Month Navigation */}
        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Today
          </button>
        </div>
      </div>

      {/* Current Semester Info */}
      {semester && (
        <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
          <div className="flex items-center gap-2 text-indigo-800">
            <FiCalendar className="h-5 w-5" />
            <h3 className="font-medium">Current Semester: {semester.name}</h3>
          </div>
          <p className="mt-1 text-sm text-indigo-700">
            {format(new Date(semester.startDate), 'MMM d, yyyy')} - {format(new Date(semester.endDate), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      {/* Month View */}
      {activeView === 'month' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 text-center text-xs font-medium text-gray-500 bg-gray-50">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-gray-200">
            {days.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDay[dayKey] || [];
              const isToday = isSameDay(day, new Date());
              
              return (
                <div 
                  key={dayKey}
                  className={`min-h-24 p-1 bg-white ${isToday ? 'border-2 border-indigo-500' : ''}`}
                >
                  <div className={`text-right p-1 text-sm ${isToday ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={`${event.id}-${dayKey}`}
                        onClick={() => handleEventClick(event)}
                        className={`p-1 text-xs rounded cursor-pointer truncate ${
                          event.type === 'course' ? 'bg-blue-100 text-blue-800' :
                          event.type === 'exam' ? 'bg-red-100 text-red-800' :
                          event.type === 'holiday' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* List View */}
      {activeView === 'list' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthEvents.length > 0 ? (
                monthEvents.map(event => (
                  <tr 
                    key={event.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(event.start, 'MMM d')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {format(event.start, 'h:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {event.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        event.type === 'course' ? 'bg-blue-100 text-blue-800' :
                        event.type === 'exam' ? 'bg-red-100 text-red-800' :
                        event.type === 'holiday' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.courseCode || event.location || '-'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No events scheduled for this month
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Key Dates Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Academic Dates</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyDates.length > 0 ? (
            keyDates.map(event => (
<div 
  key={event.id}
  // Transform the event object to match the CalendarEvent type before passing it
  onClick={() => handleEventClick({
    id: event.id,
    title: event.title,
    start: event.startDate, // Renamed from startDate
    end: event.endDate,     // Renamed from endDate
    type: event.eventType,  // Renamed from eventType
    // Add any other properties needed by CalendarEvent here
    description: event.description,
    location: event.location,
    isRecurring: event.isRecurring,
    recurringPattern: event.recurringPattern,
  })}
  className="p-4 border rounded-lg hover:shadow-md cursor-pointer"
>
  <div className="flex items-center gap-2">
    <div className={`p-2 rounded-full ${
      event.eventType === 'exam' ? 'bg-red-100 text-red-600' :
      event.eventType === 'holiday' ? 'bg-green-100 text-green-600' :
      'bg-blue-100 text-blue-600'
    }`}>
      <FiCalendar className="h-5 w-5" />
    </div>
    <h4 className="font-medium">{event.title}</h4>
  </div>
  <div className="mt-2 text-sm text-gray-600">
    <div className="flex items-center gap-2">
      <FiClock className="h-4 w-4" />
      {format(new Date(event.startDate), 'MMM d, yyyy h:mm a')}
    </div>
    {event.location && (
      <div className="flex items-center gap-2 mt-1">
        <FiMapPin className="h-4 w-4" />
        {event.location}
      </div>
    )}
  </div>
</div>
            ))
          ) : (
            <div className="col-span-3 p-8 text-center bg-gray-50 rounded-lg">
              <FiCalendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No key dates scheduled</h3>
              <p className="mt-1 text-sm text-gray-500">
                Important academic dates will appear here when available.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title || ''}
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                selectedEvent.type === 'course' ? 'bg-blue-100 text-blue-800' :
                selectedEvent.type === 'exam' ? 'bg-red-100 text-red-800' :
                selectedEvent.type === 'holiday' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {selectedEvent.type}
              </span>
              {selectedEvent.courseCode && (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {selectedEvent.courseCode}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <FiClock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Start</p>
                  <p className="text-sm">{format(selectedEvent.start, 'PPPp')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FiClock className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">End</p>
                  <p className="text-sm">{format(selectedEvent.end, 'PPPp')}</p>
                </div>
              </div>
            </div>

            {selectedEvent.location && (
              <div className="flex items-start gap-2">
                <FiMapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm">{selectedEvent.location}</p>
                </div>
              </div>
            )}

            {selectedEvent.description && (
              <div className="flex items-start gap-2">
                <FiInfo className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm">{selectedEvent.description}</p>
                </div>
              </div>
            )}

            {selectedEvent.isRecurring && (
              <div className="flex items-start gap-2">
                <FiCalendar className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Recurring</p>
                  <p className="text-sm">This is a recurring event</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}