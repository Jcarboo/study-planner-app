import React from 'react';
import StudyPlanForm from '../components/StudyPlanForm';
import StudyPlanList from '../components/StudyPlanList';
import DeleteAccount from '../components/DeleteAccount';

export default function Dashboard() {
    const [refreshToggle, setRefreshToggle] = React.useState(false);

    const triggerRefresh = () => setRefreshToggle(prev => !prev);

    return (
        <div>
            <h1>Study Dashboard</h1>
            <StudyPlanForm onPlanCreated={triggerRefresh} />
            <StudyPlanList refresh={refreshToggle} />
            <DeleteAccount />
        </div>
    );
}