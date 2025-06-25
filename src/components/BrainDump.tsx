import React, { useState, useRef, useEffect } from 'react';
import { 
  Brain, 
  Mic, 
  Type, 
  Send, 
  Wifi, 
  WifiOff, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  RefreshCw,
  Cloud,
  CloudOff,
  Target,
  FileText,
  Heart,
  Plus,
  X
} from 'lucide-react';
import { useBrainDump } from '../hooks/useBrainDump';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useAuth } from '../hooks/useAuth';

export const BrainDump: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const {
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
  const [showResults, setShowResults] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const stats = getStats();
  const processedResults = getProcessedResults();

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

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'action':
        return <Target className="h-4 w-4 text-red-600" />;
      case 'note':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'reflection':
        return <Heart className="h-4 w-4 text-purple-600" />;
      default:
        return <Brain className="h-4 w-4 text-gray-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'action':
        return 'bg-red-50 border-red-200';
      case 'note':
        return 'bg-blue-50 border-blue-200';
      case 'reflection':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="h-6 w-6 text-indigo-600" />
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Brain Dump</h3>
            <p className="text-gray-600">Capture thoughts anytime, AI organizes them for you</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Online Status */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Sync Status */}
          {isAuthenticated && (
            <button
              onClick={syncToCloud}
              disabled={syncing || !isOnline}
              className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                stats.unsynced > 0 
                  ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                  : 'bg-green-100 text-green-800'
              }`}
              title={`${stats.unsynced} unsynced entries`}
              aria-label={`Sync ${stats.unsynced} unsynced entries to cloud`}
            >
              {syncing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : stats.unsynced > 0 ? (
                <CloudOff className="h-3 w-3" />
              ) : (
                <Cloud className="h-3 w-3" />
              )}
              <span>{syncing ? 'Syncing...' : stats.unsynced > 0 ? `${stats.unsynced} pending` : 'Synced'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Entries</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-indigo-600">{stats.processed}</div>
          <div className="text-sm text-gray-600">Processed</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-orange-600">{stats.unprocessed}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.processingRate}%</div>
          <div className="text-sm text-gray-600">Processed</div>
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

          {isAuthenticated && stats.unprocessed > 0 && isOnline && (
            <button
              onClick={processUnprocessedEntries}
              disabled={processing}
              className="flex items-center space-x-2 text-sm text-indigo-600 hover:text-indigo-700"
              aria-label={`Process ${stats.unprocessed} pending entries`}
            >
              <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
              <span>Process {stats.unprocessed} pending</span>
            </button>
          )}
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
              aria-label={isListening ? 'Stop voice recording' : 'Start voice recording'}
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

        {!isOnline && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <p className="text-yellow-800 text-sm">
                You're offline. Entries will be saved locally and processed when you're back online.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle Results View */}
      {stats.processed > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowResults(!showResults)}
            className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700"
            aria-label={`${showResults ? 'Hide' : 'Show'} processed results (${stats.processed} entries)`}
          >
            <span className="font-medium">
              {showResults ? 'Hide' : 'Show'} Processed Results ({stats.processed})
            </span>
            <Plus className={`h-4 w-4 transform transition-transform ${showResults ? 'rotate-45' : ''}`} />
          </button>

          {entries.length > 0 && (
            <button
              onClick={clearAllEntries}
              className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm"
              aria-label="Clear all brain dump entries"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      )}

      {/* Processed Results */}
      {showResults && (
        <div className="grid gap-6">
          {/* Actions */}
          {processedResults.actions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Target className="h-5 w-5 text-red-600" />
                <span>Actions ({processedResults.actions.length})</span>
              </h4>
              <div className="space-y-3">
                {processedResults.actions.map((entry) => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${getCategoryColor('action')}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {entry.aiResult?.title}
                        </h5>
                        <p className="text-gray-700 text-sm mb-2">
                          {entry.aiResult?.summary}
                        </p>
                        {entry.aiResult?.suggested_actions && (
                          <ul className="text-sm text-gray-600 space-y-1">
                            {entry.aiResult.suggested_actions.map((action, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-red-500">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                          <span>{formatTimestamp(entry.timestamp)}</span>
                          {entry.aiResult?.priority && (
                            <span className={`px-2 py-1 rounded-full ${
                              entry.aiResult.priority === 'high' ? 'bg-red-100 text-red-800' :
                              entry.aiResult.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {entry.aiResult.priority} priority
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        aria-label={`Delete entry: ${entry.aiResult?.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {processedResults.notes.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Notes ({processedResults.notes.length})</span>
              </h4>
              <div className="space-y-3">
                {processedResults.notes.map((entry) => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${getCategoryColor('note')}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {entry.aiResult?.title}
                        </h5>
                        <p className="text-gray-700 text-sm mb-2">
                          {entry.aiResult?.summary}
                        </p>
                        {entry.aiResult?.tags && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {entry.aiResult.tags.map((tag, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        aria-label={`Delete entry: ${entry.aiResult?.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflections */}
          {processedResults.reflections.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Heart className="h-5 w-5 text-purple-600" />
                <span>Reflections ({processedResults.reflections.length})</span>
              </h4>
              <div className="space-y-3">
                {processedResults.reflections.map((entry) => (
                  <div key={entry.id} className={`p-4 rounded-lg border ${getCategoryColor('reflection')}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-grow">
                        <h5 className="font-medium text-gray-900 mb-1">
                          {entry.aiResult?.title}
                        </h5>
                        <p className="text-gray-700 text-sm mb-2">
                          {entry.aiResult?.summary}
                        </p>
                        <div className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        aria-label={`Delete entry: ${entry.aiResult?.title}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Raw Entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-gray-900">
            Recent Entries ({entries.length})
          </h4>
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
                      {entry.processed ? (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          {entry.aiResult && getCategoryIcon(entry.aiResult.category)}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1">
                          {processing ? (
                            <RefreshCw className="h-3 w-3 text-indigo-600 animate-spin" />
                          ) : (
                            <Clock className="h-3 w-3 text-orange-600" />
                          )}
                          <span className="text-xs text-orange-600">Pending</span>
                        </div>
                      )}
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
                    aria-label={`Delete entry: ${entry.content.substring(0, 50)}...`}
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
            Start capturing your thoughts! Whether you're online or offline, your ideas will be saved and organized by AI when you're connected.
          </p>
        </div>
      )}
    </div>
  );
};