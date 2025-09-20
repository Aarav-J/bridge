"use client";

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import SpeechRecognition from '@/app/components/SpeechRecognition';
import FactCheckDisplay from '@/app/components/FactCheckDisplay';
import SentimentAnalysis from '@/app/components/SentimentAnalysis';
import PoliticalFacts from '@/app/components/PoliticalFacts';

interface FactCheckResult {
  claim: string;
  accuracy: 'accurate' | 'mostly_accurate' | 'partially_accurate' | 'mostly_inaccurate' | 'inaccurate' | 'unverifiable';
  confidence: number;
  explanation: string;
  evidence: string;
  context: string;
  verdict: string;
  timestamp: string;
  source: string;
}

interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  tone: 'respectful' | 'aggressive' | 'neutral' | 'passionate' | 'calm';
  political_bias: 'left-leaning' | 'right-leaning' | 'centrist' | 'unclear';
  respectfulness_score: number;
  key_emotions: string[];
  summary: string;
  analyzed_at: string;
  source: string;
}

interface PoliticalFactsResult {
  topic: string;
  facts: Array<{
    fact: string;
    source: string;
    reliability: 'high' | 'medium' | 'low';
    context: string;
  }>;
  last_updated: string;
  generated_at: string;
  source: string;
}

export default function DebatePage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState<Array<{ text: string; timestamp: string; userId: string }>>([]);
  const [factCheck, setFactCheck] = useState<FactCheckResult | null>(null);
  const [sentiment, setSentiment] = useState<SentimentResult | null>(null);
  const [politicalFacts, setPoliticalFacts] = useState<PoliticalFactsResult | null>(null);
  const [isFactChecking, setIsFactChecking] = useState(false);
  const [isGeneratingFacts, setIsGeneratingFacts] = useState(false);
  const [isAnalyzingSentiment, setIsAnalyzingSentiment] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'fact-check' | 'sentiment' | 'facts'>('transcript');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('transcription', (data) => {
      setTranscripts(prev => [...prev, {
        text: data.transcript,
        timestamp: data.timestamp,
        userId: data.userId
      }]);
    });

    newSocket.on('sentiment-analysis', (data) => {
      setSentiment(data);
      setIsAnalyzingSentiment(false);
    });

    newSocket.on('fact-check-result', (data) => {
      setFactCheck(data.factCheck);
      setIsFactChecking(false);
    });

    newSocket.on('facts-generated', (data) => {
      setPoliticalFacts(data);
      setIsGeneratingFacts(false);
    });

    newSocket.on('fact-check-error', (error) => {
      console.error('Fact-check error:', error);
      setIsFactChecking(false);
    });

    newSocket.on('facts-error', (error) => {
      console.error('Facts generation error:', error);
      setIsGeneratingFacts(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Initialize video stream
    const initVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        localStreamRef.current = stream;
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initVideo();

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleTranscript = (transcript: string) => {
    if (socket && isConnected) {
      socket.emit('transcription', {
        transcript,
        userId: 'user-' + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      });
    }
  };

  const handleFactCheckRequest = (claim: string, topic?: string) => {
    if (socket && isConnected) {
      setIsFactChecking(true);
      socket.emit('fact-check-request', { claim, topic });
    }
  };

  const handleFactsRequest = (topic: string) => {
    if (socket && isConnected) {
      setIsGeneratingFacts(true);
      socket.emit('request-facts', { topic });
    }
  };

  const handleSpeechError = (error: string) => {
    console.error('Speech recognition error:', error);
  };

  const handleStartListening = () => {
    setIsListening(true);
    setIsAnalyzingSentiment(true);
  };

  const handleStopListening = () => {
    setIsListening(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">AI-Powered Political Debate</h1>
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Display */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Video Call</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Your Video</h3>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Remote Video</h3>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    className="w-full h-48 bg-gray-200 rounded-lg object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Speech Recognition */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Speech Recognition</h2>
              <SpeechRecognition
                onTranscript={handleTranscript}
                onError={handleSpeechError}
                isListening={isListening}
                onStart={handleStartListening}
                onStop={handleStopListening}
              />
            </div>
          </div>

          {/* AI Features Sidebar */}
          <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-md">
              <div className="flex border-b">
                {[
                  { id: 'transcript', label: 'Transcript' },
                  { id: 'fact-check', label: 'Fact Check' },
                  { id: 'sentiment', label: 'Sentiment' },
                  { id: 'facts', label: 'Facts' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-md">
              {activeTab === 'transcript' && (
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Transcript</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {transcripts.length === 0 ? (
                      <p className="text-gray-500 text-sm">No transcripts yet. Start speaking to see live transcription.</p>
                    ) : (
                      transcripts.map((transcript, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <p className="text-gray-800 text-sm">{transcript.text}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(transcript.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'fact-check' && (
                <div className="p-6">
                  <FactCheckDisplay
                    factCheck={factCheck}
                    isLoading={isFactChecking}
                    onRequestFactCheck={handleFactCheckRequest}
                  />
                </div>
              )}

              {activeTab === 'sentiment' && (
                <div className="p-6">
                  <SentimentAnalysis
                    sentiment={sentiment}
                    isLoading={isAnalyzingSentiment}
                  />
                </div>
              )}

              {activeTab === 'facts' && (
                <div className="p-6">
                  <PoliticalFacts
                    facts={politicalFacts}
                    isLoading={isGeneratingFacts}
                    onRequestFacts={handleFactsRequest}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}