import { db, auth } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc, 
  increment,
  doc, 
  query, 
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { writeBatch } from 'firebase/firestore';

// ===== USER FUNCTIONS =====
export const createUserProfile = async (user) => {
  try {
    await addDoc(collection(db, 'users'), {
      userId: user.uid,
      email: user.email,
      displayName: user.displayName || 'Anonymous',
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
  }
};

// ===== TASK FUNCTIONS =====
export const addTask = async (taskText, difficulty = 3, deadline = null) => {
  try {
    const userId = auth.currentUser.uid;
    const docRef = await addDoc(collection(db, 'tasks'), {
      userId,
      text: taskText,
      difficulty,
      completed: false,
      createdAt: serverTimestamp(),
      completedAt: null,  
      deadline: deadline || null,
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding task:', error);
  }
};

export const getUserTasks = async () => {
  try {
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'tasks'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting tasks:', error);
    return [];
  }
};

export const updateTask = async (taskId, newText, difficulty, newDeadline) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, { text: newText, 
      difficulty, 
      deadline: newDeadline || null });
  } catch (error) {
    console.error('Error updating task:', error);
  }
};

export const deleteTask = async (taskId) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
  } catch (error) {
    console.error('Error deleting task:', error);
  }
};

export const toggleTaskCompleted = async (taskId, currentValue) => {
  try {
    const taskRef = doc(db, 'tasks', taskId);
    await updateDoc(taskRef, {
      completed: !currentValue,
      completedAt: !currentValue ? serverTimestamp() : null  // Set timestamp when completing, clear when uncompleting
    });
  } catch (error) {
    console.error("Error with task completion: ", error)
  }
}

// ===== EVENT FUNCTIONS =====
export const addEvent = async (eventData) => {
  try {
    const userId = auth.currentUser.uid;
    const docRef = await addDoc(collection(db, 'events'), {
      userId,
      ...eventData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding event:', error);
  }
};

export const getUserEvents = async () => {
  try {
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'events'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const deleteEvent = async (eventId) => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    console.error('Error deleting event:', error);
  }
};

// ===== REWARD FUNCTIONS =====
export const addReward = async (rewardData) => {
  try {
    const userId = auth.currentUser.uid;
    const docRef = await addDoc(collection(db, 'rewards'), {
      userId,
      ...rewardData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding reward:', error);
  }
};

export const getUserRewards = async () => {
  try {
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'rewards'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting rewards:', error);
    return [];
  }
};

export const updateReward = async (rewardId, newName, newCost) => {
  try {
    const rewardRef = doc(db, 'rewards', rewardId);
    await updateDoc(rewardRef, { name: newName, cost: newCost });
  } catch (error) {
    console.error('Error updating reward:', error);
  }
};

export const deleteReward = async (rewardId) => {
  try {
    await deleteDoc(doc(db, 'rewards', rewardId));
  } catch (error) {
    console.error('Error deleting reward:', error);
  }
};
// ===== PROGRESS TRACKING =====
export const updateUserPoints = async (userId, pointsEarned) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { points: increment(pointsEarned) }, {merge: true});
  } catch (error) {
    console.error('Erorr updating points: ', error);
  }
}

// ===== AVAILABILITY FUNCTIONS =====
export const addAvailability = async (availabilityData) => {
  try {
    const userId = auth.currentUser.uid;
    const docRef = await addDoc(collection(db, 'availability'), {
      userId,
      ...availabilityData,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding availability:', error);
  }
};

export const getUserAvailability = async () => {
  try {
    const userId = auth.currentUser.uid;
    const q = query(collection(db, 'availability'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting availability:', error);
    return [];
  }
};

export const batchAddEvents = async (eventsList) => {
  try {
    const userId = auth.currentUser.uid;
    const batch = writeBatch(db);
    
    eventsList.forEach(event => {
      const docRef = doc(collection(db, 'events'));
      batch.set(docRef, {
        userId,
        title: event.title,
        start: event.start, 
        end: event.end,     
        generated: true,
        createdAt: serverTimestamp()
      });
    });

    await batch.commit();
    console.log("Batch schedule saved");
  } catch (error) {
    console.error('Error batch adding events:', error);
  }
};

// ===== TASK FUNCTIONS (Real-time) =====
export const subscribeToUserTasks = (callback) => {
  const userId = auth.currentUser.uid;
  const q = query(collection(db, 'tasks'), where('userId', '==', userId));
  
  // onSnapshot is the key for real-time updates
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(tasks);
  }, (error) => {
    console.error('Error subscribing to tasks:', error);
  });

  return unsubscribe;
};

// ===== REWARD FUNCTIONS (Real-time) =====
export const subscribeToUserRewards = (callback) => {
  const userId = auth.currentUser.uid;
  const q = query(collection(db, 'rewards'), where('userId', '==', userId));

  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const rewards = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(rewards);
  }, (error) => {
    console.error('Error subscribing to rewards:', error);
  });

  return unsubscribe;
};