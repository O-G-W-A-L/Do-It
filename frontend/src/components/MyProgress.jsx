// src/components/MyProgress.jsx
import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid
} from 'recharts';

const COLORS = ['#4ade80','#60a5fa','#f87171']; // Completed, Pending, Overdue

export default function MyProgress({ tasks }) {
  // 1. Date range selector
  const [range, setRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7))
             .toISOString().split('T')[0],
    end:   new Date().toISOString().split('T')[0],
  });

  const startDate = useMemo(() => new Date(range.start), [range.start]);
  const endDate   = useMemo(() => new Date(range.end),   [range.end]);

  // 2. Filter tasks within range
  const rangeTasks = useMemo(() =>
    tasks.filter(t => {
      if (!t.due_date) return true; // include tasks without due date as pending&#8203;:contentReference[oaicite:3]{index=3}
      const d = new Date(t.due_date);
      return d >= startDate && d <= endDate;
    }),
    [tasks, startDate, endDate]
  );

  // 3. Compute counts
  const { done, pending, missed } = useMemo(() => {
    const now = new Date();
    let done = 0, missed = 0;
    rangeTasks.forEach(t => {
      if (t.is_done) done++;
      else {
        // count as missed if overdue
        if (t.due_date && new Date(t.due_date) < now) missed++;
      }
    });
    const pending = rangeTasks.length - done; // all not done tasks :contentReference[oaicite:4]{index=4}
    return { done, pending, missed };
  }, [rangeTasks]);

  // 4. Daily breakdown for trend/bar charts
  const dailyData = useMemo(() => {
    const map = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate()+1)) {
      const key = d.toISOString().split('T')[0];
      map[key] = { date: key, total:0, done:0 };
    }
    rangeTasks.forEach(t => {
      const key = t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : null;
      if (key && map[key]) {
        map[key].total++;
        if (t.is_done) map[key].done++;
      }
    });
    return Object.values(map).map(day => ({
      ...day,
      completionRate: day.total ? Math.round((day.done/day.total)*100) : 0
    }));
  }, [rangeTasks, startDate, endDate]);

  // 5. Prepare pie data
  const pieData = [
    { name:'Completed', value: done },
    { name:'Pending',   value: pending },
    { name:'Overdue',   value: missed }
  ];

  // 6. Chart type toggle
  const [chartType, setChartType] = useState('pie');

  return (
    <div className="p-6 bg-white rounded-lg shadow-md space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm">From:</label>
          <input
            type="date"
            value={range.start}
            onChange={e => setRange(r => ({ ...r, start: e.target.value }))}
            className="p-1 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm">To:</label>
          <input
            type="date"
            value={range.end}
            onChange={e => setRange(r => ({ ...r, end: e.target.value }))}
            className="p-1 border rounded"
          />
        </div>
        <div className="ml-auto space-x-2">
          {['pie','line','bar'].map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-3 py-1 rounded ${
                chartType===t ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Rendering */}
      <div className="flex justify-center">
        {chartType === 'pie' && (
          <PieChart width={300} height={300}>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%" cy="50%" outerRadius={100} label
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip/>
            <Legend />
          </PieChart>
        )}
        {chartType === 'line' && (
          <LineChart width={600} height={300} data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0,100]} />
            <Tooltip />
            <Line type="monotone" dataKey="completionRate" stroke="#82ca9d" />
          </LineChart>
        )}
        {chartType === 'bar' && (
          <BarChart width={600} height={300} data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" fill="#8884d8" />
            <Bar dataKey="done"  fill="#82ca9d" />
          </BarChart>
        )}
      </div>
    </div>
  );
}

MyProgress.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id:       PropTypes.oneOfType([PropTypes.string,PropTypes.number]).isRequired,
    title:    PropTypes.string.isRequired,
    due_date: PropTypes.string,
    is_done:  PropTypes.bool,
  })).isRequired,
};
