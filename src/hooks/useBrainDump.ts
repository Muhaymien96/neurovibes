import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface BrainDumpEntry {
  id: string;
  content: string;
  type: 'voice' | 'text';
  timestamp: number;
  processed: boolean;
  synced: boolean;
  aiResult?: {
    category: 'action' | 'note' | 'reflection';
    title: string;
    summary: string;
    priority?: 'low' | 'medium' | 'high';
    suggested_actions?: string[];
    tags?: string[];
  };
}

export interface ProcessedResults {
  actions: BrainDumpEntry[];
  notes: BrainDumpEntry[];
  reflections: BrainDumpEntry[];
}

const STORAGE_KEY = 'mindmesh_brain_dumps';

export const useBrainDump = () => {
  const { user, isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<BrainDumpEntry[]>([]);
  const [processing, setProcessing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Load entries from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedEntries = JSON.parse(stored);
        setEntries(parsedEntries);
      } catch (error) {
        console.error('Error loading brain dump entries:', error);
      }
    }
  }, []);

  // Save entries to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-process unprocessed entries when online
  useEffect(() => {
    if (isOnline && isAuthenticated) {
      const unprocessedEntries = entries.filter(entry => !entry.processed);
      if (unprocessedEntries.length > 0) {
        processUnprocessedEntries();
      }
    }
  }, [isOnline, isAuthenticated, entries]);

  const addEntry = useCallback((content: string, type: 'voice' | 'text' = 'text') => {
    const newEntry: BrainDumpEntry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      timestamp: Date.now(),
      processed: false,
      synced: false,
    };

    setEntries(prev => [newEntry, ...prev]);

    // If online and authenticated, process immediately
    if (isOnline && isAuthenticated) {
      processEntry(newEntry);
    }

    return newEntry.id;
  }, [isOnline, isAuthenticated]);

  const processEntry = async (entry: BrainDumpEntry) => {
    if (!isAuthenticated || !isOnline) return;

    setProcessing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-brain-dump`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: entry.content,
            type: entry.type,
            user_id: user?.id,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        
        setEntries(prev => prev.map(e => 
          e.id === entry.id 
            ? { ...e, processed: true, aiResult: result }
            : e
        ));
      }
    } catch (error) {
      console.error('Error processing brain dump entry:', error);
    } finally {
      setProcessing(false);
    }
  };

  const processUnprocessedEntries = async () => {
    if (!isAuthenticated || !isOnline || processing) return;

    const unprocessedEntries = entries.filter(entry => !entry.processed);
    if (unprocessedEntries.length === 0) return;

    setProcessing(true);

    try {
      // Process entries in batches to avoid overwhelming the API
      const batchSize = 3;
      for (let i = 0; i < unprocessedEntries.length; i += batchSize) {
        const batch = unprocessedEntries.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (entry) => {
            try {
              const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-brain-dump`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    content: entry.content,
                    type: entry.type,
                    user_id: user?.id,
                  }),
                }
              );

              if (response.ok) {
                const result = await response.json();
                
                setEntries(prev => prev.map(e => 
                  e.id === entry.id 
                    ? { ...e, processed: true, aiResult: result }
                    : e
                ));
              }
            } catch (error) {
              console.error(`Error processing entry ${entry.id}:`, error);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < unprocessedEntries.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } finally {
      setProcessing(false);
    }
  };

  const syncToCloud = async () => {
    if (!isAuthenticated || !isOnline || syncing) return;

    setSyncing(true);

    try {
      const unsyncedEntries = entries.filter(entry => !entry.synced);
      
      if (unsyncedEntries.length > 0) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-brain-dumps`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              entries: unsyncedEntries,
              user_id: user?.id,
            }),
          }
        );

        if (response.ok) {
          // Mark entries as synced
          setEntries(prev => prev.map(entry => ({ ...entry, synced: true })));
        }
      }
    } catch (error) {
      console.error('Error syncing brain dumps:', error);
    } finally {
      setSyncing(false);
    }
  };

  const deleteEntry = useCallback((entryId: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== entryId));
  }, []);

  const clearAllEntries = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getProcessedResults = useCallback((): ProcessedResults => {
    const processedEntries = entries.filter(entry => entry.processed && entry.aiResult);
    
    return {
      actions: processedEntries.filter(entry => entry.aiResult?.category === 'action'),
      notes: processedEntries.filter(entry => entry.aiResult?.category === 'note'),
      reflections: processedEntries.filter(entry => entry.aiResult?.category === 'reflection'),
    };
  }, [entries]);

  const getStats = useCallback(() => {
    const total = entries.length;
    const processed = entries.filter(entry => entry.processed).length;
    const unsynced = entries.filter(entry => !entry.synced).length;
    
    return {
      total,
      processed,
      unprocessed: total - processed,
      unsynced,
      processingRate: total > 0 ? Math.round((processed / total) * 100) : 0,
    };
  }, [entries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    clearAllEntries,
    processUnprocessedEntries,
    syncToCloud,
    getProcessedResults,
    getStats,
    processing,
    syncing,
    isOnline,
  };
};