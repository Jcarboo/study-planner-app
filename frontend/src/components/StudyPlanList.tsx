import React, { useEffect, useState } from 'react';
import axios from 'axios';

type StudyPlanListProps = {
    refresh: boolean;
  };
  
  type Task = {
    name: string;
    done: boolean;
  };
  
  type StudyPlan = {
    _id: string;
    title: string;
    subject: string;
    deadline: string;
    tasks: Task[];
  };
  
  export default function StudyPlanList({ refresh }: StudyPlanListProps) {
    const [plans, setPlans] = useState<StudyPlan[]>([]);

    // Function to get all plans
    const fetchPlans = async () => {
    try {
        const res = await axios.get("https://study-planner-backend-xjed.onrender.com/study/all", {
        withCredentials: true,
        });
        setPlans(res.data);
    } catch (err) {
        console.error("Error fetching study plans", err);
    }
    };

    useEffect(() => {
        fetchPlans();}, [refresh])

    // Functions to delete and add task
    const deleteTask = async (planId: string, taskName: string) => {
    try {
        await axios.post(`https://study-planner-backend-xjed.onrender.com/study/${planId}/delete-task`, {
        task_name: taskName
        }, { withCredentials: true });
        // Refresh UI after deletion
        fetchPlans();
    } catch (err) {
        console.error("Failed to delete task:", err);
    }
    };
    const [newTask, setNewTask] = useState("");

    const addTask = async (planId: string) => {
    try {
        await axios.post(`https://study-planner-backend-xjed.onrender.com/study/${planId}/add-task`, {
        task_name: newTask
        }, { withCredentials: true });
        setNewTask("");
        fetchPlans();
    } catch (err) {
        console.error("Failed to add task:", err);
    }
    };

    // Task done function
    const toggleTaskDone = async (planId: string, taskName: string, currentDone: boolean) => {
    try {
        await axios.post(`https://study-planner-backend-xjed.onrender.com/study/${planId}/toggle-task`, {
        task_name: taskName,
        done: !currentDone
        }, { withCredentials: true });

        fetchPlans();
    } catch (err) {
        console.error("Failed to toggle task status", err);
    }
    };

    const deletePlan = async (planId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this study plan?");
    if (!confirmDelete) return;

    try {
        await axios.delete(`https://study-planner-backend-xjed.onrender.com/study/${planId}`, {
        withCredentials: true
        });
        fetchPlans(); // Refresh UI
    } catch (err) {
        console.error("Failed to delete plan:", err);
    }
    };



     useEffect(() => {
        fetchPlans();}, [refresh])

    return (
        <div>
            <h2>Your Study Plans</h2>
            {plans.map(plan => (
                <div key={plan._id} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "1em" }}>
                <h3>{plan.title}</h3>
                <p><strong>Subject:</strong> {plan.subject}</p>
                <p><strong>Deadline:</strong> {plan.deadline}</p>

                <button onClick={() => deletePlan(plan._id)} style={{ color: 'red' }}>
                    Delete Plan
                </button>
                    <ul>
                        {plan.tasks.map((task, i) => (
                            <div key={i}>
                                <span style={{ textDecoration: task.done ? 'line-through' : 'none' }}>
                                {task.name}
                                </span>
                                <button onClick={() => toggleTaskDone(plan._id, task.name, task.done)}>
                                {task.done ? "↻" : "✅" }
                                </button>
                                <button onClick={() => deleteTask(plan._id, task.name)}>🗑️</button>
                            </div>
                            ))}
                    </ul>
                    <input
                        onChange={(e) => setNewTask(e.target.value)}
                        placeholder="New task"
                    />
                    <button onClick={() => addTask(plan._id)}>Add Task</button>
                </div>
            ))}
        </div>
    )
}