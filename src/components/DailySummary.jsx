import React, { useState, useEffect } from 'react';
import { Container, Card, Row, Col, Badge, ListGroup, Form, Button } from 'react-bootstrap';
import { getUserTasks, getUserRewards } from '../firestore';
import { subscribeToUserTasks, subscribeToUserRewards } from '../firestore';

const DailySummary = () => {
  const [tasks, setTasks] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsubscribeTasks = subscribeToUserTasks((newTasks) => {
        setTasks(newTasks);
        setLoading(false);
    });

    const unsubscribeRewards = subscribeToUserRewards((newRewards) => {
      setRewards(newRewards);
      setLoading(false);
    });

    // Clean up function: Unsubscribe when the component unmounts
    return () => {
      unsubscribeTasks();
      unsubscribeRewards();
    };
  }, []);
  
/*
  const loadData = async () => {
    setLoading(true);
    const allTasks = await getUserTasks();
    const allRewards = await getUserRewards();
    setTasks(allTasks);
    setRewards(allRewards);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
*/

  const handleRefresh = () => {
    console.log("Data is real-time");
  };

  const filterTasksByDate = (tasksList, date) => {
    const selected = new Date(date);
    const completedOnDate = [];
    const createdOnDate = [];
    
    tasksList.forEach((task) => {
      // Check if completed on this date
      if (task.completed && task.completedAt) {
        const completedDate = typeof task.completedAt.toDate === "function" 
          ? task.completedAt.toDate() 
          : new Date(task.completedAt.seconds * 1000);
        
        if (
          completedDate.getFullYear() === selected.getFullYear() &&
          completedDate.getMonth() === selected.getMonth() &&
          completedDate.getDate() === selected.getDate()
        ) {
          completedOnDate.push(task);
          return;
        }
      }
      
      // Check if created on this date but not completed
      if (task.createdAt) {
        const createdDate = typeof task.createdAt.toDate === "function" 
          ? task.createdAt.toDate() 
          : new Date(task.createdAt.seconds * 1000);
        
        if (
          createdDate.getFullYear() === selected.getFullYear() &&
          createdDate.getMonth() === selected.getMonth() &&
          createdDate.getDate() === selected.getDate()
        ) {
          createdOnDate.push(task);
        }
      }
    });
    
    // Return all tasks that were either completed or created on this date
    return [...new Set([...completedOnDate, ...createdOnDate])];
  };

  const filterRewardsByDate = (rewardsList, date) => {
    const selected = new Date(date);
    return rewardsList.filter((reward) => {
      if (!reward.createdAt) return false;
      const rewardDate = typeof reward.createdAt.toDate === "function"
        ? reward.createdAt.toDate()
        : new Date(reward.createdAt.seconds * 1000);
      
      return (
        rewardDate.getFullYear() === selected.getFullYear() &&
        rewardDate.getMonth() === selected.getMonth() &&
        rewardDate.getDate() === selected.getDate()
      );
    });
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: "success",
      2: "info",
      3: "warning",
      4: "danger",
      5: "dark"
    };
    return colors[difficulty] || "secondary";
  };

  const getCostColor = (cost) => {
    switch (cost) {
      case 'Small': return 'success';
      case 'Medium': return 'warning';
      case 'Large': return 'danger';
      default: return 'secondary';
    }
  };

  const getCostPoints = (cost) => {
    switch (cost) {
      case 'Small': return 3;
      case 'Medium': return 5;
      case 'Large': return 10;
      default: return 0;
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading summary...</div>;
  }

  const dayTasks = filterTasksByDate(tasks, selectedDate);
  const dayRewards = filterRewardsByDate(rewards, selectedDate);
  
  // Filter completed and missed tasks based on COMPLETION date
  const completedTasks = dayTasks.filter(task => {
    if (!task.completed || !task.completedAt) return false;
    
    const selected = new Date(selectedDate);
    const completedDate = typeof task.completedAt.toDate === "function" 
      ? task.completedAt.toDate() 
      : new Date(task.completedAt.seconds * 1000);
    
    return (
      completedDate.getFullYear() === selected.getFullYear() &&
      completedDate.getMonth() === selected.getMonth() &&
      completedDate.getDate() === selected.getDate()
    );
  });
  
  const missedTasks = dayTasks.filter(task => !task.completed);
  
  const totalPointsEarned = completedTasks.reduce((sum, task) => sum + (task.difficulty || 3), 0);
  const totalPointsSpent = dayRewards.reduce((sum, reward) => sum + getCostPoints(reward.cost), 0);
  const netPoints = totalPointsEarned - totalPointsSpent;

  return (
    <Container className="my-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Daily Summary</h2>
        <div className="d-flex gap-2">
          <Button 
            variant="outline-primary" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </Button>
          <Form.Control
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ maxWidth: '200px' }}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center p-3" style={{ backgroundColor: '#d4edda' }}>
            <h5>Completed Tasks</h5>
            <h2>{completedTasks.length}</h2>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ backgroundColor: '#f8d7da' }}>
            <h5>Missed Tasks</h5>
            <h2>{missedTasks.length}</h2>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ backgroundColor: '#d1ecf1' }}>
            <h5>Points Earned</h5>
            <h2 className="text-success">+{totalPointsEarned}</h2>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center p-3" style={{ backgroundColor: '#fff3cd' }}>
            <h5>Net Points</h5>
            <h2 className={netPoints >= 0 ? 'text-success' : 'text-danger'}>
              {netPoints >= 0 ? '+' : ''}{netPoints}
            </h2>
          </Card>
        </Col>
      </Row>

      {/* Detailed Lists */}
      <Row>
        <Col md={6}>
          <Card className="mb-3" style={{ backgroundColor: '#e7f5ff' }}>
            <Card.Body>
              <h4 className="mb-3">✅ Completed Tasks ({completedTasks.length})</h4>
              {completedTasks.length === 0 ? (
                <p className="text-muted">No tasks completed on this day.</p>
              ) : (
                <ListGroup>
                  {completedTasks.map((task) => (
                    <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Badge 
                          bg={getDifficultyColor(task.difficulty)} 
                          className="me-2"
                          style={{ minWidth: "25px" }}
                        >
                          {task.difficulty}
                        </Badge>
                        <span>{task.text}</span>
                      </div>
                      <Badge bg="success">+{task.difficulty} pts</Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          <Card style={{ backgroundColor: '#e7f5ff' }}>
            <Card.Body>
              <h4 className="mb-3">❌ Missed Tasks ({missedTasks.length})</h4>
              {missedTasks.length === 0 ? (
                <p className="text-muted">No missed tasks - Great job!</p>
              ) : (
                <ListGroup>
                  {missedTasks.map((task) => (
                    <ListGroup.Item key={task.id} className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center">
                        <Badge 
                          bg={getDifficultyColor(task.difficulty)} 
                          className="me-2"
                          style={{ minWidth: "25px" }}
                        >
                          {task.difficulty}
                        </Badge>
                        <span style={{ opacity: 0.7 }}>{task.text}</span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card style={{ backgroundColor: '#e7f5ff' }}>
            <Card.Body>
              <h4 className="mb-3">🎁 Rewards Added ({dayRewards.length})</h4>
              {dayRewards.length === 0 ? (
                <p className="text-muted">No rewards added on this day.</p>
              ) : (
                <ListGroup>
                  {dayRewards.map((reward) => (
                    <ListGroup.Item key={reward.id} className="d-flex justify-content-between align-items-center">
                      <span>{reward.name}</span>
                      <div>
                        <Badge bg={getCostColor(reward.cost)} className="me-2">
                          {reward.cost}
                        </Badge>
                        <Badge bg="warning">{getCostPoints(reward.cost)} pts</Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              
              {totalPointsSpent > 0 && (
                <div className="mt-3 p-3 bg-light rounded">
                  <strong>Total Points Spent: </strong>
                  <Badge bg="danger" className="ms-2">-{totalPointsSpent} pts</Badge>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Daily Stats */}
          <Card className="mt-3" style={{ backgroundColor: '#fff3cd' }}>
            <Card.Body>
              <h5>📊 Daily Statistics</h5>
              <hr />
              <div className="d-flex justify-content-between mb-2">
                <span>Total Tasks:</span>
                <strong>{dayTasks.length}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Completion Rate:</span>
                <strong>
                  {dayTasks.length === 0 
                    ? '0%' 
                    : `${Math.round((completedTasks.length / dayTasks.length) * 100)}%`
                  }
                </strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Points Earned:</span>
                <strong className="text-success">+{totalPointsEarned}</strong>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Points Spent:</span>
                <strong className="text-danger">-{totalPointsSpent}</strong>
              </div>
              <hr />
              <div className="d-flex justify-content-between">
                <span><strong>Net Points:</strong></span>
                <strong className={netPoints >= 0 ? 'text-success' : 'text-danger'}>
                  {netPoints >= 0 ? '+' : ''}{netPoints}
                </strong>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DailySummary;