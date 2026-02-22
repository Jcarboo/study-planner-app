import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

type StudyPlanFormProps = {
  onPlanCreated: () => void;
};

export default function StudyPlanForm({ onPlanCreated }: StudyPlanFormProps) {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState<string[]>([]);
  const [aiNotes, setAiNotes] = useState(''); // <-- new
  const [aiLoading, setAiLoading] = useState(false); // <-- new

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const taskObjs = tasks.map((t) => ({ name: t, done: false }));
      await axios.post('https://study-planner-app-123478359200.us-east4.run.app/study/create', {
        title,
        subject,
        deadline,
        tasks: taskObjs,
      }, { withCredentials: true });

      onPlanCreated();
      setTitle(''); setSubject(''); setDeadline(''); setTasks([]); setAiNotes('');
    } catch (err) {
      console.error('Error creating study plan', err);
      alert('Failed to create plan.');
    }
  };

  const runAIBreakdown = async () => {
    if (!title) {
      alert('Please enter a title first.');
      return;
    }
    try {
      setAiLoading(true);
      const res = await axios.post('https://study-planner-app-123478359200.us-east4.run.app/ai/breakdown', {
        title,
        subject,
        notes: aiNotes,
        max_items: 6
      }, { withCredentials: true });

      const aiTasks: { name: string; done: boolean }[] = res.data?.tasks || [];
      if (aiTasks.length === 0) {
        alert('AI did not return any tasks. Try adding more notes.');
        return;
      }
      setTasks(aiTasks.map(t => t.name));
    } catch (e) {
      console.error(e);
      alert('AI breakdown failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const removeTaskAt = (i: number) =>
    setTasks(prev => prev.filter((_, idx) => idx !== i));

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onSubmit={handleSubmit}
      className=""
    >
      <div className="bg-gradient-to-r from-purple-900/80 via-indigo-800/80 to-purple-900/80 p-6 rounded-xl shadow-xl border border-purple-500/30">
        <h2 className="text-3xl font-heading text-pink-400 mb-6 drop-shadow-[0_0_0.45rem_#f0f] text-center">
          Create a Study Plan
        </h2>

        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            required
            className="w-full p-3 rounded-md bg-black/70 text-white placeholder-pink-300 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (e.g., CMSC421)"
            required
            className="w-full p-3 rounded-md bg-black/70 text-white placeholder-pink-300 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className="w-full p-3 rounded-md bg-black/70 text-white border border-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          />

          {/* Notes for AI (optional) */}
          <textarea
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="Optional: add notes for AI (topics covered, scope, grading weight, etc.)"
            rows={3}
            className="w-full p-3 rounded-md bg-black/70 text-white placeholder-pink-300 border border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {/* AI Breakdown button */}
          <button
            type="button"
            onClick={runAIBreakdown}
            disabled={aiLoading}
            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-md hover:drop-shadow-[0_0_0.35rem_#0ff]"
          >
            {aiLoading ? 'Thinking…' : '💡 Break Down with AI'}
          </button>

          {/* Generated / manual tasks */}
          {tasks.map((task, i) => (
            <div key={i} className="relative">
              <input
                value={task}
                onChange={(e) => {
                  const copy = [...tasks];
                  copy[i] = e.target.value;
                  setTasks(copy);
                }}
                placeholder={`Task ${i + 1}`}
                required
                className="w-full p-3 pr-10 rounded-md bg-black/70 text-white placeholder-pink-300 border border-purple-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
              {/* little X to remove */}
              <button
                type="button"
                onClick={() => removeTaskAt(i)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-300 hover:text-pink-200"
                aria-label="Remove task"
                title="Remove task"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTasks(prev => [...prev, ''])}
              className="bg-pink-600 hover:bg-pink-500 text-white font-bold py-2 px-4 rounded-full transition-all duration-300 shadow-md hover:drop-shadow-[0_0_0.3rem_#f0f]"
            >
              + Add Task
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-6 rounded-full transition-all duration-300 shadow-md hover:drop-shadow-[0_0_0.3rem_#0ff]"
            >
              Create
            </button>
          </div>
        </div>
      </div>
    </motion.form>
  );
}
