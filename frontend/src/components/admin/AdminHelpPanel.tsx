import React from 'react';
import { Lightbulb, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AdminHelpPanel = ({ section, tips = [] }) => {
  const getSectionHelp = (section) => {
    const helpData = {
      dashboard: {
        title: "Dashboard Overview",
        tips: [
          "Monitor real-time student activity and course performance",
          "Big numbers update automatically - no refresh needed",
          "Click any metric to see detailed breakdown",
          "Use 'Quick Actions' for common tasks"
        ]
      },
      courses: {
        title: "Course Management",
        tips: [
          "Drag and drop lessons to reorder them",
          "Use the live preview to see how students will experience your course",
          "Save frequently - auto-save prevents data loss",
          "Publish only when content is complete and tested"
        ]
      },
      users: {
        title: "User Management",
        tips: [
          "Search by name, email, or course enrollment",
          "Bulk actions: Select multiple users for group operations",
          "View progress: Click any user to see their learning journey",
          "Export data: Download user lists for external analysis"
        ]
      },
      grade: {
        title: "Grading Work",
        tips: [
          "Split-screen view: Student work on left, your grading on right",
          "Use keyboard shortcuts: Ctrl+S to save, Tab to navigate",
          "Add detailed feedback - students appreciate it",
          "Grade in batches: Work through queue systematically"
        ]
      },
      payments: {
        title: "Payment Management",
        tips: [
          "Monitor subscription renewals and failed payments",
          "Process refunds within 24 hours for best customer experience",
          "View payment trends to optimize pricing",
          "Export financial reports for accounting"
        ]
      },
      messages: {
        title: "Bulk Messaging",
        tips: [
          "Use templates for common announcements",
          "Target by course, progress level, or custom segments",
          "Schedule messages for optimal delivery times",
          "Track open rates and engagement metrics"
        ]
      },
      reports: {
        title: "Analytics & Reports",
        tips: [
          "Identify drop-off points to improve course flow",
          "Compare quiz performance across different student groups",
          "Export data for advanced analysis in Excel",
          "Set up automated reports for stakeholders"
        ]
      },
      settings: {
        title: "Platform Settings",
        tips: [
          "Changes take effect immediately - test thoroughly",
          "Backup settings before major changes",
          "Some settings affect all users - communicate changes",
          "Use the preview feature to see changes before saving"
        ]
      }
    };

    return helpData[section] || {
      title: "Help & Tips",
      tips: ["Select a section to see specific help and tips"]
    };
  };

  const sectionHelp = getSectionHelp(section);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">{sectionHelp.title}</h3>
        </div>
      </div>

      {/* Tips List */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {sectionHelp.tips.map((tip, index) => (
            <div key={index} className="flex gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700 leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Quick Actions</span>
          </div>
          <div className="space-y-1 text-xs text-blue-800">
            <div>• Press <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+S</kbd> to save</div>
            <div>• Press <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl+Z</kbd> to undo</div>
            <div>• Click <strong>Help</strong> for detailed guides</div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span className="text-gray-600">Auto-save enabled</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span className="text-gray-600">Publish to make changes live</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Full Documentation
        </button>
      </div>
    </div>
  );
};

export default AdminHelpPanel;
