import React from 'react';
import { User } from '@supabase/supabase-js';
import { FocusMode } from '../sections/FocusMode';
import { BrainDump } from '../BrainDump';
import { TaskManager } from '../TaskManager';
import { MoodTracker } from '../MoodTracker';
import { ProfileSettings } from '../ProfileSettings';

type ActiveTab = 'focus' | 'tasks' | 'mood' | 'braindump' | 'profile';

interface MainContentProps {
  activeTab: ActiveTab;
  user: User | null;
}

export const MainContent: React.FC<MainContentProps> = ({ activeTab, user }) => {
  return (
    <main className="flex-grow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'focus' && <FocusMode user={user} />}
        {activeTab === 'braindump' && <BrainDump />}
        {activeTab === 'tasks' && <TaskManager />}
        {activeTab === 'mood' && <MoodTracker />}
        {activeTab === 'profile' && <ProfileSettings />}
      </div>
    </main>
  );
};