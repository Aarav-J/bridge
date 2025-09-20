"use client";

import { useState, useEffect, useRef } from 'react';

interface SpeechRecognitionProps {
  onTranscript: (transcript: string) => void;
  onError: (error: string) => void;
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function SpeechRecognition({
  onTranscript,
  onError,
  isListening,
  onStart,
  onStop
}: SpeechRecognitionProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      // Configure recognition settings
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      // Handle results
      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            final += transcript;
          } else {
            interim += transcript;
          }
        }

        setInterimTranscript(interim);
        setFinalTranscript(prev => prev + final);
        
        // Send final transcript to parent component
        if (final) {
          onTranscript(final);
        }
      };

      // Handle errors
      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        onError(`Speech recognition error: ${event.error}`);
      };

      // Handle end of recognition
      recognitionRef.current.onend = () => {
        if (isListening) {
          // Restart recognition if it was supposed to be listening
          setTimeout(() => {
            if (isListening && recognitionRef.current) {
              recognitionRef.current.start();
            }
          }, 100);
        }
      };
    } else {
      setIsSupported(false);
      onError('Speech recognition is not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onError, isListening]);

  useEffect(() => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        onError('Failed to start speech recognition');
      }
    } else if (!isListening && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isListening, onError]);

  const handleStart = () => {
    setFinalTranscript('');
    setInterimTranscript('');
    onStart();
  };

  const handleStop = () => {
    onStop();
  };

  if (!isSupported) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p>Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <button
          onClick={handleStart}
          disabled={isListening}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            isListening
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isListening ? 'Listening...' : 'Start Speaking'}
        </button>
        
        <button
          onClick={handleStop}
          disabled={!isListening}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            !isListening
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          Stop Speaking
        </button>
      </div>

      {/* Transcript Display */}
      <div className="bg-gray-50 p-4 rounded-lg min-h-[100px]">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Live Transcript:</h3>
        <div className="text-gray-800">
          <span className="text-gray-600">{finalTranscript}</span>
          <span className="text-blue-600 italic">{interimTranscript}</span>
        </div>
      </div>

      {/* Status Indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-green-600">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Listening for speech...</span>
        </div>
      )}
    </div>
  );
}
