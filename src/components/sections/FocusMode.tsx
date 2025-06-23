import React, { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Brain, Mic, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useElevenLabsTTS } from '../../hooks/useElevenLabsTTS';
import { useAICoach } from '../../hooks/useAICoach';
import { AICoachResponse } from '../AICoachResponse';
import { VoiceControls } from '../ui/VoiceControls';
import { QuickActions } from '../ui/QuickActions';

interface FocusModeProps {
  user: User | null;
}

export const FocusMode: React.FC<FocusModeProps> = ({ user }) => {
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [userTranscript, setUserTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState('');
  
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

  // Handle completed speech recognition - prevent duplicate processing
  useEffect(() => {
    console.log('Speech recognition effect triggered:', {
      transcript,
      isListening,
      lastProcessedTranscript,
      transcriptLength: transcript?.length,
      lastProcessedLength: lastProcessedTranscript?.length
    });

    if (transcript && !isListening && transcript !== lastProcessedTranscript) {
      console.log('Processing new transcript:', transcript);
      setUserTranscript(transcript);
      setShowTranscript(true);
      setLastProcessedTranscript(transcript);
      
      // Generate AI response using Gemini
      handleVoiceInput(transcript);
    }
  }, [transcript, isListening, lastProcessedTranscript]);

  const handleVoiceInput = async (input: string) => {
    console.log('handleVoiceInput called with:', input);
    
    // Prevent duplicate processing
    if (aiLoading || input === lastProcessedTranscript) {
      console.log('Skipping voice input processing:', { aiLoading, isDuplicate: input === lastProcessedTranscript });
      return;
    }

    console.log('Getting AI coaching response...');
    const response = await getCoachingResponse({
      input,
      type: 'voice_note',
      context: {
        user_id: user?.id,
        include_historical_data: true,
      }
    });

    if (response) {
      console.log('AI response received:', response);
      setAiResponse(response);
      
      // Speak the response using ElevenLabs with a delay to ensure UI updates first
      const fullResponse = `${response.coaching_response} ${response.encouragement}`;
      setTimeout(() => {
        // Only speak if not already speaking
        if (!isSpeaking && !ttsLoading) {
          console.log('Speaking AI response...');
          speak(fullResponse);
        } else {
          console.log('Skipping TTS - already speaking or loading:', { isSpeaking, ttsLoading });
        }
      }, 500);
    } else {
      console.log('No AI response received');
    }
  };

  const handleMicClick = () => {
    console.log('Mic button clicked');
    console.log('Current state:', { isListening, isSpeaking, ttsLoading, speechSupported });
    
    if (isListening) {
      console.log('Stopping listening...');
      stopListening();
    } else {
      if (isSpeaking) {
        console.log('Stopping current speech...');
        stopSpeaking();
      }
      console.log('Starting listening...');
      startListening();
      setShowTranscript(false);
      setAiResponse(null);
      setLastProcessedTranscript(''); // Reset to allow new processing
    }
  };

  const handleQuickAction = async (action: string) => {
    console.log('Quick action triggered:', action);
    
    // Prevent duplicate calls
    if (aiLoading || ttsLoading || isSpeaking) {
      console.log('Skipping quick action - system busy:', { aiLoading, ttsLoading, isSpeaking });
      return;
    }

    const actionTexts = {
      overwhelmed: "I'm feeling overwhelmed and need help organizing my thoughts",
      startTask: "I need help starting a task that feels overwhelming",
      procrastinating: "I'm procrastinating and can't seem to get started",
      breakDown: "I have a big to-do list that needs to be broken down into manageable pieces"
    };

    const input = actionTexts[action as keyof typeof actionTexts] || action;
    
    console.log('Getting AI response for quick action...');
    const response = await getCoachingResponse({
      input,
      type: 'voice_note',
      context: {
        user_id: user?.id,
        include_historical_data: true,
      }
    });

    if (response) {
      console.log('Quick action AI response received:', response);
      setAiResponse(response);
      setUserTranscript('');
      setShowTranscript(false);
      
      // Speak the response with delay and duplicate check
      const fullResponse = `${response.coaching_response} ${response.encouragement}`;
      setTimeout(() => {
        if (!isSpeaking && !ttsLoading) {
          console.log('Speaking quick action response...');
          speak(fullResponse);
        }
      }, 200);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          AI-Powered Focus Mode
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Your AI coach powered by Gemini is ready to help. Speak naturally about what you're working on, 
          how you're feeling, or what's blocking you.
        </p>
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