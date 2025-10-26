import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CurrentProjectsSection({ modules, selectedCourseId }) {
  const navigate = useNavigate();

  const handleProjectClick = (moduleId) => {
    // Dynamic path construction from data
    const path = `/courses/${selectedCourseId}/modules/${moduleId}`;
    navigate(path);
  };

  return (
    <div className="space-y-4">
      {Array.isArray(modules) && modules.length > 0 ? (
        modules.map((module, index) => {
          const projectId = 103651 + index; // Generate project IDs starting from 103651
          const deadline = new Date();
          deadline.setDate(deadline.getDate() + 1); // Tomorrow
          const timeUntilDeadline = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60)); // Hours

          return (
            <div key={module.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div
                  className="cursor-pointer flex-1"
                  onClick={() => handleProjectClick(module.id)}
                >
                  <h4 className="font-medium text-red-600 hover:text-red-700">
                    {projectId} {module.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    started on Oct 13, 2025 12:00 AM, deadline before {deadline.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })} 12:00 AM (in about {timeUntilDeadline} hours)
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-600 ml-4">0.0% done</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: '0%' }}
                ></div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p>No active projects</p>
          <p className="text-sm mt-1">Select a course to view available projects</p>
        </div>
      )}
    </div>
  );
}
