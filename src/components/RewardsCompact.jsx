import React, { useEffect, useState } from 'react';
import { ListGroup, Badge } from 'react-bootstrap';
import { getUserRewards } from '../firestore';

const RewardsCompact = ({interactive = false}) => {
  const [rewards, setRewards] = useState([]);
  const [userPoints, setUserPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const userRewards = await getUserRewards();
      setRewards(userRewards);
      const totalPoints = userRewards.reduce((sum, r) => sum + (r.points || 0), 0);
      setUserPoints(totalPoints);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
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

  if (loading) return <div>Loading rewards...</div>;

  return (
    <div>
        <h4 className="mb-2">My Rewards</h4>

        <div style={{ maxHeight: '300', overFlowY: 'auto'}}>
            {rewards.length === 0 ? (
            <p className="text-muted">No rewards yet!</p>
        ) : (
            <ListGroup>
              {rewards.map(r => (
                <ListGroup.Item
                  key={r.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  {r.name}
                  <Badge bg={getCostColor(r.cost)} pill>{getCostPoints(r.cost)}</Badge>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </div>
    </div>
  )
}
export default RewardsCompact;