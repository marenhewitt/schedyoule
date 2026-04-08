import React, { useState, useEffect } from 'react';
import { 
  Form, 
  Button, 
  Container, 
  Row, 
  Col, 
  ListGroup, 
  Card, 
  Alert,
  Badge,
  ProgressBar,
  InputGroup
} from 'react-bootstrap';
import { BsPencil, BsTrash, BsSave } from 'react-icons/bs';
import { addReward, getUserRewards, updateReward, deleteReward } from './firestore'; 

const RewardsPage = ({ readOnly = false }) => {
  const [rewardName, setRewardName] = useState('');
  const [rewardCost, setRewardCost] = useState('Small'); 
  const [userPoints, setUserPoints] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRewardId, setEditingRewardId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [editingCost, setEditingCost] = useState("Small");

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    setLoading(true);
    setError('');
    try {
      const userRewards = await getUserRewards();
      setRewards(userRewards);
    } catch (err) {
      setError('Failed to fetch rewards.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;
    setError('');
    if (!rewardName.trim()) {
      setError('Please enter a reward name.');
      return;
    }

    try {
      await addReward({ name: rewardName, cost: rewardCost });
      setRewardName('');
      setRewardCost('Small');
      fetchRewards();
    } catch (err) {
      setError('Failed to add reward.');
      console.error(err);
    }
  };

  const handleStartEdit = (reward) => {
    if (readOnly) return;
    setEditingRewardId(reward.id);
    setEditingName(reward.name);
    setEditingCost(reward.cost);
  };

 const handleSaveEdit = async (id) => {
    if (readOnly) return;
    if (!editingName.trim()) {
      setError('Reward name cannot be empty.');
      return;
    }

    try {
      await updateReward(id, editingName, editingCost);
      setRewards(
        rewards.map((reward) =>
          reward.id === id ? { ...reward, name: editingName, cost: editingCost } : reward
        )
      );
      setEditingRewardId(null);
      setEditingName('');
      setEditingCost('Small');
      setError('');
    } catch (err) {
      setError('Failed to update reward.');
      console.error(err);
    }
  };

  const handleDeleteReward = async (id) => {
    if (readOnly) return;
    try {
      await deleteReward(id);
      setRewards(rewards.filter((reward) => reward.id !== id));
    } catch (err) {
      setError('Failed to delete reward.');
      console.error(err);
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

  const getCostPoints = (cost) => {
    switch (cost) {
      case 'Small': return '3 pts';
      case 'Medium': return '5 pts';
      case 'Large': return '10 pts';
      default: return '';
    }
  };

  return (
    <Container>
      {error && <Alert variant="danger">{error}</Alert>}
      <Row>
        <Col md={6}>
          <Card className="p-4" style={{ backgroundColor: "#e7f5ff" }}>
            <h3 className="text-center mb-4">Add New Reward</h3>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formRewardName">
                <Form.Label>Reward Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., Watch a movie"
                  value={rewardName}
                  onChange={(e) => setRewardName(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formRewardCost">
                <Form.Label>Cost</Form.Label>
                <Form.Select
                  value={rewardCost}
                  onChange={(e) => setRewardCost(e.target.value)}
                >
                  <option value="Small">Small (3 points)</option>
                  <option value="Medium">Medium (5 points)</option>
                  <option value="Large">Large (10 points)</option>
                </Form.Select>
              </Form.Group>
              
              <Button variant="primary" type="submit" className="w-100">
                Add Reward
              </Button>
            </Form>
          </Card>
        </Col>
        <Col md={6}>
          <h3 className="text-center mb-4">My Rewards</h3>
          {loading ? (
            <div className="text-center">Loading rewards...</div>
          ) : (
            <ListGroup>
              {rewards.length > 0 ? (
                rewards.map(reward => (
                  <ListGroup.Item key={reward.id} className="d-flex justify-content-between align-items-center">
                    {editingRewardId === reward.id ? (
                      // Editing View
                      <InputGroup>
                        <Form.Control
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                        />
                        <Form.Select
                          value={editingCost}
                          onChange={(e) => setEditingCost(e.target.value)}
                          style={{ maxWidth: "150px" }}
                        >
                          <option value="Small">Small (3 pts)</option>
                          <option value="Medium">Medium (5 pts)</option>
                          <option value="Large">Large (10 pts)</option>
                        </Form.Select>
                        <Button
                          variant="outline-success"
                          onClick={() => handleSaveEdit(reward.id)}
                        >
                          <BsSave />
                        </Button>
                      </InputGroup>
                    ) : (
                      // Normal View
                      <>
                        <div className="d-flex align-items-center flex-grow-1">
                          <span className="me-3" style={{ wordBreak: "break-word" }}>
                            {reward.name}
                          </span>
                        </div>
                        <div className="d-flex align-items-center flex-shrink-0">
                          <Badge bg={getCostColor(reward.cost)} pill className="me-2">
                            {getCostPoints(reward.cost)}
                          </Badge>
                          {!readOnly && (
                            <>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                className="me-2"
                                onClick={() => handleStartEdit(reward)}
                              >
                                <BsPencil />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteReward(reward.id)}
                              >
                                <BsTrash />
                              </Button>
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>You have no rewards yet.</ListGroup.Item>
              )}
            </ListGroup>
          )}

          <div className="mt-4">
            <h5>Points: {userPoints}</h5>
            <ProgressBar now={Math.min((userPoints / 10) * 100, 100)}
              label={`${Math.min((userPoints / 10) * 100, 100).toFixed(0)}%`}/>
              <p>Progress towards next rewards...</p>
          </div>
        </Col>
      </Row>
    </Container>
  );
}

export default RewardsPage;