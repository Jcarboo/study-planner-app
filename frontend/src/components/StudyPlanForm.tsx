import React, { useState } from 'react';
import axios from 'axios'; 

type StudyPlanFormProps = {
    onPlanCreated: () => void;
  };

  export default function StudyPlanForm({ onPlanCreated }: StudyPlanFormProps) {
    const [title, setTitle] = useState<string>('');
    const [subject, setSubject] = useState<string>('');
    const [deadline, setDeadline] = useState<string>('');
    const [tasks, setTasks] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const taskObjs = tasks.map((t) => ({name: t, done: false}));
            await axios.post('https://study-planner-backend-xjed.onrender.com/study/create', {
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
            <input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} placeholder='Title' required />
            <input value={subject} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)} placeholder='Subject' required />
            <input type="date" value={deadline} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeadline(e.target.value)} required />


            {tasks.map((task, i) => (
                <input key={i} value={task} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {

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