import { useState, useEffect } from 'react';

const workTime = 25 * 60; // 25 minutes into seconds
const breakTime = 5 * 60; // 5 minutes ...

function useTimer() {

  const [session, setSession] = useState('work');
  const [timeRemaining, setTimeRemaining] = useState(workTime);
  const [start, setStart] = useState(false);

  useEffect(() => {
      let interval = null;
      if (start && timeRemaining > 0) {
      interval = setInterval(() => {
          setTimeRemaining((prevTime) => prevTime - 1);
          }, 1000); 
          // countdown
      } else if (start && timeRemaining === 0) {
          clearInterval(interval);
          alert(`Time's up! Switch to ${session === 'work' ? "Break" : "Work"} session.`);
          handleSession();
      }
      return () => clearInterval(interval);
  }, [session, start, timeRemaining]);

  const formatTime = (time) => {
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      //using padStart adds a 0 if single digit
      const paddedMinutes = String(minutes).padStart(2, "0");
      const paddedSeconds = String(seconds).padStart(2, "0");
      //returns time into a string, requires backtick
      return `${paddedMinutes}:${paddedSeconds}`;
  };

  const handleStartPause = () => {
      setStart(!start); //toggle
  };

  const handleResetCountdown = () => {
      setStart(false);
      setTimeRemaining(session === 'work' ? workTime : breakTime);
  };

  const handleSession = () => {
      setStart(false); //pause when switching
      if (session === 'work') {
          setSession('break');
          setTimeRemaining(breakTime);
      } else {
          setSession('work');
          setTimeRemaining(workTime);
      }
  };

  return {
    session,
    timeRemaining,
    start,
    formatTime,
    handleStartPause,
    handleResetCountdown,
    handleSession
  };
};

export default useTimer;