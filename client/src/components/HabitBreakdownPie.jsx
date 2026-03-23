import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const COLORS = {
  focus: '#10b981',
  distraction: '#ef4444',
  default: '#8b5cf6',
};

const HabitBreakdownPie = ({ selectedDate, habits = [] }) => {
  const [hoveredHabit, setHoveredHabit] = useState(null);

  if (!habits || habits.length === 0) {
    return (
       <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        <p>No habit data for selected date</p>
         <p className="text-sm text-slate-500 dark:text-slate-500 mt-2">Click a bar to view habit breakdown</p>
      </div>
    );
  }

  const pieData = habits.map((habit) => ({
    name: habit.name,
    value: Math.round((habit.timeSpent || 0) / 60),
    type: habit.type,
    originalValue: habit.timeSpent,
  }));

  const validData = pieData.filter((item) => item.value > 0);

  if (validData.length === 0) {
    return (
       <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center text-slate-600 dark:text-slate-400">
        <p>No tracked habits on this date</p>
      </div>
    );
  }

  return (
   <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <h4 className="text-slate-900 dark:text-slate-200 font-semibold mb-4">
        Habit Breakdown {selectedDate ? `for ${selectedDate}` : ''}
      </h4>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={validData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}m`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            onMouseEnter={(_, index) => setHoveredHabit(index)}
            onMouseLeave={() => setHoveredHabit(null)}
          >
            {validData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.type === 'focus' ? COLORS.focus : COLORS.distraction}
                opacity={hoveredHabit === null || hoveredHabit === index ? 1 : 0.5}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#e2e8f0',
            }}
            formatter={(value) => [`${value} minutes`, 'Time']}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
           <tr className="border-b border-slate-300 dark:border-slate-700">
             <th className="text-left text-slate-700 dark:text-slate-300 py-2 px-3 font-semibold">Habit</th>
             <th className="text-left text-slate-700 dark:text-slate-300 py-2 px-3 font-semibold">Type</th>
             <th className="text-right text-slate-700 dark:text-slate-300 py-2 px-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {validData.map((item, index) => (
              <tr
                key={index}
                 className={`border-b border-slate-200/50 dark:border-slate-700/50 transition-colors ${
                   hoveredHabit === index ? 'bg-slate-200/50 dark:bg-slate-700/50' : ''
                }`}
                onMouseEnter={() => setHoveredHabit(index)}
                onMouseLeave={() => setHoveredHabit(null)}
              >
                 <td className="py-2 px-3 text-slate-900 dark:text-slate-200">{item.name}</td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                      item.type === 'focus'
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
                    }`}
                  >
                    {item.type === 'focus' ? 'Focus' : 'Distraction'}
                  </span>
                </td>
                <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300 font-mono">
                  {item.value}m
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HabitBreakdownPie;
