import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

type StudyPlanListProps = {
  refresh: boolean;
};

type Task = {
  name: string;
  done: boolean;
};

type StudyPlan = {
  _id: string;
  title: string;
  subject: string;
  deadline: string;
  tasks: Task[];
  featured?: boolean; // <-- new
};

const FEATURE_OFF =
  'https://png.pngtree.com/png-vector/20220613/ourmid/pngtree-isolated-gray-star-icon-png-image_5064292.png';
const FEATURE_ON =
  'https://i.pinimg.com/originals/25/80/e2/2580e21fcf640ef972e85c088a7f97ca.gif';

export default function StudyPlanList({ refresh }: StudyPlanListProps) {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [newTasks, setNewTasks] = useState<{ [planId: string]: string }>({});

  const fetchPlans = async () => {
    try {
      const res = await axios.get('https://study-planner-backend-xjed.onrender.com/study/all', {
        withCredentials: true,
      });
      setPlans(res.data);
    } catch (err) {
      console.error('Error fetching study plans', err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [refresh]);

  const deletePlan = async (planId: string) => {
    const confirm = window.confirm(
      'Are you sure you want to delete this study plan?'
    );
    if (!confirm) return;
    try {
      await axios.delete(`https://study-planner-backend-xjed.onrender.com/study/${planId}`, {
        withCredentials: true,
      });
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete plan', err);
    }
  };

  const deleteTask = async (planId: string, taskName: string) => {
    try {
      await axios.post(
        `https://study-planner-backend-xjed.onrender.com/study/${planId}/delete-task`,
        { task_name: taskName },
        { withCredentials: true }
      );
      fetchPlans();
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const addTask = async (planId: string) => {
    try {
      await axios.post(
        `https://study-planner-backend-xjed.onrender.com/study/${planId}/add-task`,
        { task_name: newTasks[planId] || '' },
        { withCredentials: true }
      );
      setNewTasks((prev) => ({ ...prev, [planId]: '' }));
      fetchPlans();
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const toggleTaskDone = async (
    planId: string,
    taskName: string,
    currentDone: boolean
  ) => {
    try {
      await axios.post(
        `https://study-planner-backend-xjed.onrender.com/study/${planId}/toggle-task`,
        { task_name: taskName, done: !currentDone },
        { withCredentials: true }
      );
      fetchPlans();
    } catch (err) {
      console.error('Failed to toggle task status', err);
    }
  };

  const toggleFeatured = async (planId: string, current: boolean | undefined) => {
    try {
      await axios.post(
        `https://study-planner-backend-xjed.onrender.com/study/${planId}/feature`,
        { featured: !current },
        { withCredentials: true }
      );
      fetchPlans();
    } catch (err) {
      console.error('Failed to toggle featured', err);
    }
  };

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {plans.map((plan, index) => (
          <motion.div
            key={plan._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="relative bg-[#120020]/80 border border-pink-600 rounded-lg p-6 shadow-md backdrop-blur-md text-white"
          >
            {/* ⭐ Feature toggle button */}
            <button
              title={plan.featured ? 'Unfeature this plan' : 'Feature this plan'}
              onClick={() => toggleFeatured(plan._id, plan.featured)}
              className="absolute top-3 right-3 rounded-full ring-2 ring-pink-500/40 hover:ring-pink-400/60 transition"
            >
              <img
                src={plan.featured ? FEATURE_ON : FEATURE_OFF}
                alt={plan.featured ? 'Featured' : 'Not featured'}
                className="w-10 h-10 rounded-full object-cover"
              />
            </button>

            <h3 className="text-xl font-bold text-pink-300 font-heading">
              {plan.title}
            </h3>
            <p className="text-sm text-gray-300 font-body">
              Subject: {plan.subject}
            </p>
            <p className="text-sm text-gray-300 mb-2 font-body">
              Deadline: {plan.deadline}
            </p>

            <button
              onClick={() => deletePlan(plan._id)}
              className="text-red-400 hover:text-red-600 text-sm mb-3"
            >
              Delete Plan
            </button>

            <ul className="space-y-1">
              {plan.tasks.map((task, i) => (
                <motion.li
                  key={i}
                  layout
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between bg-black/50 p-2 rounded-md"
                >
                  <span
                    className={`flex-1 ${
                      task.done ? 'line-through text-gray-400' : ''
                    }`}
                  >
                    {task.name}
                  </span>
                  <div className="flex gap-2">
                    <motion.button
                      whileTap={{ scale: 1.2 }}
                      onClick={() =>
                        toggleTaskDone(plan._id, task.name, task.done)
                      }
                      className="hover:text-green-400"
                      title="Toggle complete"
                    >
                      {task.done ? '↻' : '✅'}
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 1.2 }}
                      onClick={() => deleteTask(plan._id, task.name)}
                      className="hover:text-red-400"
                      title="Delete task"
                    >
                      🗑️
                    </motion.button>
                  </div>
                </motion.li>
              ))}
            </ul>

            <div className="mt-3 flex gap-2">
              <input
                onChange={(e) =>
                  setNewTasks((prev) => ({
                    ...prev,
                    [plan._id]: e.target.value,
                  }))
                }
                value={newTasks[plan._id] || ''}
                placeholder="New task"
                className="bg-black/60 text-white px-2 py-1 rounded-md w-full"
              />
              <button
                onClick={() => addTask(plan._id)}
                className="bg-pink-600 px-3 py-1 rounded-md hover:bg-pink-700"
              >
                Add
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
