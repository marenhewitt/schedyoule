import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  Form,
  Button,
  ListGroup,
  InputGroup,
  Badge, 
  Dropdown
} from "react-bootstrap";
import { BsPencil, BsTrash, BsSave, BsPlusLg, BsSortDown, BsCalendar } from "react-icons/bs";
import { addTask, getUserTasks, updateTask, deleteTask, toggleTaskCompleted } from "./firestore.js";

const ToDoList = ({ readOnly = false }) => {
  const [tasks, setTasks] = useState([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDifficulty, setNewTaskDifficulty] = useState(3);
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingDifficulty, setEditingDifficulty] = useState(3);  
  const [editingDeadline, setEditingDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("timeAdded-desc");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const fetchedTasks = await getUserTasks();
    setTasks(fetchedTasks);
    setLoading(false);
  };

  const handleAddTask = async (e) => {
    e.preventDefault(); 
    if (readOnly) return;
    if (newTaskText.trim() === "") return;
    
    const taskId = await addTask(newTaskText, newTaskDifficulty, newTaskDeadline);

    setTasks ([ ...tasks, {
      id: taskId, 
      text: newTaskText, 
      difficulty: newTaskDifficulty, 
      deadline: newTaskDeadline,
      completed: false,
      createdAt: {seconds: Math.floor(Date.now() / 1000) }
    }
  ]);

    setNewTaskText("");
    setNewTaskDifficulty(3);
    setNewTaskDeadline("");
  };

  const handleDeleteTask = async (id) => {
    if (readOnly) return;
    await deleteTask(id);
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const handleStartEdit = (task) => {
    if (readOnly) return;
    setEditingTaskId(task.id);
    setEditingText(task.text);
    setEditingDifficulty(task.difficulty || 3);
    setEditingDeadline(task.deadline || "");
  };

  const handleSaveEdit = async (id) => {
    if (readOnly) return;
    await updateTask(id, editingText, editingDifficulty, editingDeadline);
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, text: editingText, difficulty: editingDifficulty, deadline: editingDeadline } : task
      )
    );
    setEditingTaskId(null);
    setEditingText("");
    setEditingDifficulty(3);
    setEditingDeadline("");
  };

  const handleToggleCompleted = async (task) => {
    await toggleTaskCompleted(task.id, task.completed);

    setTasks(tasks.map(t => 
      t.id === task.id ? {...t, completed: !task.completed } : t
    ))
  };

  // Helper function to get difficulty color and label
  const getDifficultyColor = (difficulty) => {
    const colors = {
      1: "success",  // Green - Easy
      2: "info",     // Blue - Light
      3: "warning",  // Yellow - Medium
      4: "danger",   // Red - Hard
      5: "dark"    // Dark - Very Hard
    };
    return colors[difficulty] || "secondary";
  };

  //deadline status
 const getDeadlineStatus = (deadline, completed) => {
    if (!deadline || completed) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "overdue", text: "Overdue!", variant: "danger" };
    if (diffDays === 0) return { status: "today", text: "Due Today", variant: "warning" };
    if (diffDays === 1) return { status: "tomorrow", text: "Due Tomorrow", variant: "warning" };
    if (diffDays <= 3) return { status: "soon", text: `${diffDays} days`, variant: "info" };
    
    return { status: "future", text: `${diffDays} days`, variant: "secondary" };
  };

  const formatDeadlineDisplay = (deadline) => {
    if (!deadline) return null;
    const date = new Date(deadline);
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };

  //sorting tasks
  const getSortedTasks = () => {
    const tasksCopy = [...tasks];

    switch(sortBy) {
      case "difficulty-asc":
        return tasksCopy.sort((a,b) => (a.difficulty || 3) - (b.difficulty || 3));
      case "difficulty-desc":
        return tasksCopy.sort((a,b) => (b.difficulty || 3) - (a.difficulty || 3));
      case "timeAdded-asc":
        return tasksCopy.sort((a,b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });
      case "timeAdded-desc":
        return tasksCopy.sort((a,b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });
      case "deadline-asc":
        return tasksCopy.sort((a,b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline) - new Date(b.deadline);
        });
      case "deadline-desc":
        return tasksCopy.sort((a,b) => {
          if (!a.deadline && !b.deadline) return 0;
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(b.deadline) - new Date(a.deadline);
        });
      case "alphabetical-asc": 
        return tasksCopy.sort((a,b) => a.text.localeCompare(b.text));
      case "alphabetical-desc": 
        return tasksCopy.sort((a,b) => b.text.localeCompare(a.text));      
      default:
        return tasksCopy;
    }
  }

  const getSortLabel = () => {
    const labels = {
      "difficulty-asc": "Difficulty (Low to High)",
      "difficulty-desc": "Difficulty (High to Low)",
      "timeAdded-asc": "Time Added (Oldest First)",
      "timeAdded-desc": "Time Added (Newest First)",
      "deadline-asc": "Deadline (Earliest First)",
      "deadline-desc": "Deadline (Latest First)",
      "alphabetical-asc": "Alphabetical (A-Z)",
      "alphabetical-desc": "Alphabetical (Z-A)"
    };
    return labels[sortBy] || "Sort By";    
  }

  if (loading) {
    return <div className="text-center mt-5">Loading tasks...</div>;
  }

  const sortedTasks = getSortedTasks();

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "40vh" }} //changed for homepage layout
    >
      <Card style={{ width: "600px", backgroundColor: "#e7f5ff" }} className="p-4">
        <h2 className="text-center mb-4">My To-Do List</h2>

        <Form onSubmit={handleAddTask}>
          <InputGroup className="mb-3">
            <Form.Control
              placeholder="What do you need to do?"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              disabled={readOnly}
            />
            {/* Difficulty Dropdown */}
            <Form.Select
              value={newTaskDifficulty}
              onChange={(e) => setNewTaskDifficulty(Number(e.target.value))}
              style={{ maxWidth: "150px" }}
              disabled={readOnly}
            >
              <option value={1}>1 - Very Easy</option>
              <option value={2}>2 - Easy</option>
              <option value={3}>3 - Medium</option>
              <option value={4}>4 - Hard</option>
              <option value={5}>5 - Very Hard</option>
            </Form.Select>
          </InputGroup>
          
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <BsCalendar />
            </InputGroup.Text>
            <Form.Control
              type="date"
              placeholder="Deadline (optional)"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              disabled={readOnly}
            />
            <Button variant="primary" type="submit">
              <BsPlusLg className="me-2" /> Add
            </Button>
          </InputGroup>      
  
        </Form>

        {/* Sort Dropdown */}
        <div className="d-flex justify-content-end mb-2">
          <Dropdown>
            <Dropdown.Toggle variant="outline-secondary" size="sm">
              <BsSortDown className="me-2" />
              {getSortLabel()}
            </Dropdown.Toggle>

            <Dropdown.Menu>
              <Dropdown.Header>Sort by Difficulty</Dropdown.Header>
              <Dropdown.Item onClick={() => setSortBy("difficulty-asc")}>
                Difficulty (Low to High)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy("difficulty-desc")}>
                Difficulty (High to Low)
              </Dropdown.Item>
              
              <Dropdown.Divider />

              <Dropdown.Header>Sort by Deadline</Dropdown.Header>
              <Dropdown.Item onClick={() => setSortBy("deadline-asc")}>
                Deadline (Earliest First)
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy("deadline-desc")}>
                Deadline (Latest First)
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Header>Sort by Time</Dropdown.Header>
              <Dropdown.Item onClick={() => setSortBy("timeAdded-desc")}>
                Newest First
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy("timeAdded-asc")}>
                Oldest First
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Header>Sort Alphabetically</Dropdown.Header>
              <Dropdown.Item onClick={() => setSortBy("alphabetical-asc")}>
                A-Z
              </Dropdown.Item>
              <Dropdown.Item onClick={() => setSortBy("alphabetical-desc")}>
                Z-A
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>        

        <hr />

        <ListGroup>
          {sortedTasks.map((task) => (
            <ListGroup.Item
              key={task.id}
              className="d-flex justify-content-between align-items-center"
            >
              {editingTaskId === task.id ? (
              // --- Editing View ---
              <div className="w-100">  
                <InputGroup className="mb-2">
                  <Form.Control
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                  />
                    {/* Difficulty Dropdown for Editing */}
                    <Form.Select
                      value={editingDifficulty}
                      onChange={(e) => setEditingDifficulty(Number(e.target.value))}
                      style={{ maxWidth: "150px" }}
                    >
                      <option value={1}>1 - Very Easy</option>
                      <option value={2}>2 - Easy</option>
                      <option value={3}>3 - Medium</option>
                      <option value={4}>4 - Hard</option>
                      <option value={5}>5 - Very Hard</option>
                    </Form.Select>    
                  </InputGroup>
                  {/* Add deadline input in edit mode */}
                  <InputGroup>
                    <InputGroup.Text>
                      <BsCalendar />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={editingDeadline}
                      onChange={(e) => setEditingDeadline(e.target.value)}
                    />
                                
                  <Button
                    variant="outline-success"
                    onClick={() => handleSaveEdit(task.id)}
                  >
                    <BsSave />
                  </Button>
                </InputGroup>
              </div>
              ) : (
                // --- Normal View ---
                <>
                <div className="d-flex align-items-start flex-grow-1">
                  
                  <Form.Check type="checkbox"
                    checked={task.completed || false} className="me-2 mt-1"
                    onChange={() => handleToggleCompleted(task)}
                  />
                  
          
                  <Badge 
                    bg={getDifficultyColor(task.difficulty)} 
                    className="me-2 mt-1"
                    style={{ minWidth: "20px" }}
                  >
                    {task.difficulty}
                  </Badge>

                  <div className="flex-grow-1 me-3">
                      <span
                        style={{ 
                          wordBreak: "break-word",
                          textDecoration: task.completed ? "line-through" : "none"
                        }}
                      >
                        {task.text}
                      </span>
                  </div>
                    <div style={{minWidth: '150px'}}>
                      {task.deadline && (
                            <div className="mt-1 me-3">
                              <small className="text-muted me-2">
                                <BsCalendar className="me-1" />
                                {formatDeadlineDisplay(task.deadline)}
                              </small>
                              {getDeadlineStatus(task.deadline, task.completed) && (
                                <Badge 
                                  bg={getDeadlineStatus(task.deadline, task.completed).variant}
                                  className="ms-1"
                                >
                                  {getDeadlineStatus(task.deadline, task.completed).text}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                    </div>

                  {!readOnly && (
                  <div className="flex-shrink-0 align-self-start">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => handleStartEdit(task)}
                    >
                      <BsPencil />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <BsTrash />
                    </Button>
                  </div>
                  )}
                </>
              )}
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Card>
    </Container>
  );
};

export const TaskListCompact = ({ readOnly = false }) => { 
  const [tasks, setTasks] = useState([]);             
  const [loading, setLoading] = useState(true);            
  useEffect(() => {                                        
    const load = async () => {
      const fetched = await getUserTasks();
      setTasks(fetched);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div>Loading...</div>;  
  
  if (tasks.length === 0) {
    return <p className="text-muted" style={{margin: '2px'}}>List is empty for now</p>
  }

  return (                                                   
    <ListGroup style={{ background: "transparent" }}>
      {tasks.map(task => (
        <ListGroup.Item 
          key={task.id}
          style={{
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div className="d-flex align-items-center">
            <Form.Check
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskCompleted(task.id, task.completed)}
              disabled={readOnly}
              className="me-2"
            />

            <Badge 
              bg={
                task.difficulty 
                  ? ["success","info","warning","danger","dark"][task.difficulty - 1]
                  : "secondary"
              }
              className="me-2"
            >
              {task.difficulty}
            </Badge>

            <span style={{ 
              textDecoration: task.completed ? "line-through" : "none" 
            }}>
              {task.text}
            </span>
          </div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default ToDoList;