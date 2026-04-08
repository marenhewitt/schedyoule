import React, { useState, useEffect } from "react";
import "./Pomodoro.css";

const PomodoroTimer = (props) => {

  return (
    <div><h1>Pomodoro Timer</h1>
      <div className="timer-container">
        <div className="session-title">{props.session === 'work' ? "Work" : "Break"}</div>
        <div className="timer-display">{props.formatTime(props.timeRemaining)}</div>
          <div className="timer-buttons">
              <button onClick={props.handleStartPause}>
                  {props.start ? "Pause" : "Start"}
              </button>
              <button onClick={props.handleResetCountdown}>Reset</button>
              <button onClick={props.handleSession}>
                  Switch to {props.session === 'work' ? "Break" : "Work"}</button>
          </div>
      </div>
    </div>
  );
};

export default PomodoroTimer;