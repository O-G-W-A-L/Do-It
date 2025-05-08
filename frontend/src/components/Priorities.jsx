import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import TaskCard from './TaskCard';

export default function Priorities({ tasks, onSelectTask }) {
  const [openSections, setOpenSections] = useState({
    ongoing: true,
    completed: true
  });

  const today = new Date().toISOString().split('T')[0];

  // Group tasks into Ongoing and Completed/Expired sections
  const ongoingTasks = tasks.filter(task => 
    (!task.completed && (task.due_date ? task.due_date >= today : true))
  );

  const completedTasks = tasks.filter(task => 
    task.completed || (task.due_date && task.due_date < today)
  );

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Priority colors for visual distinction
  const priorityColors = {
    'Must Do': 'from-red-600 to-red-500',
    'Should Do': 'from-yellow-600 to-yellow-500',
    'Could Do': 'from-blue-600 to-blue-500',
    'Might Do': 'from-gray-600 to-gray-500'
  };

  return (
    <div className="space-y-8 w-full max-w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 to-cyan-700 rounded-2xl shadow-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Task Priorities</h2>
        <p className="text-indigo-100">
          Organize your tasks by importance and urgency
        </p>
      </div>
      
      {/* Ongoing Tasks Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <button
          className="w-full p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 flex justify-between items-center font-semibold text-gray-800 hover:from-indigo-100 hover:to-cyan-100 transition-colors"
          onClick={() => toggleSection('ongoing')}
        >
          <span className="text-lg">Ongoing Tasks</span>
          <span className="text-indigo-700">
            {openSections.ongoing ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>
        
        {openSections.ongoing && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['Must Do', 'Should Do', 'Could Do', 'Might Do'].map(priority => {
                const priorityTasks = ongoingTasks.filter(task => task.priority === priority);
                return (
                  <div key={priority} className="rounded-xl overflow-hidden shadow-md">
                    <div className={`bg-gradient-to-r ${priorityColors[priority]} p-3 text-white`}>
                      <h3 className="font-semibold">{priority}</h3>
                    </div>
                    <div className="bg-white p-4">
                      {priorityTasks.length > 0 ? (
                        <ul className="space-y-3">
                          {priorityTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => onSelectTask(task)}
                            />
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-400 py-4 text-center">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Completed/Expired Tasks Section */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <button
          className="w-full p-4 bg-gradient-to-r from-indigo-50 to-cyan-50 flex justify-between items-center font-semibold text-gray-800 hover:from-indigo-100 hover:to-cyan-100 transition-colors"
          onClick={() => toggleSection('completed')}
        >
          <span className="text-lg">Completed/Expired Tasks</span>
          <span className="text-indigo-700">
            {openSections.completed ? <FiChevronUp /> : <FiChevronDown />}
          </span>
        </button>
        
        {openSections.completed && (
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['Must Do', 'Should Do', 'Could Do', 'Might Do'].map(priority => {
                const priorityTasks = completedTasks.filter(task => task.priority === priority);
                return (
                  <div key={priority} className="rounded-xl overflow-hidden shadow-md">
                    <div className={`bg-gradient-to-r ${priorityColors[priority]} p-3 text-white bg-opacity-70`}>
                      <h3 className="font-semibold">{priority}</h3>
                    </div>
                    <div className="bg-white p-4">
                      {priorityTasks.length > 0 ? (
                        <ul className="space-y-3">
                          {priorityTasks.map(task => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onClick={() => onSelectTask(task)}
                            />
                          ))}
                        </ul>
                      ) : (
                        <div className="text-gray-400 py-4 text-center">No tasks</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Priorities.propTypes = {
  tasks: PropTypes.array.isRequired,
  onSelectTask: PropTypes.func.isRequired
};