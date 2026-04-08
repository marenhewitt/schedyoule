import React from 'react';
import PomodoroTimer from './components/PomodoroTimer.jsx';
  
export default function Pomodoro(props) {
  return(
    <div>
      <PomodoroTimer {...props} />
    </div>
  );
}
