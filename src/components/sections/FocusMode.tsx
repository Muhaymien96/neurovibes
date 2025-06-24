import React, { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { 
  Brain, 
  Mic, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Coffee, 
  Users,
  Volume2,
  VolumeX,
  Bell,
  BellOff,
  Share2,
  Copy,
  UserPlus,
  Eye
} from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useElevenLabsTTS } from '../../hooks/useElevenLabsTTS';
import { useAICoach } from '../../hooks/useAICoach';
import { useAuthStore, useMoodStore, useSettingsStore, useProfileStore } from '../../store';
import { createFocusSession, updateFocusSession, supabase } from '../../lib/supabase';
import { AICoachResponse } from '../AICoachResponse';
import { VoiceControls } from '../ui/VoiceControls';
import { QuickActions } from '../ui/QuickActions';

interface FocusModeProps {
  user: User | null;
}

export const FocusMode: React.FC<FocusModeProps> = ({ user }) => {
  const { user: authUser } = useAuthStore();
  const { entries: moodEntries } = useMoodStore();
  const { notifications } = useSettingsStore();
  const { profile } = useProfileStore();
  
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  
  // Pomodoro Timer State
  const [timerDuration, setTimerDuration] = useState(25); // minutes
  const [breakDuration, setBreakDuration] = useState(5); // minutes
  const [timeLeft, setTimeLeft] = useState(25 * 60); // seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'work' | 'break'>('work');
  const [focusModeActive, setFocusModeActive] = useState(false);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);
  
  // Focus Buddy State
  const [focusBuddyEnabled, setFocusBuddyEnabled] = useState(false);
  const [buddyType, setBuddyType] = useState<'ai' | 'realtime'>('ai');
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [sessionLink, setSessionLink] = useState('');
  const [aiEncouragementInterval, setAiEncouragementInterval] = useState<NodeJS.Timeout | null>(null);
  
  const { 
    isListening, 
    transcript, 
    error: speechError, 
    isSupported: speechSupported, 
    startListening, 
    stopListening 
  } = useSpeechRecognition();
  
  const { 
    speak, 
    stop: stopSpeaking, 
    isSpeaking, 
    loading: ttsLoading,
    error: ttsError 
  } = useElevenLabsTTS();

  const { getCoachingResponse, loading: aiLoading } = useAICoach();

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Timer finished
      setIsTimerRunning(false);
      
      if (currentPhase === 'work') {
        setCurrentPhase('break');
        setTimeLeft(breakDuration * 60);
        speak("Great work! Time for a break.");
      } else {
        setCurrentPhase('work');
        setTimeLeft(timerDuration * 60);
        speak("Break's over! Ready to focus again?");
      }
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, currentPhase, timerDuration, breakDuration, speak]);

  // AI Buddy encouragement effect
  useEffect(() => {
    if (focusBuddyEnabled && buddyType === 'ai' && focusModeActive) {
      const encouragements = [
        "You're doing great! Keep going!",
        "Still here with you. You've got this!",
        "Nice focus! You're making progress.",
        "I believe in you. One step at a time.",
        "You're stronger than you think. Keep pushing!"
      ];
      
      const interval = setInterval(() => {
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        speak(randomEncouragement);
      }, 5 * 60 * 1000); // Every 5 minutes
      
      setAiEncouragementInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    } else {
      if (aiEncouragementInterval) {
        clearInterval(aiEncouragementInterval);
        setAiEncouragementInterval(null);
      }
    }
  }, [focusBuddyEnabled, buddyType, focusModeActive, speak]);

  // Handle completed speech recognition
  useEffect(() => {
    if (transcript && !isListening && transcript !== lastProcessedTranscript) {
      setUserTranscript(transcript);
      setShowTranscript(true);
      setLastProcessedTranscript(transcript);
      handleVoiceInput(transcript);
    }
  }, [transcript, isListening, lastProcessedTranscript]);

  const handleVoiceInput = async (input: string) => {
    if (aiLoading || input === lastProcessedTranscript) {
      return;
    }

    // Check for "I'm stuck" or similar phrases
    const stuckPhrases = ['stuck', 'blocked', 'confused', 'lost', 'overwhelmed'];
    const isStuckRequest = stuckPhrases.some(phrase => input.toLowerCase().includes(phrase));

    // Get current energy level from latest mood entry
    const latestMood = moodEntries[0];
    const energyLevel = latestMood?.energy_level || 5;

    const response = await getCoachingResponse({
      input,
      type: isStuckRequest ? 'reframing_advice' : 'voice_note',
      context: {
        user_id: authUser?.id,
        include_historical_data: true,
        energy_level: energyLevel,
        focus_mode_active: focusModeActive,
        is_stuck_request: isStuckRequest,
        neurodivergent_type: profile?.neurodivergent_type || 'none',
      }
    });

    if (response) {
      setAiResponse(response);
      
      const fullResponse = `${response.coaching_response} ${response.encouragement}`;
      setTimeout(() => {
        if (!isSpeaking && !ttsLoading) {
          speak(fullResponse);
        }
      }, 500);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      if (isSpeaking) {
        stopSpeaking();
      }
      startListening();
      setShowTranscript(false);
      setAiResponse(null);
      setLastProcessedTranscript('');
    }
  };

  const handleQuickAction = async (action: string) => {
    if (aiLoading || ttsLoading || isSpeaking) {
      return;
    }

    const actionTexts = {
      overwhelmed: "I'm feeling overwhelmed and need help organizing my thoughts",
      startTask: "I need help starting a task that feels overwhelming",
      procrastinating: "I'm procrastinating and can't seem to get started",
      breakDown: "I have a big to-do list that needs to be broken down into manageable pieces"
    };

    const input = actionTexts[action as keyof typeof actionTexts] || action;
    
    const response = await getCoachingResponse({
      input,
      type: 'voice_note',
      context: {
        user_id: authUser?.id,
        include_historical_data: true,
        neurodivergent_type: profile?.neurodivergent_type || 'none',
      }
    });

    if (response) {
      setAiResponse(response);
      setUserTranscript('');
      setShowTranscript(false);
      
      const fullResponse = `${response.coaching_response} ${response.encouragement}`;
      setTimeout(() => {
        if (!isSpeaking && !ttsLoading) {
          speak(fullResponse);
        }
      }, 200);
    }
  };

  const startTimer = () => {
    setIsTimerRunning(true);
    setFocusModeActive(true);
    
    // Block notifications if enabled
    if (notifications.smart_reminders) {
      setNotificationsBlocked(true);
    }
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setCurrentPhase('work');
    setTimeLeft(timerDuration * 60);
    setFocusModeActive(false);
    setNotificationsBlocked(false);
  };

  const startRealTimeBuddy = async () => {
    if (!authUser) return;
    
    try {
      const sessionData = {
        current_task: 'Focus session',
        mood: moodEntries[0] ? `${moodEntries[0].mood_score}/10` : 'Unknown',
        timer_state: {
          duration: timerDuration,
          timeLeft,
          isRunning: isTimerRunning,
          phase: currentPhase
        },
        is_active: true
      };
      
      const { data, error } = await createFocusSession(sessionData);
      
      if (error) {
        console.error('Error creating focus session:', error);
        return;
      }
      
      if (data) {
        setCurrentSession(data);
        setSessionLink(`${window.location.origin}/focus-buddy/${data.session_link_uuid}`);
        
        // Set up real-time updates
        const channel = supabase.channel(`focus-session-${data.id}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'focus_sessions',
            filter: `id=eq.${data.id}`
          }, (payload) => {
            console.log('Focus session updated:', payload);
          })
          .subscribe();
      }
    } catch (error) {
      console.error('Error starting real-time buddy:', error);
    }
  };

  const stopRealTimeBuddy = async () => {
    if (currentSession) {
      try {
        await updateFocusSession(currentSession.id, { is_active: false });
        setCurrentSession(null);
        setSessionLink('');
      } catch (error) {
        console.error('Error stopping real-time buddy:', error);
      }
    }
  };

  const copySessionLink = () => {
    navigator.clipboard.writeText(sessionLink);
    // Could add a toast notification here
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getBreakSuggestion = () => {
    const latestMood = moodEntries[0];
    const energyLevel = latestMood?.energy_level || 5;
    
    if (energyLevel <= 3) {
      return Math.max(breakDuration + 5, 10); // Longer break for low energy
    } else if (energyLevel >= 8) {
      return Math.max(breakDuration - 2, 3); // Shorter break for high energy
    }
    return breakDuration;
  };

  const suggestedBreak = getBreakSuggestion();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Focus Mode
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your AI coach powered by Gemini is ready to help. Use the Pomodoro timer to stay focused, 
          or speak naturally about what you're working on.
        </p>
      </div>

      {/* Focus Buddy Toggle */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-purple-900 flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Focus Buddy</span>
          </h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={focusBuddyEnabled}
              onChange={(e) => setFocusBuddyEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>
        
        {focusBuddyEnabled && (
          <div className="space-y-4">
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="buddyType"
                  value="ai"
                  checked={buddyType === 'ai'}
                  onChange={(e) => setBuddyType(e.target.value as 'ai')}
                  className="text-purple-600"
                />
                <span className="text-purple-800">AI Buddy (Encouragement every 5-10 mins)</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="buddyType"
                  value="realtime"
                  checked={buddyType === 'realtime'}
                  onChange={(e) => setBuddyType(e.target.value as 'realtime')}
                  className="text-purple-600"
                />
                <span className="text-purple-800">Real-Time Buddy (Share session)</span>
              </label>
            </div>
            
            {buddyType === 'realtime' && (
              <div className="bg-white/70 p-4 rounded-lg border border-purple-200">
                {!currentSession ? (
                  <button
                    onClick={startRealTimeBuddy}
                    className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Start Shared Session</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-purple-600" />
                      <span className="text-purple-800 font-medium">Session Active</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={sessionLink}
                        readOnly
                        className="flex-grow px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                      />
                      <button
                        onClick={copySessionLink}
                        className="flex items-center space-x-1 bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <button
                      onClick={stopRealTimeBuddy}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      End Session
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pomodoro Timer Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-2xl border border-blue-100">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold text-blue-900 flex items-center justify-center space-x-2">
            <Timer className="h-6 w-6" />
            <span>Focus Timer</span>
          </h3>
          
          {/* Timer Display */}
          <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
            <div className={`text-4xl font-mono font-bold ${
              currentPhase === 'work' ? 'text-blue-600' : 'text-green-600'
            } z-10`}>
              {formatTime(timeLeft)}
            </div>
            <div className="text-lg text-gray-600 mt-12 absolute">
              {currentPhase === 'work' ? 'Focus Time' : 'Break Time'}
            </div>
            
            {/* Progress Ring */}
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-gray-200"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - (timeLeft / ((currentPhase === 'work' ? timerDuration : breakDuration) * 60)))}`}
                className={currentPhase === 'work' ? 'text-blue-500' : 'text-green-500'}
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Timer Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={isTimerRunning ? pauseTimer : startTimer}
              className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                isTimerRunning 
                  ? 'bg-orange-600 text-white hover:bg-orange-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isTimerRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              <span>{isTimerRunning ? 'Pause' : 'Start'}</span>
            </button>
            
            <button
              onClick={resetTimer}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Timer Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-md mx-auto">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Focus Duration: {timerDuration} min
              </label>
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={timerDuration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setTimerDuration(newDuration);
                  if (!isTimerRunning && currentPhase === 'work') {
                    setTimeLeft(newDuration * 60);
                  }
                }}
                disabled={isTimerRunning}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Break Duration: {breakDuration} min
                {suggestedBreak !== breakDuration && (
                  <span className="text-xs text-green-600 ml-2">
                    (Suggested: {suggestedBreak} min)
                  </span>
                )}
              </label>
              <input
                type="range"
                min="3"
                max="15"
                step="1"
                value={breakDuration}
                onChange={(e) => {
                  const newDuration = parseInt(e.target.value);
                  setBreakDuration(newDuration);
                  if (!isTimerRunning && currentPhase === 'break') {
                    setTimeLeft(newDuration * 60);
                  }
                }}
                disabled={isTimerRunning}
                className="w-full"
              />
            </div>
          </div>

          {/* Focus Mode Features */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              {notificationsBlocked ? (
                <BellOff className="h-4 w-4 text-red-600" />
              ) : (
                <Bell className="h-4 w-4 text-gray-400" />
              )}
              <span className={notificationsBlocked ? 'text-red-600' : 'text-gray-600'}>
                {notificationsBlocked ? 'Notifications Blocked' : 'Notifications Active'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Coffee className="h-4 w-4 text-blue-600" />
              <span className="text-blue-600">Break suggestions based on energy</span>
            </div>
            
            {focusBuddyEnabled && (
              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-purple-600">
                  {buddyType === 'ai' ? 'AI Buddy Active' : 'Real-Time Buddy'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Debug Information */}
      {(speechError || ttsError) && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 font-medium">Debug Information</p>
          </div>
          {speechError && (
            <p className="text-red-700 text-sm mb-1">
              <strong>Speech Error:</strong> {speechError}
            </p>
          )}
          {ttsError && (
            <p className="text-red-700 text-sm">
              <strong>TTS Error:</strong> {ttsError}
            </p>
          )}
        </div>
      )}

      {/* Browser Support Warning */}
      {!speechSupported && (
        <div className="max-w-2xl mx-auto mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <p className="text-amber-800 text-sm">
              Voice features require a modern browser like Chrome, Safari, or Edge.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* User Transcript Display */}
        {showTranscript && userTranscript && (
          <div className="w-full max-w-2xl bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">You</span>
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-gray-700">
                  "{userTranscript}"
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Response */}
        {aiResponse ? (
          <div className="w-full max-w-2xl">
            <AICoachResponse response={aiResponse} />
          </div>
        ) : (
          <div className="w-full max-w-2xl bg-indigo-50 p-6 rounded-xl shadow-inner border border-indigo-100">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="flex-grow">
                <p className="text-indigo-800 italic leading-relaxed">
                  Hi! I'm your AI coach powered by Gemini. I'm here to help you focus and break down overwhelming tasks. 
                  Try saying something like "I'm feeling overwhelmed" or "Help me start this project".
                  {focusBuddyEnabled && buddyType === 'ai' && (
                    <span className="block mt-2 text-purple-700">
                      🤝 Focus Buddy is active! I'll check in with encouragement every few minutes.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Voice Input Controls */}
        <VoiceControls
          isListening={isListening}
          speechSupported={speechSupported}
          aiLoading={aiLoading}
          ttsLoading={ttsLoading}
          speechError={speechError}
          onMicClick={handleMicClick}
        />

        {/* Quick Action Buttons */}
        <QuickActions
          onQuickAction={handleQuickAction}
          disabled={aiLoading || ttsLoading || isSpeaking}
        />

        {/* Speech Recognition Status */}
        {isListening && (
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 text-sm font-medium">Recording...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};