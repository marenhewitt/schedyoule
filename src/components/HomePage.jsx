import React from 'react';
import { Container, Row, Col, Card, Stack } from 'react-bootstrap';
import CalendarComponent from './CalendarComponents';
import Pomodoro from '../Pomodoro';
import ToDoList, { TaskListCompact } from '../ToDoList';
import Calendar from '../Calendar';
import RewardsCompact from './RewardsCompact';


const HomePage = () => {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#96C5F7'}}>
            <Row className="g-2" style={{ minHeight: '80vh'}}>
                <Col md={8}>
                <div style={{flexGrow: 1, overflowY: 'auto'}}>
                    {/* <Card className="p-2 h-100 border-0 d-flex flex-column" style={{ boxShadow: 'none' }}>
                        <div className="flex-grow-1" style={{ overflowY: 'auto'}}> */}
                        <CalendarComponent readOnly={true}/>
                        </div>
                    {/* </Card> */}
                </Col>

                <Col md={4}>
                    <Stack gap={2}>

                        <Card className="p-2 border-0" style={{ boxShadow: 'none' }}>
                            <div style={{overflowY: 'auto'}}>
                            <h4 className="mb-0">To-Do List</h4>
                                <TaskListCompact readOnly={true}/>
                            </div>
                        </Card>

                        <Card className="p-2 border-0" style={{ boxShadow: 'none' }}>
                            <div style={{overflowY: 'auto'}}>
                                <RewardsCompact readOnly={true}/>
                            </div>
                        </Card>

                        <Card className="p-2 border-0 text-center" style={{boxShadow: 'none' }}>
                            <h4 className="text-muted mb-0">Habit Tracker (Coming Soon)</h4>
                        </Card>
                    </Stack>
                </Col> 
            </Row>
        </div>               
    );
};

export default HomePage;