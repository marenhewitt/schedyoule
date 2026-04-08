import React, { useEffect, useState } from "react";
import { 
    Card, 
    ProgressBar, 
    ListGroup, 
    Badge, 
    Container, 
    Row, 
    Col, 
    Form, 
    Button, 
    Spinner,
    Stack
} from "react-bootstrap";
import { subscribeToUserTasks, subscribeToUserRewards } from "../firestore.js"; 

const createLocalDate = (dateString) => {
    const parts = dateString.split('-');
    return new Date(parts[0], parts[1]-1, parts[2]);
}

const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const SummaryDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(true);
    const todayString = getLocalDateString(new Date());
    const [selectedDate, setSelectedDate] = useState(todayString);
    const today = createLocalDate(todayString);

    useEffect(() => {
        const unsubscribeTasks = subscribeToUserTasks((newTasks) => {
            setTasks(newTasks);
            setLoading(false);
        });

        const unsubscribeRewards = subscribeToUserRewards((newRewards) => {
            setRewards(newRewards);
            setLoading(false);
        });

        return() => {
            unsubscribeTasks();
            unsubscribeRewards();
        };
    }, []);

    

    // Helper to check if a Firestore Timestamp object is for a specific date
    const isSameDay = (timestamp, dateToCompare) => {
        if (!timestamp) return false;

        const tsDate = typeof timestamp.toDate === "function" 
            ? timestamp.toDate() 
            : new Date(timestamp.seconds * 1000); // Robust date conversion

        return (
            tsDate.getFullYear() === dateToCompare.getFullYear() &&
            tsDate.getMonth() === dateToCompare.getMonth() &&
            tsDate.getDate() === dateToCompare.getDate()
        );
    };

    // ===== DATA LOADING (One-time read from Firestore) =====
