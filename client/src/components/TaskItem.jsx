import React from 'react';
import { Trash2, Edit2, CheckCircle, Clock } from 'lucide-react';

const TaskItem = ({ task, onUpdateStatus, onDelete, onEdit }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-orange-600';
      default: return 'text-green-600';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
            {task.title}
          </h3>
          <div className="flex gap-2 mt-1 items-center">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusStyle(task.status)}`}>
              {task.status.replace('_', ' ')}
            </span>
            <span className={`text-xs font-semibold uppercase ${getPriorityStyle(task.priority)}`}>
              {task.priority}
            </span>
          </div>
        </div>
        <div className="flex gap-1 ml-4">
          <button
            onClick={() => onUpdateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
            title={task.status === 'completed' ? 'Mark as Pending' : 'Mark as Completed'}
            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
          >
            <CheckCircle className="w-5 h-5" />
          </button>
          <button
            onClick={() => onEdit(task)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => { if(window.confirm('Are you sure you want to delete this task?')) onDelete(task.id) }}
            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      {task.description && (
        <p className="text-gray-600 text-sm mt-2">{task.description}</p>
      )}
      <div className="mt-3 flex items-center text-xs text-gray-400">
        <Clock className="w-3 h-3 mr-1" />
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default TaskItem;
