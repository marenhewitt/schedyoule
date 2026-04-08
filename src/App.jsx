import { useState, useEffect, use } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import './App.css'
import './firebase.js'
import NavigationBar from './components/Navbar';
import Calendar from './Calendar'
import ToDoList from './ToDoList'
import Pomodoro from './Pomodoro'
import Login from './Login';
import HomePage from './components/HomePage.jsx';
import RewardsPage from './RewardsPage';
import ProgressDashboard from "./components/ProgressDashboard.jsx"
import { Button } from 'react-bootstrap';
import useTimer  from './hooks/useTimer.js';
import PomodoroTimer from './components/PomodoroTimer.jsx';
import TimerWidget from './components/TimerWidget.jsx';
import HabitTracker from './HabitTracker.jsx'
import SummaryDashboard from './components/SummaryDashboard.jsx';

function App() {

  const timerProps = useTimer();

  const location = useLocation();
  const isPomodoroPage = location.pathname === '/pomodoro';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  if (!user) {
    return <Login />;
  }


  return (
    <>
    <head>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Lora:ital,wght@0,400..700;1,400..700&family=Roboto+Slab:wght@100..900&family=Tai+Heritage+Pro&display=swap"/>
    </head>
      <div className="App">
        <div className="d-flex justify-content-between align-items-center mb-3 mt-4">
          <h1 className="text-center mb-2 flex-grow-1" style={{ fontWeight: 'bold' }}>SchedYouLe</h1>
        </div>
          <NavigationBar onLogout={handleLogout} />
        <div className='mt-4'>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/Pomodoro" element={<Pomodoro {...timerProps} />} />
            <Route path="/todolist" element={<ToDoList />} />
            <Route path="/habittracker" element={<HabitTracker />} />
            <Route path="/rewards" element={<RewardsPage />} />
            <Route path="/dashboard" element={<SummaryDashboard />} />
            <Route path="/summary" element={<SummaryDashboard />} />     
          </Routes>
        </div>
        {!isPomodoroPage && (timerProps.start || timerProps.timeRemaining !== 25*60) && (
        <div className="fixed-bottom mb-3 me-3">
          <TimerWidget {...timerProps} />
        </div>)}
      </div>
    </>
  );
}

export default App;
