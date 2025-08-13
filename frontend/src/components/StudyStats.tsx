import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer } from 'recharts';
import StudyStreakChart from '../components/StudyStreakChart';
import { motion } from 'framer-motion';

interface Task {
  name: string;
  done: boolean;
}

interface StudyPlan {
  title: string;
  subject: string;
  tasks: Task[];
}

interface SubjectStats {
  subject: string;
  total: number;
  completed: number;
  percent: number;
}

const COLORS = ['#00f7ff', '#c084fc', '#f472b6', '#4ade80', '#facc15', '#fb7185', '#60a5fa'];

export default function StudyStats() {
  const [stats, setStats] = useState<SubjectStats[]>([]);
  const [streakChart, setStreakChart] = useState<{ date: string; count: number }[]>([]);
  const [summary, setSummary] = useState<{
    longestStreak: number;
    weeklyCount: number;
    topSubject: string | null;
  } | null>(null);

  useEffect(() => {
    // Line chart streak data
    axios
      .get('http://study-planner-backend-xjed.onrender.com/study/task-completions/daily', { withCredentials: true })
      .then((res) => setStreakChart(res.data))
      .catch(() => {});

    // Subject completion stats
    axios
      .get<StudyPlan[]>('http://study-planner-backend-xjed.onrender.com/study/all', { withCredentials: true })
      .then((res) => {
        const plans = res.data;
        const subjectMap: Record<string, { total: number; completed: number }> = {};

        for (const plan of plans) {
          const subjectCode = plan.subject.slice(0, 4).toUpperCase();

          for (const task of plan.tasks) {
            if (!subjectMap[subjectCode]) {
              subjectMap[subjectCode] = { total: 0, completed: 0 };
            }
            subjectMap[subjectCode].total += 1;
            if (task.done) {
              subjectMap[subjectCode].completed += 1;
            }
          }
        }

        const formatted: SubjectStats[] = Object.entries(subjectMap).map(([subject, data]) => ({
          subject,
          total: data.total,
          completed: data.completed,
          percent: data.total ? Math.round((data.completed / data.total) * 100) : 0,
        }));

        setStats(formatted);
      })
      .catch((err) => {
        console.error('Error fetching study stats', err);
      });

    // Summary streak/top-subject data
    axios
      .get('http://study-planner-backend-xjed.onrender.com/study/stats/summary', { withCredentials: true })
      .then((res) => setSummary(res.data))
      .catch(() => {});
  }, []);

  return (
    <div className="w-full mt-16 px-4 md:px-12 lg:px-20">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text  drop-shadow-[0_0_0.15rem_#ff77e9] mb-8">
        📊 Study Stats
      </h2>

      {/* Summary Row */}
      {summary && (
        <div className="flex flex-wrap gap-6 mb-10">
          <div className="bg-black/40 px-4 py-3 rounded-xl border border-indigo-500/30 text-white shadow-[0_0_20px_#44006655]">
            🌟 <span className="text-indigo-300 font-semibold">Longest Streak:</span>{' '}
            <span className="text-pink-400 font-semibold">{summary.longestStreak} days</span>
          </div>
          <div className="bg-black/40 px-4 py-3 rounded-xl border border-indigo-500/30 text-white shadow-[0_0_20px_#44006655]">
            📆 <span className="text-indigo-300 font-semibold">Tasks This Week:</span>{' '}
            <span className="text-pink-400 font-semibold">{summary.weeklyCount}</span>
          </div>
          <div className="bg-black/40 px-4 py-3 rounded-xl border border-indigo-500/30 text-white shadow-[0_0_20px_#44006655]">
            📚 <span className="text-indigo-300 font-semibold">Top Subject:</span>{' '}
            <span className="text-pink-400 font-semibold">{summary.topSubject || 'None yet'}</span>
          </div>
        </div>
      )}

      {/* Subject Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.subject}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            className="relative bg-[#140032]/70 border border-pink-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,20,147,0.25)] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-300 text-lg font-semibold mb-1">{stat.subject}</p>
                <p className="text-white text-sm">
                  {stat.completed} of {stat.total} tasks completed
                </p>
              </div>
              <div className="w-20 h-20 relative">
                <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" stroke="#222" strokeWidth="8" fill="none" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(stat.percent / 100) * 163.36} 163.36`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {stat.percent}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Line Chart */}
      <div className="w-full h-96 bg-black/40 border border-indigo-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(99,102,241,0.3)] backdrop-blur-md">
        <ResponsiveContainer width="100%" height="100%">
          <div className="">
            {streakChart.length > 0 ? (
              <StudyStreakChart data={streakChart} />
            ) : (
              <p className="text-white text-center">No streak data available yet.</p>
            )}
          </div>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
