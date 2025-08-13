// components/StudyStreakChart.tsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

interface Props {
  data: { date: string; count: number }[];
}

export default function StudyStreakChart({ data }: Props) {
  return (
    <div className="bg-[#1a001f]/60 p-6 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_#8800ff44] backdrop-blur-md">
      <h3 className="text-lg font-semibold text-pink-400 mb-4 drop-shadow-[0_0_0.3rem_#ff00ccaa]">
        Daily Task Completion Streak (30 Days)
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid stroke="#301038" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fill: "#bbb", fontSize: 11 }} />
          <YAxis tick={{ fill: "#bbb", fontSize: 12 }} />
          <Tooltip contentStyle={{ backgroundColor: "#220022", borderColor: "#550088", color: "#fff" }} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ff00cc"
            strokeWidth={2}
            dot={{ r: 3, stroke: "#ff77e9", strokeWidth: 1 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
