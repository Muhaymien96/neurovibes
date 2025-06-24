import React from 'react';
import { User } from '@supabase/supabase-js';
import { FocusMode } from '../sections/FocusMode';
import { BrainDump } from '../BrainDump';
import { TaskManager } from '../TaskManager';
import { MoodTracker } from '../MoodTracker';
import { ProfileSettings } from '../ProfileSettings';
import { HomeHeader } from '../sections/HomeHeader';
import { useMoodStore, useProfileStore } from '../../store';

type ActiveTab = 'focus' | 'tasks' | 'mood' | 'braindump' | 'profile';

interface MainContentProps {
  activeTab: ActiveTab;
  user: User | null;
}

export const MainContent: React.FC<MainContentProps> = ({ activeTab, user }) => {
  const { entries: moodEntries } = useMoodStore();
  const { profile } = useProfileStore();

  return (
    <main className="flex-grow">
      {/* Show HomeHeader for focus tab */}
      {activeTab === 'focus' && (
        <HomeHeader moodEntries={moodEntries} profile={profile} />
      )}
      
      {activeTab === 'focus' && <FocusMode user={user} />}
      {activeTab === 'braindump' && <BrainDump />}
      {activeTab === 'tasks' && <TaskManager />}
      {activeTab === 'mood' && <MoodTracker />}
      {activeTab === 'profile' && <ProfileSettings />}
    </main>
  );
};