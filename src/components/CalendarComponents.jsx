import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './Calendar.css'; 
import { addEvent, getUserEvents, deleteEvent, getUserAvailability } from '/src/firestore.js';

const CalendarComponent = ({ readOnly = false, reloadTrigger }) => {
    const [events, setEvents] = useState([]);
    const [availability, setAvailability] = useState([]);

    useEffect(() => {
        loadData();
    }, [reloadTrigger]);

    const loadData = async () => {
        const fetchedEvents = await getUserEvents();
        setEvents(fetchedEvents);
        
        const fetchedAvailability = await getUserAvailability();
        setAvailability(fetchedAvailability);
    };

    const handleDateClick = async (info) => {
        if (readOnly) return;
        const title = prompt('Enter task: ' + info.dateStr);
            if (title) {
                const eventId = await addEvent({ title, date: info.dateStr });                
                setEvents([...events, {id: eventId, title, date: info.dateStr}]);
            }
        }

    const handleEventClick = async (info) => {
        if (readOnly) return;
        if (info.event.display === 'background') {
            info.jsEvent.preventDefault(); // Отменяем клик
            return;
            
        }

        if(window.confirm(`Delete event '${info.event.title}'?`)) {
            await deleteEvent(info.event.id);
            info.event.remove();
        }
    }
    
    const mapAvailabilityToFCEvents = (availabilityData) => {
        const dayMap = {
            'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
            'Thursday': 4, 'Friday': 5, 'Saturday': 6
        };

        return availabilityData.map(slot => ({
            id: `avail_${slot.id}`,
            daysOfWeek: [ dayMap[slot.day] ], 
            startTime: slot.startTime,      
            endTime: slot.endTime,          
            display: 'background',          
            color: '#ef5350'                
        }));
    };

    
    const allCalendarEvents = [
        ...events,
        ...mapAvailabilityToFCEvents(availability)
    ];

    return (
        <div style={{minHeight: '100vh', backgroundColor: '#96C5F7'}}>
            <FullCalendar 
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth" 
                editable={!readOnly} 
                selectable={!readOnly} 
                dateClick={readOnly ? null : handleDateClick} 
                eventClick={readOnly ? null : handleEventClick}
                events={allCalendarEvents} 
                height="100vh" 
                aspectRatio={1.5}
                buttonText={{ today: 'Today'}}
                headerToolbar={{
                    left: 'prev,next today', 
                    center: 'title', 
                    right: 'dayGridMonth,timeGridWeek,timeGridDay' 
                }}
                displayEventEnd={true} 
                eventTimeFormat={{
                    hour: 'numeric',
                    minute: '2-digit',
                    meridiem: 'short',
                    omitZeroMinute: true 
                }}
            />
        </div>
    )
}

export default CalendarComponent;