import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  PieChart, Pie, Cell,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { FiCalendar, FiBarChart2, FiPieChart, FiTrendingUp } from 'react-icons/fi';

const COLORS = ['#4f46e5', '#0ea5e9', '#ef4444'];
const PASTEL_COLORS = ['#818cf8', '#38bdf8', '#fb7185', '#34d399', '#a78bfa', '#f472b6'];

export default function MyProgress({ tasks }) {
  // Date range selector
  const [range, setRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const startDate = useMemo(() => new Date(range.start), [range.start]);
  const endDate = useMemo(() => new Date(range.end), [range.end]);

  // Filter tasks within range
  const rangeTasks = useMemo(() =>
    tasks.filter(t => {
      if (!t.due_date) return true;
      const d = new Date(t.due_date);
      return d >= startDate && d <= endDate;
    }),
    [tasks, startDate, endDate]
  );

  // Compute counts
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
    const pending = rangeTasks.length - done - missed;
    return { done, pending, missed };
  }, [rangeTasks]);

  // Daily breakdown for trend/bar charts
  const dailyData = useMemo(() => {
    const map = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split('T')[0];
      map[key] = { date: key, total: 0, done: 0 };
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
      completionRate: day.total ? Math.round((day.done / day.total) * 100) : 0,
      // Format date for display
      displayDate: new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    }));
  }, [rangeTasks, startDate, endDate]);

  // Prepare pie data
  const pieData = [
    { name: 'Completed', value: done },
    { name: 'Pending', value: pending },
    { name: 'Overdue', value: missed }
  ];

  // Chart type toggle
  const [chartType, setChartType] = useState('pie');

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 px-6 py-8 text-white">
          <h2 className="text-2xl font-bold mb-2">Task Progress Overview</h2>
          <p className="text-indigo-100">Track your productivity and task completion</p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-medium text-indigo-800 mb-1">Completed</h3>
                <p className="text-2xl font-bold text-indigo-900">{done}</p>
              </div>
              <div className="bg-indigo-200 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-medium text-cyan-800 mb-1">Pending</h3>
                <p className="text-2xl font-bold text-cyan-900">{pending}</p>
              </div>
              <div className="bg-cyan-200 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-medium text-red-800 mb-1">Overdue</h3>
                <p className="text-2xl font-bold text-red-900">{missed}</p>
              </div>
              <div className="bg-red-200 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l3.184 5.563c.764 1.36-.203 3.031-1.969 3.031H4.889c-1.766 0-2.733-1.671-1.97-3.032l3.183-5.562zM11.5 7a1 1 0 11-.001-2 1 1 0 01.001 2z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-xl flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-sm font-medium text-gray-800 mb-1">Total</h3>
                <p className="text-2xl font-bold text-gray-900">{rangeTasks.length}</p>
              </div>
              <div className="bg-gray-200 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Date Range and Chart Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiCalendar className="mr-2 text-indigo-600" /> Date Range
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From:</label>
                  <input
                    type="date"
                    value={range.start}
                    onChange={e => setRange(r => ({ ...r, start: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
                  <input
                    type="date"
                    value={range.end}
                    onChange={e => setRange(r => ({ ...r, end: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <FiBarChart2 className="mr-2 text-indigo-600" /> Chart Type
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setChartType('pie')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'pie' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiPieChart className="mr-2" /> Pie
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'line' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiTrendingUp className="mr-2" /> Line
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    chartType === 'bar' 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <FiBarChart2 className="mr-2" /> Bar
                </button>
              </div>
            </div>
          </div>

          {/* Main Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h3>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'pie' && (
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%" outerRadius={120} 
                      fill="#8884d8"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, _, { name }) => `${name}: ${value}`} />
                    <Legend />
                  </PieChart>
                )}
                {chartType === 'line' && (
                  <LineChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={value => `${value}%`} />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="completionRate" 
                      name="Completion Rate" 
                      stroke="#4f46e5" 
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                )}
                {chartType === 'bar' && (
                  <BarChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="displayDate" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total" name="Total Tasks" fill="#0ea5e9" />
                    <Bar dataKey="done" name="Completed" fill="#4f46e5" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Daily Progress Chart */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Progress</h3>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="total" name="Total Tasks" fill="#0ea5e9" />
                  <Bar yAxisId="left" dataKey="done" name="Completed" fill="#4f46e5" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="completionRate"
                    name="Completion Rate (%)"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

MyProgress.propTypes = {
  tasks: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    title: PropTypes.string.isRequired,
    due_date: PropTypes.string,
    is_done: PropTypes.bool,
  })).isRequired,
};