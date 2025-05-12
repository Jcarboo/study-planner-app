import React, { useEffect } from 'react';
import axios from 'axios';

export default function StudyPlanList({ refresh }) {
    const [plans, setPlans] = React.useState([]);

    useEffect(() => {
        axios.get('http://Localhost:5000/study/all', { withCredentials: true})
            .then((res) => setPlans(res.data))
            .catch((err) => console.error('Error fetching study plans', err));
    }, [refresh])

    return (
        <div>
            <h2>Your Study Plans</h2>
            {plans.map(plan => (
                <div key={plan._id}>
                    <h3>{plan.title}</h3>
                    <p><strong>Subject</strong>{plan.subject}</p>
                    <p><strong>Deadline</strong>{plan.deadline}</p>
                    <ul>
                        {plan.tasks.map((task, i) => (
                            <li key={i}>
                                {task.name} {task.done ? '✓' : '✗'}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    )
}