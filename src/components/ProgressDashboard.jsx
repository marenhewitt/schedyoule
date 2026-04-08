import React, { useEffect, useState } from "react";
import { Card, ProgressBar, ListGroup, Badge } from "react-bootstrap";
import { getUserRewards, getUserTasks } from "../firestore.js";

import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS, CategoryScale, PointElement, LineElement, Tooltip, Legend,
    LinearScale,} from "chart.js"

    ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const ProgressDashboard = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rewards, setRewards] = useState([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [streak, setStreak] = useState(0);
    const [completedToday, setCompletedToday] = useState(0);

    useEffect(() => {
        loadTasks();
        getRewards();
    }, []);

    useEffect(() => {
        const today = new Date();
        const todayTasks = tasks.filter((task) => {
            if (!task.createdAt) return false
            const taskDate = new Date(task.createdAt.seconds * 1000);
            return (
                taskDate.getFullYear() === today.getFullYear() &&
                taskDate.getMonth() === today.getMonth() &&
                taskDate.getDate() === today.getDate()
            )
        })

        const completedTodayTasks = todayTasks.filter((task) => task.completed).length;
        setCompletedToday(completedTodayTasks);
        updateStreak(todayTasks);  
    }, [tasks]);

//Todays tasks
    const loadTasks = async () => {
        const allTasks = await getUserTasks();
        setTasks(allTasks || []);
        setLoading(false);
    }

    const getRewards = async () => {
        try {
            const userRewards = await getUserRewards();
            const points = userRewards.reduce((sum, reward) => sum + (reward.cost === 'Small' ? 3 : reward.cost === 'Medium' ? 5 : 10), 0);
            setTotalPoints(points);
            setRewards(userRewards);
        } catch (err) {
            console.error("Could not get the reward: ", err);
        }
    }

    const updateStreak = (todayTasks) => {
        if (tasks.length === 0) return;
        const todayCompleted = todayTasks.some((task) => task.completed)

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayTasks = tasks.filter((task) => {
            if (!task.createdAt) return false;
            const taskDate = new Date(task.createdAt.seconds * 1000);
            return (
                taskDate.getFullYear() === yesterday.getFullYear() &&
                taskDate.getMonth() === yesterday.getMonth() &&
                taskDate.getDate() === yesterday.getDate()
            )
        })

        const completedYesterday = yesterdayTasks.filter((task) => task.completed).length;

        if (todayCompleted && completedYesterday) {
        setStreak((prev) => prev + 1);
        } else if (todayCompleted) {
            setStreak(1);
        } else {
            setStreak(0);
        }
    }

    const today = new Date();
        const todayTasks = tasks.filter((task) => {
            const taskDate = new Date(task.createdAt.seconds * 1000);
            return (
                taskDate.getFullYear() === today.getFullYear() &&
                taskDate.getMonth() === today.getMonth() &&
                taskDate.getDate() === today.getDate()
            )
        })
    const total = todayTasks.length;
    const completed = todayTasks.filter(task => task.completed).length;
    const tasksLeft = todayTasks.filter(task => !task.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const nextTask = todayTasks.find(task => !task.completed);

    const rewardThreshold = 15;
    const nextReward = Math.min(100, (totalPoints / rewardThreshold) * 100);

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

    //Weekly Overview
        const weekDays = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date();
            d.setDate(today.getDate() - (6 - i));
            return d;
        });

        const tasksPerDay = weekDays.map((day) => {
            const dayTasks = tasks.filter((task) => {
                if (!task.createdAt) return false;
                const taskDate = typeof task.createdAt.toDate === "function" ? task.createdAt.toDate() :
                    new Date(task.createdAt.seconds * 1000);
                return (
                    taskDate.getFullYear() === day.getFullYear() &&
                    taskDate.getMonth() === day.getMonth() &&
                    taskDate.getDate() === day.getDate()
                )
            })
        const completedTasks = dayTasks.filter(task => task.completed).length;
        return { total: dayTasks.length, completed: completedTasks};
    });

    const weeklyTotal = tasksPerDay.reduce((sum, d) => sum + d.total, 0);
    const weeklyCompleted = tasksPerDay.reduce((sum, d) => sum + d.completed, 0);

    const weeklyCompletionRate = weeklyTotal === 0 ? 0 : Math.round((weeklyCompleted / weeklyTotal) * 100);
    const overallProductivityScore = weeklyCompletionRate;

    const chartData = {
        labels: weekDays.map((day) => 
            day.toLocaleDateString('en-US', {weekday: 'short'})
        ), datasets: [
            {
                label: 'Tasks Completed',
                data: tasksPerDay.map((day) => day.completed),
                borderColor: '#000000',
                backgroundColor: 'rgba(13, 110, 253, 0.2)', tension: 0.3,
            },
        ],
    };

//Today's Progress
    return (
        <div style={{ minHeight: "100vh", backgroundColor: '#96C5F7', paddingTop: "20px", paddingBottom: "20px"}}>    
        <div style={{maxWidth:"700px", margin: "0 auto", padding: "20px "}}>
            <h2>Progress Dashboard</h2>

            <Card style={{width: "100%", padding: "20px", backgroundColor: "#f0f8ff" }}>
                <h3> Today's Progress </h3>

                <p> {completed} of {total} tasks</p>
                <ProgressBar now ={progress} label={`${progress}%`}/>

            <div style={{ marginTop: "10px", marginBottom: "10px", lineHeight: "1.4"}}>
                {nextTask && (
                    <p style={{ margin: 0}}><strong>Next task:</strong> {nextTask.text}</p>
                )}
                    <p style={{ margin: 0}}><strong>Tasks Left:</strong> {tasksLeft}</p>
            </div>

                <h4 className="mt-4">Today's Tasks</h4>
                {tasks.length === 0 ? (
                    <p style={{ opacity: 0.6}}>No tasks added today...</p>
                ) : (
                    <ListGroup>
                        {tasks.map((task) => (
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

            <hr style={{ margin: "30px 0", borderTop: "2px solid #000000"}}></hr>

            <h3 className="mt-4">Weekly Productivity Overview</h3>
                <div className="mb-3">
                    <p><strong>Weekly Completion Rate:</strong>{weeklyCompletionRate}%</p>
                    <p><strong>Overall Productivity Score:</strong>{overallProductivityScore}%</p>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "600px"}}>
                    {tasksPerDay.map((day, index) => {
                        const barHeight = day.total === 0 ? 0 : Math.round((day.completed / day.total) * 100);
                        return (
                            <div key={index} style={{ textAlign: "center", width: "12%" }}>
                                <div style={{
                                    height: "150px", width: "100%", backgroundColor: "#e9ecef", position: "relative", borderRadius: "4px", display: "flex", flexDirection: "column-reverse", justifyContent: "flex-start", alignItems: "center" }}>
                                        <div style={{width: "100%", height: `${barHeight}%`, backgroundColor: "#0d6efd", borderRadius: "4px 4px 0 0", display: "flex", alignItems: barHeight > 15 ? "center" : "flex-start"}}>
                                            {barHeight > 15 && `${day.completed}/${day.total}`}
                                        </div>
                                        {barHeight <= 15 && (
                                        <div style={{fontSize: "12px", textAlign: "center", fontWeight: "bold", marginBottom: "2px" }}>
                                            {day.completed}/{day.total}
                                        </div>
                                            )}
                                        </div>
                                <small>{weekDays[index].toLocaleDateString('en-US', { weekday: 'short' })}</small>
                            </div>
                        )
                    })}
                </div>


                <div style={{ width: "100%", height: "200px"}}>
                        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }}/>
                    </div>
                   
                <hr style={{ margin: "30px 0", borderTop: "2px solid #000000"}}></hr>
                    <h4 className="mt-4">Rewards</h4>
                        <p>Total Points: {totalPoints}</p>
                        <p style={{margin: 0, marginTop: "5px" }}><strong>Current Streak: </strong> {streak} days</p>
                        <ProgressBar now={nextReward} label={`${Math.round(nextReward)}%`} />
                            {totalPoints >= rewardThreshold && (
                                <Badge bg="success" className="mt-2">New reward unlocked!</Badge>
                            )}
                    </Card>
                </div>
            </div>
        )
};
export default ProgressDashboard;
