import React from 'react';

interface QuickActionsProps {
  onQuickAction: (action: string) => void;
  disabled: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({ onQuickAction, disabled }) => {
  const actions = [
    { id: 'overwhelmed', label: "I'm feeling overwhelmed", color: 'purple' },
    { id: 'startTask', label: "Help me start this task", color: 'blue' },
    { id: 'procrastinating', label: "I'm procrastinating", color: 'green' },
    { id: 'breakDown', label: "Break down my to-do", color: 'orange' }
  ];

  return (
    <div className="flex flex-wrap gap-3 justify-center">
      {actions.map((action) => (
        <button 
          key={action.id}
          onClick={() => onQuickAction(action.id)}
          disabled={disabled}
          className={`px-4 py-2 bg-${action.color}-100 text-${action.color}-700 rounded-full text-sm font-medium hover:bg-${action.color}-200 transition-colors disabled:opacity-50`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
};