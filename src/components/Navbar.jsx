import { Nav, Navbar, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

const NavigationBar = ({ onLogout }) => {
  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/calendar">Calendar</Nav.Link>            
            <Nav.Link as={Link} to="/pomodoro">Pomodoro</Nav.Link>
            <Nav.Link as={Link} to="/todolist">To Do List</Nav.Link>
            <Nav.Link as={Link} to="/habittracker">Habit Tracker</Nav.Link>
            <Nav.Link as={Link} to="/rewards">Rewards</Nav.Link>
            <Nav.Link as={Link} to="/dashboard">Progress Dashboard</Nav.Link>
          </Nav>

          <Button variant="outline-light" onClick={onLogout}>Logout</Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavigationBar;