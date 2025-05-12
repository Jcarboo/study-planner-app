import React, { useState } from 'react';
import axios from 'axios'; 

export default function StudyPlanForm({onPlanCreated}) {
    // Form parameters
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [deadline, setDeadline] = useState('');
    const [tasks, setTasks] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const taskObjs = tasks.map((t) => ({name: t, done: false}));
            await axios.post('http://localhost:5000/api/study-plans', {
                title,
                subject,
                deadline,
                tasks: taskObjs,
            }, { withCredentials: true});

            onPlanCreated();
            setTitle('');
            setSubject('');
            setDeadline('');
            setTasks([]);
        } catch (err) {
            console.error('Error creating study plan', err)
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Create a study plan</h2>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder='Title' required />
            <input value={subject} onChange={(e) => setTitle(e.target.value)} placeholder='Subject' required />
            <input type='date' value={deadline} onchange={(e) => setDeadline(e.targete.value)} required />

            {tasks.map((task, i) => (
                <input key={i} value={task} onChange={(e) => {

                    const copy = [...tasks];
                    copy[i] = e.target.value;
                    setTasks(copy);
                }} placeholder={`Task ${i + 1}`} required />

            ))}
            <button type='button' onClick={() => setTasks([...tasks, ''])}>+ Add Task</button>
            <button type='submit'>Create</button>
        </form>
    )
}