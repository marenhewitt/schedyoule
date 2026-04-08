import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase.js';
import { doc, collection, addDoc, query, where, onSnapshot, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { updateUserPoints } from './firestore.js';
import { BsPencil, BsTrash, } from "react-icons/bs";


const HabitTracker = () => {
    const [input, setInput] = useState('');
    const [habits, setHabits] = useState([]);
    const [user, setUser] = useState(null);
    const [holdHabit, setHoldHabit] = useState(null);
    const [editHabit, setEditHabit] = useState('');
    const [userPoints, setUserPoints] = useState(0);
    const [pointInput, setPointInput] = useState(1);

    useEffect(() => {
        let unsubscribeData; 
        let unsubscribePoints;

        const unsubscribeAuth = auth.onAuthStateChanged((userFromFirebase) => {
            setUser(userFromFirebase);

            if (userFromFirebase) {
                console.log("User detected:", userFromFirebase.uid);

                const q = query(
                    collection(db, "habits"), 
                    where("userId", "==", userFromFirebase.uid), 
                    orderBy("createdAt", "asc")
                );
                unsubscribeData = onSnapshot(q, (snapshot) => {
                    const habitsData = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setHabits(habitsData);
                });

                const userDocRef = doc(db, "users", userFromFirebase.uid);
                unsubscribePoints = onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserPoints(data.points || 0); 
                    }
                });

            } else {
                console.log("No user logged in.");
                setHabits([]);
                setUserPoints(0);

            }
        });
        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
            if (unsubscribeData) unsubscribeData();
            if (unsubscribePoints) unsubscribePoints(); // <--- 3. CLEAN UP POINTS LISTENER
        };

    }, []);

    const addHabit = async (e) => {
        e.preventDefault();
        const cleanInput = input.trim();
        if (cleanInput === '') return;
        if (!user) {
            alert("Please log in...");
            return;
        }
        const habitExists = habits.some(h => 
            h.name.toLowerCase() === cleanInput.toLowerCase()
        );

        if (habitExists) {
            alert(`You already have a habit named "${cleanInput}"!`);
            return;
        }

        // remove whitespace
        if (input.trim() === '') {
            alert("Input is empty");
            return;
        }

        await addDoc(collection(db, "habits"), {
            userId: user.uid,
            name: cleanInput,
            count: 0,
            pointsWorth: parseInt(pointInput) || 1,
            completed: false,
            createdAt: new Date()
        });
        setInput('');
        setPointInput(1);
    };

    // toggle completed or not
    const toggleHabit = async (habitId, currentCompleted, currentCount) => {
        try {
            const habitRef = doc(db, "habits", habitId);
            const safeCount = Number(currentCount) || 0;
            // const habitPoints = Number(pointsWorth) || 1;

            const newCompleted = !currentCompleted;
            const newCount = newCompleted ? safeCount + 1 : Math.max(0, safeCount - 1);

            // if (newCompleted) { 
            //     updateUserPoints(user.uid, habitPoints);
            //     console.log("Reward point granted!");
            // }
            // else{
            //     updateUserPoints(user.uid, -habitPoints);
            // }
            
            await updateDoc(habitRef, {
                completed: newCompleted,
                count: newCount
            });

            

        } catch (error) {
            console.error("Error toggling habit:", error);
        }
    };

    // habit adjustments
    const deleteHabit = async (habitId) => {
        if (window.confirm("Delete this habit?")) {
            try {
                const habitRef = doc(db, "habits", habitId);
                await deleteDoc(habitRef);
            } catch (error) {}
        }
    };

    const startEditing = (habit) => {
        setHoldHabit(habit.id);
        setEditHabit(habit.name);
    };

    const cancelEditing = () => {
        setHoldHabit(null);
        setEditHabit('');
    };

    const saveEdit = async (habitId) => {
        try {
            const habitRef = doc(db, "habits", habitId);
            await updateDoc(habitRef, { name: editHabit });
            setHoldHabit(null); // turn off edit mode
        } catch (error) {
            console.error("Error updating name:", error);
        }
    };

  return (

    <div style={{ width: "600px", backgroundColor: "#e7f5ff", margin: "0 auto", borderRadius: "5px" }} className="p-4">
        <h1 className="text-center mb-4">Habit Tracker</h1>
        <form onSubmit={addHabit} className="d-flex gap-2 mb-4">
            <input 
                type="text" 
                className="form-control"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter a new habit..."
                style={{ flex: 3 }} // Takes up more space
            />
            {/* <input 
                type="number" 
                className="form-control"
                value={pointInput}
                onChange={(e) => setPointInput(e.target.value)}
                placeholder="Pts"
                min="1"
                style={{ flex: 1 }} // Takes up less space
            /> */}
            <button type="submit" className="btn btn-primary">Add</button>
        </form>

    <div className="list-group">
            {habits.map((habitItem) => (
                <div key={habitItem.id} className="list-group-item d-flex justify-content-between align-items-center">
                    
                    <div className="flex-grow-1">
                        {holdHabit === habitItem.id ? (
                            <div className="d-flex gap-2">
                                <input 
                                    type="text" 
                                    className="form-control form-control-sm"
                                    value={editHabit}
                                    onChange={(e) => setEditHabit(e.target.value)}
                                />
                                
                                <button onClick={() => saveEdit(habitItem.id)} className="btn btn-success btn-sm">Save</button>
                                <button onClick={cancelEditing} className="btn btn-secondary btn-sm">Cancel</button>
                            </div>
                        ) : (
                            <div className="d-flex align-items-center gap-3">
                                <input 
                                    className="form-check-input mt-0" 
                                    type="checkbox" 
                                    style={{ width: '1.5em', height: '1.5em' }}
                                    checked={habitItem.completed}
                                    onChange={() => toggleHabit(
                                        habitItem.id, 
                                        habitItem.completed, 
                                        habitItem.count, 
                                        // habitItem.pointsWorth
                                    )}
                                />
                                <h5 className={`mb-0 ${habitItem.completed ? 'text-decoration-line-through text-muted' : ''}`}>
                                    {habitItem.name}
                                </h5>
                            </div>
                        )}
                    </div>

                    <div className="d-flex align-items-center gap-2 ms-3">
                        {holdHabit !== habitItem.id && (
                            <>
                                <span className="badge bg-secondary">Count: {habitItem.count}</span>
                                
                                <button 
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={() => startEditing(habitItem)}
                                >
                                    <BsPencil />
                                </button>
                                
                                <button 
                                    className="btn btn-outline-danger btn-sm"
                                    onClick={() => deleteHabit(habitItem.id)}
                                >
                                    <BsTrash />
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>
  ); 
};

export default HabitTracker;