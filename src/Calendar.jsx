import React, { useState, useEffect } from 'react';
import { Button, Container, Spinner, Alert } from 'react-bootstrap';
import CalendarComponent from './components/CalendarComponents'; 
import AvailabilityModal from './components/AvailabilityModal'; 
import { getUserTasks, getUserAvailability, batchAddEvents, getUserEvents } from './firestore';
import { generateSmartSchedule } from './aiService';

const Calendar = () => {
  const [showModal, setShowModal] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState(null); 

  const handleModalClose = () => setShowModal(false);
  const handleModalShow = () => setShowModal(true);

  const handleAvailabilityAdded = () => { 
    handleModalClose(); 
    setReloadTrigger(prev => prev + 1); 
  };

  const handleGenerateSchedule = async () => {
    setIsGenerating(true);
    setMessage(null);

    try {
      const tasks = await getUserTasks();
      const availability = await getUserAvailability();
      const existingEvents = await getUserEvents();

      const tasksToSchedule = tasks.filter(task => {
        const isCompleted = task.completed;
        const isAlreadyScheduled = existingEvents.some(event => event.title === task.text);
        return !isCompleted && !isAlreadyScheduled;
      });

      if (tasksToSchedule.length === 0) {
        setMessage({ type: 'info', text: 'All active tasks are already scheduled!' });
        setIsGenerating(false);
        return;
      }

      const suggestedSchedule = await generateSmartSchedule(tasksToSchedule, availability, existingEvents);

      if (suggestedSchedule && suggestedSchedule.length > 0) {
        await batchAddEvents(suggestedSchedule);
        setReloadTrigger(prev => prev + 1); 
        setMessage({ type: 'success', text: `Scheduled ${suggestedSchedule.length} new tasks!` });
      } else {
        setMessage({ type: 'warning', text: 'AI could not fit tasks into your schedule.' });
      }

    } catch (error) {
      console.error(error);
      setMessage({ type: 'danger', text: 'Failed to generate schedule. Check Console.' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Container>
      {message && (
        <Alert variant={message.type} onClose={() => setMessage(null)} dismissible className="mt-3">
          {message.text}
        </Alert>
      )}

      <div className="d-flex justify-content-between mb-3 mt-3 align-items-center">
        <Button 
          variant="success" 
          onClick={handleGenerateSchedule}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
              {' '}Generating...
            </>
          ) : (
            '✨ AI Auto-Schedule'
          )}
        </Button>

        <Button variant="primary" onClick={handleModalShow}>
          Set Busy Time
        </Button>
      </div>

      <CalendarComponent reloadTrigger={reloadTrigger} /> 

      <AvailabilityModal 
        show={showModal} 
        handleClose={handleModalClose} 
        onAvailabilityAdded={handleAvailabilityAdded} 
      />
    </Container>
  ); 
};

export default Calendar;