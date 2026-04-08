import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateSmartSchedule = async (tasks, availability, existingEvents) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      generationConfig: { responseMimeType: "application/json" }
    });

    const activeTasks = tasks.filter(t => !t.completed);
    if (activeTasks.length === 0) return [];

    const now = new Date();
    const localDate = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
    const localTime = now.toLocaleTimeString('en-GB', { 
      timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false 
    });

    const tasksData = activeTasks.map(t => ({
      text: t.text,
      difficulty: t.difficulty,
      deadline: t.deadline || "None" 
    }));

    const busySlots = existingEvents.map(e => ({
        title: e.title,
        start: e.start || e.date,
        end: e.end || "unknown"
    }));

    const prompt = `
    I am a scheduling assistant. Schedule these tasks for a student in NYC.
    
    CONTEXT:
    - Current Date (NYC): ${localDate}
    - Current Time (NYC): ${localTime}
    
    RULES:
    1. CRITICAL: Do NOT schedule tasks in the past.
    2. CRITICAL: Do NOT overlap with these EXISTING EVENTS: ${JSON.stringify(busySlots)}
    3. CRITICAL: Do NOT overlap with these BUSY TIMES: ${JSON.stringify(availability)}
    4. CRITICAL: If a task has a 'deadline', schedule it BEFORE that date/time.
    5. Sleep time: 11 PM - 8 AM.
    
    DATA FORMAT:
    Return a JSON array where each object has:
    - "title" (string)
    - "start" (ISO 8601 string, e.g., "2025-12-07T14:00:00")
    - "end" (ISO 8601 string calculated based on duration)
    
    DURATION RULES (Difficulty -> Time):
    - 1: 30m
    - 2: 45m
    - 3: 1h
    - 4: 2h
    - 5: 3h
    
    TASKS TO SCHEDULE:
    ${JSON.stringify(activeTasks.map(t => ({ 
        text: t.text, 
        difficulty: t.difficulty,
        deadline: t.deadline || "none" 
      })))}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log("AI Raw Response:", text);
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);

  } catch (error) {
    console.error("AI Scheduling Error:", error);
    throw error;
  }
};