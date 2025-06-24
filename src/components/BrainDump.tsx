import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Mic, 
  Type, 
  Send, 
  Trash2,
  X
} from 'lucide-react';
import { useBrainDump } from '../hooks/useBrainDump';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

export const BrainDump: React.FC = () => {
  const {
    entries,
    addEntry,
    deleteEntry,
    clearAllEntries,
  } = useBrainDump();

  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: speechSupported,
  } = useSpeechRecognition();

  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [textInput, setTextInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle voice input completion
  useEffect(() => {
    if (transcript && !isListening && inputMode === 'voice') {
      addEntry(transcript, 'voice');
      // Clear transcript after adding
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.value = '';
        }
      }, 100);
    }
  }, [transcript, isListening, inputMode, addEntry]);

  const handleTextSubmit = () => {
    if (textInput.trim()) {
      addEntry(textInput.trim(), 'text');
      setTextInput('');
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleTextSubmit();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Brain Dump</h3>
            <p className="text-gray-600">Capture thoughts quickly and easily</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'text'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Type className="h-4 w-4" />
              <span>Type</span>
            </button>
            <button
              onClick={() => setInputMode('voice')}
              disabled={!speechSupported}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                inputMode === 'voice'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              } ${!speechSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Mic className="h-4 w-4" />
              <span>Voice</span>
            </button>
          </div>
        </div>

        {inputMode === 'text' ? (
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What's on your mind? Dump all your thoughts here..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Press Cmd/Ctrl + Enter to submit
              </p>
              <button
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>Capture</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <button
              onClick={handleVoiceToggle}
              disabled={!speechSupported}
              className={`p-6 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
                !speechSupported
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isListening 
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white`}
            >
              <Mic className="h-8 w-8" />
            </button>
            <div>
              <p className="text-sm text-gray-600">
                {isListening 
                  ? 'Listening... speak your thoughts' 
                  : speechSupported 
                  ? 'Tap to start voice capture'
                  : 'Voice input not available'
                }
              </p>
              {transcript && (
                <p className="text-sm text-gray-800 mt-2 italic">
                  "{transcript}"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Raw Entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">
              Recent Entries ({entries.length})
            </h4>
            <button
              onClick={clearAllEntries}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {entries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <div className="flex items-center space-x-2 mb-1">
                      {entry.type === 'voice' ? (
                        <Mic className="h-3 w-3 text-indigo-600" />
                      ) : (
                        <Type className="h-3 w-3 text-gray-600" />
                      )}
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {entry.content.length > 100 
                        ? `${entry.content.substring(0, 100)}...` 
                        : entry.content
                      }
                    </p>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {entries.length === 0 && (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No brain dumps yet</h4>
          <p className="text-gray-600 max-w-md mx-auto">
            Start capturing your thoughts! Use text or voice input to quickly save ideas and notes.
          </p>
        </div>
      )}
    </div>
  );
};