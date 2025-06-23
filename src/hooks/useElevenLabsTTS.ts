import { useState, useRef } from 'react';

interface TTSOptions {
  voice_id?: string;
  model_id?: string;
}

export const useElevenLabsTTS = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentRequestRef = useRef<AbortController | null>(null);

  const speak = async (text: string, options?: TTSOptions) => {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.warn('Invalid text provided to TTS:', text);
      return;
    }

    // Prevent duplicate calls - if already loading or speaking, ignore new requests
    if (loading || isSpeaking) {
      console.log('TTS already in progress, ignoring duplicate request');
      return;
    }

    setLoading(true);
    setError(null);

    // Abort any previous request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    currentRequestRef.current = abortController;

    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }

      console.log('Making TTS request for text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      const requestBody = {
        text: text.trim(),
        voice_id: options?.voice_id || 'EXAVITQu4vr4xnSDxMaL', // Sarah - warm, friendly voice
        model_id: options?.model_id || 'eleven_monolingual_v1',
      };

      console.log('TTS request body:', requestBody);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/text-to-speech`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.signal,
        }
      );

      // Check if request was aborted
      if (abortController.signal.aborted) {
        console.log('TTS request was aborted');
        return;
      }

      console.log('TTS response status:', response.status);
      console.log('TTS response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('TTS API error:', errorData);
        
        let errorMessage = 'Failed to generate speech';
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Check again if request was aborted after getting response
      if (abortController.signal.aborted) {
        console.log('TTS request was aborted after response');
        return;
      }

      if (!data.audio_base64) {
        throw new Error('No audio data received from TTS service');
      }
      
      console.log('Received audio data, size:', data.size || 'unknown');
      
      // Convert base64 to audio blob
      const audioData = atob(data.audio_base64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([audioArray], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Create and play audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onloadstart = () => {
        if (!abortController.signal.aborted) {
          console.log('Audio loading started');
          setIsSpeaking(true);
        }
      };
      
      audio.oncanplay = () => {
        console.log('Audio can play');
      };
      
      audio.onplay = () => {
        console.log('Audio playback started');
      };
      
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        currentRequestRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        setError('Failed to play audio');
        URL.revokeObjectURL(audioUrl);
        audioRef.current = null;
        currentRequestRef.current = null;
      };
      
      // Final check before playing
      if (!abortController.signal.aborted) {
        try {
          await audio.play();
          console.log('TTS audio started playing successfully');
        } catch (playError) {
          console.error('Failed to play audio:', playError);
          setError('Failed to play audio - browser may require user interaction first');
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
          audioRef.current = null;
          currentRequestRef.current = null;
        }
      } else {
        URL.revokeObjectURL(audioUrl);
      }
      
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('TTS request was aborted');
        return;
      }
      
      console.error('TTS error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown TTS error';
      setError(errorMessage);
      setIsSpeaking(false);
      currentRequestRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    console.log('Stopping TTS');
    
    // Abort any ongoing request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }

    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsSpeaking(false);
    }
    
    setLoading(false);
    setError(null);
  };

  return {
    speak,
    stop,
    isSpeaking,
    loading,
    error,
  };
};