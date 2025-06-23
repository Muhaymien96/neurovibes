import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceControlsProps {
  isListening: boolean;
  speechSupported: boolean;
  aiLoading: boolean;
  ttsLoading: boolean;
  speechError: string | null;
  onMicClick: () => void;
}

export const VoiceControls: React.FC<VoiceControlsProps> = ({
  isListening,
  speechSupported,
  aiLoading,
  ttsLoading,
  speechError,
  onMicClick
}) => {
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={onMicClick}
        disabled={!speechSupported || aiLoading || ttsLoading}
        className={`p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
          !speechSupported || aiLoading || ttsLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : isListening 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : 'bg-indigo-600 hover:bg-indigo-700'
        } text-white`}
        title={
          !speechSupported 
            ? 'Voice input not supported' 
            : aiLoading || ttsLoading
            ? 'AI is processing...'
            : isListening 
            ? 'Stop listening' 
            : 'Start voice input'
        }
      >
        <Mic className="h-8 w-8" />
      </button>
      <div className="text-center">
        <p className="text-sm text-gray-500">
          {speechError 
            ? `Error: ${speechError}`
            : aiLoading || ttsLoading
            ? 'AI is thinking...'
            : isListening 
            ? 'Listening... speak now' 
            : speechSupported 
            ? 'Tap to speak with your AI coach'
            : 'Voice input not available'
          }
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Try: "I'm feeling overwhelmed" or "Help me focus"
        </p>
      </div>
    </div>
  );
};