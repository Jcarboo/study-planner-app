// src/components/StudyStatsView.tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import StudyStreakChart from '../components/StudyStreakChart';

type SubjectPercent = {
  subject: string;
  percent: number; // 0-100
};

type Summary = {
  longestStreak: number;    // in days
  topSubject: string | null;
};

type StreakPoint = { date: string; count: number };

const COLORS = ['#00f7ff', '#c084fc', '#f472b6', '#4ade80', '#facc15', '#fb7185', '#60a5fa'];

interface Props {
  userId: string; // the profile being viewed
}

export default function StudyStatsView({ userId }: Props) {
  const [subjectPercents, setSubjectPercents] = useState<SubjectPercent[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [streakChart, setStreakChart] = useState<StreakPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        // 1) Subject % rings (public-safe)
        const subjRes = await axios.get<Array<{subject: string; total: number; completed: number; percent: number}>>(
          `https://study-planner-app-123478359200.us-east4.run.app/study/user/${userId}/subject-stats`,
          { withCredentials: true }
        );
        if (!mounted) return;
        setSubjectPercents(
          (subjRes.data || []).map(s => ({
            subject: s.subject,
            percent: Math.max(0, Math.min(100, s.percent ?? 0)),
          }))
        );

        // 2) Summary (public-safe)
        const sumRes = await axios.get<{ longestStreak: number; weeklyCount?: number; topSubject: string | null }>(
          `https://study-planner-app-123478359200.us-east4.run.app/study/user/${userId}/stats/summary`,
          { withCredentials: true }
        );
        if (!mounted) return;
        setSummary({
          longestStreak: sumRes.data?.longestStreak ?? 0,
          topSubject: sumRes.data?.topSubject ?? null,
        });

        // 3) Streak chart (public-safe)
        const streakRes = await axios.get<StreakPoint[]>(
          `https://study-planner-app-123478359200.us-east4.run.app/study/user/${userId}/task-completions/daily`,
          { withCredentials: true }
        );
        if (!mounted) return;
        setStreakChart(streakRes.data || []);
      } catch (e) {
        console.error('Failed to load public stats', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return (
      <div className="w-full mt-16 px-4 md:px-12 lg:px-20">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.15rem_#ff77e9] mb-8">
          📊 Study Stats
        </h2>
        <p className="text-white/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-16 px-4 md:px-12 lg:px-20">
      <h2 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-indigo-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_0.15rem_#ff77e9] mb-8">
        📊 Study Stats
      </h2>

      {/* Summary Row (privacy-friendly) */}
      {summary && (
        <div className="flex flex-wrap gap-6 mb-10">
          <div className="bg-black/40 px-4 py-3 rounded-xl border border-indigo-500/30 text-white shadow-[0_0_20px_#44006655]">
            🌟 <span className="text-indigo-300 font-semibold">Longest Streak:</span>{' '}
            <span className="text-pink-400 font-semibold">{summary.longestStreak} days</span>
          </div>
          <div className="bg-black/40 px-4 py-3 rounded-xl border border-indigo-500/30 text-white shadow-[0_0_20px_#44006655]">
            📚 <span className="text-indigo-300 font-semibold">Top Subject:</span>{' '}
            <span className="text-pink-400 font-semibold">{summary.topSubject || '—'}</span>
          </div>
        </div>
      )}

      {/* Subject Percent Rings (no raw counts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
        {subjectPercents.map((stat, index) => (
          <motion.div
            key={stat.subject}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.35 }}
            className="relative bg-[#140032]/70 border border-pink-500/40 rounded-2xl p-6 shadow-[0_0_30px_rgba(255,20,147,0.25)] backdrop-blur"
          >
            <div className="flex items-center justify-between">
              <p className="text-indigo-300 text-lg font-semibold">{stat.subject}</p>
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
                  {Math.round(stat.percent)}%
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Streak Line Chart */}
      <div className="w-full h-96 bg-black/40 border border-indigo-500/40 rounded-xl p-6 shadow-[0_0_25px_rgba(99,102,241,0.3)] backdrop-blur-md">
        <ResponsiveContainer width="100%" height="100%">
          <div className="">
            {streakChart.length > 0 ? (
              <StudyStreakChart data={streakChart} />
            ) : (
              <p className="text-white/80 text-center">No public streak data available.</p>
            )}
          </div>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
