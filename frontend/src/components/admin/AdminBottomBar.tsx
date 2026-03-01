import React from 'react';
import { Save, Upload, Undo, CheckCircle } from 'lucide-react';
import Button from '../ui/Button';

const AdminBottomBar = ({
  onSave,
  onPublish,
  onUndo,
  hasUnsavedChanges,
  isPublishing,
  lastSaved
}) => {
  return (
    <div className="fixed bottom-0 left-64 right-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between z-40">
      {/* Left side - Status */}
      <div className="flex items-center gap-4">
        {hasUnsavedChanges ? (
          <div className="flex items-center gap-2 text-amber-600">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
            <span className="text-sm font-medium">Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">All changes saved</span>
          </div>
        )}

        {lastSaved && (
          <span className="text-xs text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          onClick={onUndo}
          disabled={!hasUnsavedChanges}
          icon={Undo}
          className="text-gray-600"
        >
          Undo Changes
        </Button>

        <Button
          onClick={onSave}
          disabled={!hasUnsavedChanges}
          icon={Save}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Save All
        </Button>

        <Button
          onClick={onPublish}
          loading={isPublishing}
          icon={Upload}
          className="bg-green-600 hover:bg-green-700"
        >
          {isPublishing ? 'Publishing...' : 'Publish Changes'}
        </Button>
      </div>
    </div>
  );
};

export default AdminBottomBar;
