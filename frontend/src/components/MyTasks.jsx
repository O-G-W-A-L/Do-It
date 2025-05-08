import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FiPlusCircle, FiCheck, FiCalendar, FiFlag, FiTag, FiChevronDown, FiChevronUp, FiFilter } from 'react-icons/fi';
import TaskCard from './TaskCard';

export default function MyTasks({
  tasks,
  onAddTask,
  onSelectTask,
  onEdit,
  onDelete,
  onToggleComplete,
  onSetTimer,
  onSetAlarm,
  onSetReminder,
  onMakeRoutine,
  onSpecificDate,
}) {
  const [isAddOpen, setAddOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '', due_date: '', priority: 'Should Do', type: 'Personal'
  });
  const [openSections, setOpenSections] = useState({
    ongoing: true,
    completed: true
  });
  const [completedGroupBy, setCompletedGroupBy] = useState('date');

  const today = new Date().toISOString().split('T')[0];

  // Group tasks into Ongoing and Completed/Expired sections
  const ongoingTasks = useMemo(() => {
    return tasks.filter(task => 
      !task.completed && (task.due_date ? task.due_date >= today : true)
    );
  }, [tasks, today]);

  const completedTasks = useMemo(() => {
    return tasks.filter(task => 
      task.completed || (task.due_date && task.due_date < today)
    );
  }, [tasks, today]);

  // Group completed tasks by date or type
  const groupedCompletedTasks = useMemo(() => {
    if (completedGroupBy === 'date') {
      return completedTasks.reduce((groups, task) => {
        const date = task.due_date || 'No Date';
        if (!groups[date]) groups[date] = [];
        groups[date].push(task);
        return groups;
      }, {});
    } else {
      return completedTasks.reduce((groups, task) => {
        const type = task.type || 'Uncategorized';
        if (!groups[type]) groups[type] = [];
        groups[type].push(task);
        return groups;
      }, {});
    }
  }, [completedTasks, completedGroupBy]);

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    if (!newTask.title.trim()) return;
    onAddTask(newTask);
    setNewTask({ title: '', due_date: '', priority: 'Should Do', type: 'Personal' });
    setAddOpen(false);
  };

  // Get today's date in YYYY-MM-DD format for the date input
  const todayFormatted = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Format date for display
  const formatDate = (dateStr) => {
    if (dateStr === 'No Date') return 'No Due Date';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8 w-full px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">My Tasks</h2>
        <p className="text-indigo-100">
          Manage all your tasks in one place
        </p>
      </div>
      
      {/* Add Task Panel */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50 px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">
            {isAddOpen ? 'Add New Task' : 'Quick Add'}
          </h3>
          <button
            onClick={() => setAddOpen(o => !o)}
            className="text-indigo-700 hover:text-indigo-900 focus:outline-none transition-colors"
          >
            {isAddOpen ? (
              <span className="flex items-center gap-1">Hide</span>
            ) : (
              <span className="flex items-center gap-1">
                <FiPlusCircle className="w-5 h-5" /> Add Task
              </span>
            )}
          </button>
        </div>
        
        {isAddOpen && (
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Task Title</label>
              <input
                type="text"
                name="title"
                placeholder="What needs to be done?"
                value={newTask.title}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiCalendar className="mr-1 text-indigo-600" /> Due Date
                </label>
                <input
                  type="date"
                  name="due_date"
                  value={newTask.due_date}
                  onChange={handleChange}
                  min={todayFormatted}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiFlag className="mr-1 text-indigo-600" /> Priority
                </label>
                <select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {['Must Do', 'Should Do', 'Could Do', 'Might Do'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 flex items-center">
                  <FiTag className="mr-1 text-indigo-600" /> Category
                </label>
                <select
                  name="type"
                  value={newTask.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {['Personal', 'Work', 'Routine'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center"
              >
                <FiCheck className="mr-1" /> Add Task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ongoing Tasks Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <button
          className="w-full p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 flex justify-between items-center font-semibold text-gray-800 hover:from-indigo-100 hover:to-cyan-100 transition-colors"
          onClick={() => toggleSection('ongoing')}
        >
          <span className="text-lg">Ongoing Tasks ({ongoingTasks.length})</span>
          <span className="text-indigo-700">
            {openSections.ongoing ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>
        
        {openSections.ongoing && (
          <div className="p-4">
            {ongoingTasks.length > 0 ? (
              <ul className="space-y-3">
                {ongoingTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={onSelectTask}
                    onEdit={() => onEdit(task.id)}
                    onDelete={() => onDelete(task.id)}
                    onToggleComplete={() => onToggleComplete(task.id)}
                    onSetTimer={minutes => onSetTimer(task.id, minutes)}
                    onSetAlarm={dt => onSetAlarm(task.id, dt)}
                    onSetReminder={dt => onSetReminder(task.id, dt)}
                    onMakeRoutine={() => onMakeRoutine(task.id)}
                    onSpecificDate={date => onSpecificDate(task.id, date)}
                  />
                ))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCheck className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-gray-500">No ongoing tasks</p>
                <button 
                  onClick={() => setAddOpen(true)}
                  className="mt-4 px-4 py-2 text-sm text-indigo-700 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  Create a new task
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completed/Expired Tasks Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-50 to-cyan-50">
          <button
            className="w-full p-4 flex justify-between items-center font-semibold text-gray-800 hover:from-indigo-100 hover:to-cyan-100 transition-colors"
            onClick={() => toggleSection('completed')}
          >
            <span className="text-lg">Completed/Expired Tasks ({completedTasks.length})</span>
            <span className="text-indigo-700">
              {openSections.completed ? <FiChevronUp /> : <FiChevronDown />}
            </span>
          </button>
          
          {openSections.completed && completedTasks.length > 0 && (
            <div className="px-4 pb-2 flex items-center justify-end gap-2">
              <span className="text-sm text-gray-600 flex items-center">
                <FiFilter className="mr-1" /> Group by:
              </span>
              <button
                onClick={() => setCompletedGroupBy('date')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  completedGroupBy === 'date' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Date
              </button>
              <button
                onClick={() => setCompletedGroupBy('type')}
                className={`px-3 py-1 text-sm rounded-lg ${
                  completedGroupBy === 'type' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Category
              </button>
            </div>
          )}
        </div>
        
        {openSections.completed && (
          <div className="p-4">
            {completedTasks.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedCompletedTasks).map(([group, groupTasks]) => (
                  <div key={group} className="space-y-2">
                    <h3 className="font-medium text-gray-700 border-b pb-1">
                      {completedGroupBy === 'date' ? formatDate(group) : group}
                    </h3>
                    <ul className="space-y-3">
                      {groupTasks.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          onClick={onSelectTask}
                          onEdit={() => onEdit(task.id)}
                          onDelete={() => onDelete(task.id)}
                          onToggleComplete={() => onToggleComplete(task.id)}
                          onSetTimer={minutes => onSetTimer(task.id, minutes)}
                          onSetAlarm={dt => onSetAlarm(task.id, dt)}
                          onSetReminder={dt => onSetReminder(task.id, dt)}
                          onMakeRoutine={() => onMakeRoutine(task.id)}
                          onSpecificDate={date => onSpecificDate(task.id, date)}
                        />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No completed or expired tasks
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

MyTasks.propTypes = {
  tasks: PropTypes.array.isRequired,
  onAddTask: PropTypes.func.isRequired,
  onSelectTask: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleComplete: PropTypes.func.isRequired,
  onMakeRoutine: PropTypes.func.isRequired,
  onSetTimer: PropTypes.func.isRequired,
  onSetAlarm: PropTypes.func.isRequired,
  onSetReminder: PropTypes.func.isRequired,
  onSpecificDate: PropTypes.func.isRequired,
};