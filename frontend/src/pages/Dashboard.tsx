import React from 'react';
import StudyPlanForm from '../components/StudyPlanForm';
import StudyPlanList from '../components/StudyPlanList';
import StudyTips from '../components/StudyTips';


export default function Dashboard() {
  const [refreshToggle, setRefreshToggle] = React.useState(false);
  const triggerRefresh = () => setRefreshToggle(prev => !prev);

  return (
    <div className="relative w-full min-h-screen overflow-x-hidden text-white font-body pt-12">

      {/* Video Background */}
      <video
        src='/assets/videos/dashboard_background.mp4'
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src='/assets/videos/dashboard_background.mp4' type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#1a0b2e]/80 to-[#11001c]/80 z-0" />

      {/* Dashboard Content */}
      <div className="relative z-10 flex flex-col items-center justify-start min-h-screen px-6 pt-24 space-y-10">

        {/* Heading */}
        <h1 className="text-5xl font-heading font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.3rem_#e75480] text-center">
          Your Study Dashboard
        </h1>

        {/* Two-Column Content */}
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">

          {/* Study Plan Form on Left */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-indigo-500">
            <h2 className="text-2xl font-heading text-indigo-400 mb-4">Create a Plan</h2>
            <StudyPlanForm onPlanCreated={triggerRefresh} />
            <div className="mt-6">
              <StudyTips />
            </div>
          </div>
          
          {/* Plan List */}
          <div className="bg-black bg-opacity-50 backdrop-blur-md rounded-xl p-6 shadow-xl border border-pink-500 space-y-6">
            <h2 className="text-2xl font-heading text-pink-400 mb-2">Your Plans</h2>
            <StudyPlanList refresh={refreshToggle} />
          </div>
        </div>
      </div>
    </div>
  );
}
