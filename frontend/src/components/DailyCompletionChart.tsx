import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Example data — replace this with real backend data later
const generateDummyData = () => {
  const today = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (29 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tasksCompleted: Math.floor(Math.random() * 5) // Random 0-4
    };
  });
};

const data = generateDummyData();

export default function DailyCompletionChart() {
  return (
    <div className="bg-[#0b001a] p-6 rounded-xl border border-pink-500/40 shadow-[0_0_30px_#ff77e955]">
      <h3 className="text-2xl font-bold text-pink-400 mb-4">📈 Daily Completion Trend</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#6b21a8" />
          <XAxis dataKey="date" tick={{ fill: '#e0e0ff', fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fill: '#e0e0ff' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#120020', borderColor: '#ff77e9', color: '#fff' }}
            labelStyle={{ color: '#fff' }}
          />
          <Line
            type="monotone"
            dataKey="tasksCompleted"
            stroke="#ff77e9"
            strokeWidth={2.5}
            dot={{ r: 4, stroke: '#fff', strokeWidth: 1.5 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
