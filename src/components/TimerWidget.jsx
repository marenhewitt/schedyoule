import React from "react";
import { Link } from "react-router-dom";
import "./Pomodoro.css";

const TimerWidget = (props) => {
  return (
    <div className="timer-widget">
        <Link to="/pomodoro" className="timer-widget-link">
            <div className="timer-widget-session">
                {props.session === 'work' ? "Work" : "Break"}
            </div>
            <div className="timer-widget-time">
                {props.formatTime(props.timeRemaining)}
            </div>
            <button onClick={(e)=>{
                e.preventDefault();
                props.handleStartPause();
            }}>
                {props.start ? "Pause" : "Start"}
            </button>
        </Link>
    </div>
  );
};

export default TimerWidget;