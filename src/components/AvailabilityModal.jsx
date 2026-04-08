import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { addAvailability } from '../firestore'; 

const AvailabilityModal = ({ show, handleClose, onAvailabilityAdded }) => {
  const [day, setDay] = useState('Monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('11:00');
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    // Валидация
    if (!day || !startTime || !endTime) {
      setError('Please fill out all fields.');
      return;
    }
    if (startTime >= endTime) {
      setError('Start time must be before end time.');
      return;
    }

    try {
      await addAvailability({ day, startTime, endTime });
      onAvailabilityAdded(); 
      
      setDay('Monday');
      setStartTime('09:00');
      setEndTime('11:00');
    } catch (err) {
      setError('Failed to save availability.');
      console.error(err);
    }
  };

  
  const handleModalClose = () => {
    setError('');
    handleClose();
  };

  return (
    <Modal show={show} onHide={handleModalClose}>
      <Modal.Header closeButton>
        <Modal.Title>Block Off Busy Time</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form>
          <Form.Group className="mb-3" controlId="formBusyDay">
            <Form.Label>Day of the Week</Form.Label>
            <Form.Select value={day} onChange={(e) => setDay(e.target.value)}>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="formStartTime">
            <Form.Label>Start Time</Form.Label>
            <Form.Control
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="formEndTime">
            <Form.Label>End Time</Form.Label>
            <Form.Control
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleModalClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save Busy Time
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default AvailabilityModal;