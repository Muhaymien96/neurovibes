import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    console.log('Initializing speech recognition...');
    
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    console.log('SpeechRecognition available:', !!SpeechRecognition);
    console.log('window.SpeechRecognition:', !!window.SpeechRecognition);
    console.log('window.webkitSpeechRecognition:', !!window.webkitSpeechRecognition);
    console.log('User agent:', navigator.userAgent);
    console.log('Is HTTPS:', window.location.protocol === 'https:');
    console.log('Is localhost:', window.location.hostname === 'localhost');
    
    if (SpeechRecognition) {
      console.log('Speech recognition is supported, creating instance...');
      setIsSupported(true);
      
      try {
        recognitionRef.current = new SpeechRecognition();
        console.log('Speech recognition instance created successfully');
        
        const recognition = recognitionRef.current;
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        console.log('Speech recognition configured:', {
          continuous: recognition.continuous,
          interimResults: recognition.interimResults,
          lang: recognition.lang
        });

        recognition.onstart = (event) => {
          console.log('Speech recognition started', event);
          setIsListening(true);
          setError(null);
        };

        recognition.onend = (event) => {
          console.log('Speech recognition ended', event);
          setIsListening(false);
        };

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          console.log('Speech recognition result received', event);
          console.log('Results length:', event.results.length);
          console.log('Result index:', event.resultIndex);
          
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            console.log(`Result ${i}:`, {
              isFinal: result.isFinal,
              confidence: result[0].confidence,
              transcript: result[0].transcript
            });
            
            if (result.isFinal) {
              finalTranscript += result[0].transcript;
            } else {
              interimTranscript += result[0].transcript;
            }
          }
          
          if (finalTranscript) {
            console.log('Final transcript:', finalTranscript);
            setTranscript(finalTranscript.trim());
          } else if (interimTranscript) {
            console.log('Interim transcript:', interimTranscript);
            // Optionally set interim results for real-time feedback
            // setTranscript(interimTranscript.trim());
          }
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event);
          console.error('Error type:', event.error);
          console.error('Error message:', event.message);
          
          let userFriendlyError = event.error;
          
          switch (event.error) {
            case 'no-speech':
              userFriendlyError = 'No speech detected. Please try speaking again.';
              break;
            case 'audio-capture':
              userFriendlyError = 'Microphone access denied or not available.';
              break;
            case 'not-allowed':
              userFriendlyError = 'Microphone permission denied. Please allow microphone access.';
              break;
            case 'network':
              userFriendlyError = 'Network error. Please check your internet connection.';
              break;
            case 'service-not-allowed':
              userFriendlyError = 'Speech recognition service not allowed.';
              break;
            case 'bad-grammar':
              userFriendlyError = 'Speech recognition grammar error.';
              break;
            case 'language-not-supported':
              userFriendlyError = 'Language not supported.';
              break;
            default:
              userFriendlyError = `Speech recognition error: ${event.error}`;
          }
          
          setError(userFriendlyError);
          setIsListening(false);
        };

        recognition.onspeechstart = (event) => {
          console.log('Speech started', event);
        };

        recognition.onspeechend = (event) => {
          console.log('Speech ended', event);
        };

        recognition.onsoundstart = (event) => {
          console.log('Sound started', event);
        };

        recognition.onsoundend = (event) => {
          console.log('Sound ended', event);
        };

        recognition.onaudiostart = (event) => {
          console.log('Audio started', event);
        };

        recognition.onaudioend = (event) => {
          console.log('Audio ended', event);
        };

        recognition.onnomatch = (event) => {
          console.log('No match found', event);
          setError('No speech was recognized. Please try again.');
        };

      } catch (initError) {
        console.error('Error initializing speech recognition:', initError);
        setError(`Failed to initialize speech recognition: ${initError.message}`);
        setIsSupported(false);
      }
    } else {
      console.warn('Speech recognition not supported');
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.');
    }

    return () => {
      console.log('Cleaning up speech recognition...');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
          console.log('Speech recognition aborted successfully');
        } catch (cleanupError) {
          console.error('Error during speech recognition cleanup:', cleanupError);
        }
      }
    };
  }, []);

  const startListening = () => {
    console.log('startListening called');
    console.log('Current state:', { isListening, isSupported, hasRecognition: !!recognitionRef.current });
    
    if (!isSupported) {
      console.error('Cannot start listening: Speech recognition not supported');
      setError('Speech recognition is not supported in this browser');
      return;
    }
    
    if (!recognitionRef.current) {
      console.error('Cannot start listening: No recognition instance');
      setError('Speech recognition not initialized');
      return;
    }
    
    if (isListening) {
      console.warn('Already listening, ignoring start request');
      return;
    }

    try {
      console.log('Clearing previous transcript and error...');
      setTranscript('');
      setError(null);
      
      console.log('Starting speech recognition...');
      recognitionRef.current.start();
      console.log('Speech recognition start() called successfully');
    } catch (startError) {
      console.error('Error starting speech recognition:', startError);
      setError(`Failed to start speech recognition: ${startError.message}`);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    console.log('stopListening called');
    console.log('Current state:', { isListening, hasRecognition: !!recognitionRef.current });
    
    if (recognitionRef.current && isListening) {
      try {
        console.log('Stopping speech recognition...');
        recognitionRef.current.stop();
        console.log('Speech recognition stop() called successfully');
      } catch (stopError) {
        console.error('Error stopping speech recognition:', stopError);
        setError(`Failed to stop speech recognition: ${stopError.message}`);
      }
    } else {
      console.warn('Cannot stop: not listening or no recognition instance');
    }
  };

  // Check microphone permissions
  useEffect(() => {
    if (isSupported && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      console.log('Checking microphone permissions...');
      
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log('Microphone access granted');
          // Stop the stream immediately as we just wanted to check permissions
          stream.getTracks().forEach(track => track.stop());
        })
        .catch((permissionError) => {
          console.error('Microphone permission error:', permissionError);
          if (permissionError.name === 'NotAllowedError') {
            setError('Microphone access denied. Please allow microphone access and refresh the page.');
          } else if (permissionError.name === 'NotFoundError') {
            setError('No microphone found. Please connect a microphone and try again.');
          } else {
            setError(`Microphone error: ${permissionError.message}`);
          }
        });
    } else {
      console.warn('getUserMedia not available for permission check');
    }
  }, [isSupported]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening
  };
};