/*   
    const loadData = async () => {
        setLoading(true);
        const allTasks = await getUserTasks(); //
        const allRewards = await getUserRewards();
        setTasks(allTasks);
        setRewards(allRewards);
        setLoading(false);
        setRefreshing(false);
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadData();
    };
*/
    const getDifficultyColor = (difficulty) => {
    const colors = {
        1: "success",
        2: "info",
        3: "warning",
        4: "danger",
        5: "dark"
    }
    return colors[difficulty] || "secondary";
    };

    const getCostPoints = (cost) => {
        switch (cost) {
            case 'Small': return 3;
            case 'Medium': return 5;
            case 'Large': return 10;
            default: return 0;
        }
    };
    
    const getCostColor = (cost) => {
        switch (cost) {
            case 'Small': return 'success';
            case 'Medium': return 'warning';
            case 'Large': return 'danger';
            default: return 'secondary';
        }
    };

    // Filter tasks based on creation date or completion date for the Daily Summary section
    const filterTasksByDate = (tasksList, date) => {
        const selected = createLocalDate(date);
        const relevantTasks = tasksList.filter((task) => {
            let isRelevant = false;

            // 1. Check if completed on this date
            if (task.completed && task.completedAt && isSameDay(task.completedAt, selected)) {
                isRelevant = true;
            }
            // 2. Check if created on this date
            else if (task.createdAt && isSameDay(task.createdAt, selected)) {
                isRelevant = true;
            }
            return isRelevant;
        });

        // Use Set to ensure unique tasks, although the filter logic should prevent duplicates
        return [...new Set(relevantTasks)];
    };

    const filterRewardsByDate = (rewardsList, date) => {
        const selected = createLocalDate(date);
        return rewardsList.filter((reward) => reward.createdAt && isSameDay(reward.createdAt, selected));
    };

    // --- ProgressDashboard.jsx logic for Weekly Overview ---
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        return createLocalDate(d.toISOString().split('T')[0]);
    });

    const tasksPerDay = weekDays.map((day) => {
        const dayTasks = tasks.filter((task) => task.createdAt && isSameDay(task.createdAt, day));
        const completedTasks = dayTasks.filter(task => task.completed && task.completedAt && isSameDay(task.completedAt, day)).length;
        return { total: dayTasks.length, completed: completedTasks, date: day };
    });

    const weeklyTotal = tasksPerDay.reduce((sum, d) => sum + d.total, 0);
    const weeklyCompleted = tasksPerDay.reduce((sum, d) => sum + d.completed, 0);
    const weeklyCompletionRate = weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);
    const overallProductivityScore = weeklyCompletionRate;

    // --- Daily Dashboard (Today's Progress) Calculations ---
    const todayTasks = tasks.filter((task) => task.createdAt && isSameDay(task.createdAt, today)); // Filter tasks created today
    const totalToday = todayTasks.length;
    const completedToday = todayTasks.filter(task => task.completed && task.completedAt && isSameDay(task.completedAt, today)).length;
    const tasksLeftToday = todayTasks.filter(task => !task.completed).length;
    const progressToday = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
    const nextTaskToday = todayTasks.find(task => !task.completed);

    if (loading) {
        return <div className="text-center mt-5"><Spinner animation="border" /> Loading Dashboard...</div>;
    }

    // Daily Summary Data based on selectedDate
    const dayTasks = filterTasksByDate(tasks, selectedDate);
    const dayRewards = filterRewardsByDate(rewards, selectedDate);
    
    const selectedDateObj = createLocalDate(selectedDate);

    // Completed tasks for the selected day (must have been completed on this day)
    const completedTasks = dayTasks.filter(task => 
        task.completed && task.completedAt && isSameDay(task.completedAt, selectedDateObj)
    );
    
    // Missed tasks are tasks relevant to the day (created on it) but not completed
    const missedTasks = dayTasks.filter(task => !task.completed); 
    
    const totalPointsEarned = completedTasks.reduce((sum, task) => sum + (task.difficulty || 3), 0);
    const totalPointsSpent = dayRewards.reduce((sum, reward) => sum + getCostPoints(reward.cost), 0);
    const netPoints = totalPointsEarned - totalPointsSpent;

    return (
        <Container className="my-4">
            <h1 className="mb-4">Progress Summary Dashboard</h1>

            {/* --- ProgressDashboard: Weekly Overview and Controls --- */}
            <Card className="p-4 mb-4" style={{ backgroundColor: "#f0f8ff" }}>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Overall Productivity</h3>
                </div>

                <h4 className="mt-2">Weekly Productivity Overview</h4>
                <div className="mb-4">
                    <p><strong>Weekly Completion Rate:</strong> {weeklyCompletionRate}%</p>
                    <p><strong>Overall Productivity Score:</strong> {overallProductivityScore}%</p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", height: "150px" }}>
                    {tasksPerDay.map((day, index) => {
                        const barHeight = day.total === 0 ? 0 : Math.round((day.completed / day.total) * 100);
                        return (
                            <div key={index} style={{ textAlign: "center", width: "12%" }}>
                                <Stack className="h-100 align-items-center">
                                    <div style={{
                                        height: "100px", width: "100%", backgroundColor: "#e9ecef", position: "relative", borderRadius: "4px" }}>
                                        <div style={{position: "absolute", bottom: 0, width: "100%", height: `${barHeight}%`, backgroundColor: "#0d6efd", borderRadius: "4px"}}></div>
                                    </div>
                                    <small className="mt-2">{day.date.toLocaleDateString('en-US', { weekday: 'short' })}</small>
                                    <Badge bg="secondary">{day.completed}/{day.total}</Badge>
                                </Stack>
                            </div>
                        )
                    })}
                </div>
            </Card>

            <Row className="g-4">
                {/* --- Today's Progress Column --- */}
                <Col md={5}>
                    <Card className="p-4 h-100" style={{ backgroundColor: "#e7f5ff" }}>
                        <h3>📅 Today's Progress</h3>
                        <p className="lead mt-3"> {completedToday} of {totalToday} tasks completed</p>
                        <ProgressBar now ={progressToday} label={`${progressToday}%`}/>

                        <div style={{ marginTop: "15px", lineHeight: "1.4"}}>
                            {nextTaskToday && (
                                <p style={{ margin: 0}}><strong>Next Task:</strong> {nextTaskToday.text}</p>
                            )}
                            <p style={{ margin: 0}}><strong>Tasks Left:</strong> {tasksLeftToday}</p>
                        </div>

                        <h4 className="mt-4">Today's Tasks (Created Today)</h4>
                        {todayTasks.length === 0 ? (
                            <p className="text-muted">No tasks added today...</p>
                        ) : (
                            <ListGroup>
                                {todayTasks.map((task) => (
                                    <ListGroup.Item key={task.id} className="d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center">
                                            <Badge bg={getDifficultyColor(task.difficulty)}
                                                className="me-2"
                                                style={{minWidth: "35px"}}>
                                                    {task.difficulty}
                                            </Badge>
                                            <span style={{textDecoration:task.completed ? "line-through" : "none",
                                                opacity: task.completed ? 0.6 :1 ,}}>
                                                    {task.text}
                                            </span>
                                        </div>
                                        {task.completed ? (
                                            <Badge bg="success">Completed</Badge> 
                                        ) : (
                                            <Badge bg="secondary">Pending</Badge>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup> 
                        )}
                    </Card>
                </Col>

                {/* --- DailySummary: Detailed Breakdown Column --- */}
                <Col md={7}>
                    <Card className="p-4 h-100" style={{ backgroundColor: '#fffbe7' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h3>🔍 Daily Summary</h3>
                            <Form.Control
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{ maxWidth: '180px' }}
                            />
                        </div>

                        {/* Summary Cards */}
                        <Row className="mb-4 g-2">
                            <Col xs={6}>
                                <Card className="text-center p-2 border-0" style={{ backgroundColor: '#d4edda' }}>
                                    <h6>Completed Tasks</h6>
                                    <h4>{completedTasks.length}</h4>
                                </Card>
                            </Col>
                            <Col xs={6}>
                                <Card className="text-center p-2 border-0" style={{ backgroundColor: '#f8d7da' }}>
                                    <h6>Missed Tasks</h6>
                                    <h4>{missedTasks.length}</h4>
                                </Card>
                            </Col>
                            <Col xs={6}>
                                <Card className="text-center p-2 border-0" style={{ backgroundColor: '#d1ecf1' }}>
                                    <h6>Points Earned</h6>
                                    <h4 className="text-success">+{totalPointsEarned}</h4>
                                </Card>
                            </Col>
                            <Col xs={6}>
                                <Card className="text-center p-2 border-0" style={{ backgroundColor: '#fff3cd' }}>
                                    <h6>Net Points</h6>
                                    <h4 className={netPoints >= 0 ? 'text-success' : 'text-danger'}>
                                        {netPoints >= 0 ? '+' : ''}{netPoints}
                                    </h4>
                                </Card>
                            </Col>
                        </Row>

                        <h5 className="mb-3">✅ Completed Tasks ({completedTasks.length})</h5>
                        {completedTasks.length === 0 ? (
                            <p className="text-muted">No tasks completed on this day.</p>
                        ) : (
                            <ListGroup className="mb-4">
                                {completedTasks.map((task) => (
                                    <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center py-2">
                                        <div className="d-flex align-items-center">
                                            <Badge bg={getDifficultyColor(task.difficulty)} className="me-2">{task.difficulty}</Badge>
                                            <span>{task.text}</span>
                                        </div>
                                        <Badge bg="success">+{task.difficulty} pts</Badge>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}

                        <h5 className="mb-3">🎁 Rewards Added ({dayRewards.length})</h5>
                        {dayRewards.length === 0 ? (
                            <p className="text-muted">No rewards added on this day.</p>
                        ) : (
                            <ListGroup>
                                {dayRewards.map((reward) => (
                                    <ListGroup.Item key={reward.id} className="d-flex justify-content-between align-items-center py-2">
                                        <span>{reward.name}</span>
                                        <div>
                                            <Badge bg={getCostColor(reward.cost)} className="me-2">{reward.cost}</Badge>
                                            <Badge bg="warning">-{getCostPoints(reward.cost)} pts</Badge>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default SummaryDashboard;