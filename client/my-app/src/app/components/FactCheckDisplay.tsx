"use client";

import { useState } from 'react';

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

interface FactCheckDisplayProps {
  factCheck: FactCheckResult | null;
  isLoading: boolean;
  onRequestFactCheck: (claim: string, topic?: string) => void;
}

const accuracyColors = {
  accurate: 'text-green-600 bg-green-100',
  mostly_accurate: 'text-green-700 bg-green-200',
  partially_accurate: 'text-yellow-600 bg-yellow-100',
  mostly_inaccurate: 'text-orange-600 bg-orange-100',
  inaccurate: 'text-red-600 bg-red-100',
  unverifiable: 'text-gray-600 bg-gray-100'
};

const accuracyLabels = {
  accurate: 'Accurate',
  mostly_accurate: 'Mostly Accurate',
  partially_accurate: 'Partially Accurate',
  mostly_inaccurate: 'Mostly Inaccurate',
  inaccurate: 'Inaccurate',
  unverifiable: 'Unverifiable'
};

export default function FactCheckDisplay({ factCheck, isLoading, onRequestFactCheck }: FactCheckDisplayProps) {
  const [claimInput, setClaimInput] = useState('');
  const [topicInput, setTopicInput] = useState('');

  const handleFactCheck = () => {
    if (claimInput.trim()) {
      onRequestFactCheck(claimInput.trim(), topicInput.trim() || undefined);
      setClaimInput('');
      setTopicInput('');
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <div className="space-y-6">
      {/* Fact-Check Request Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Request Fact Check</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="claim" className="block text-sm font-medium text-gray-700 mb-2">
              Claim to Fact-Check *
            </label>
            <textarea
              id="claim"
              value={claimInput}
              onChange={(e) => setClaimInput(e.target.value)}
              placeholder="Enter the political claim you want fact-checked..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Topic Context (Optional)
            </label>
            <input
              id="topic"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g., Healthcare, Economy, Foreign Policy..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleFactCheck}
            disabled={!claimInput.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !claimInput.trim() || isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {isLoading ? 'Fact-Checking...' : 'Fact-Check Claim'}
          </button>
        </div>
      </div>

      {/* Fact-Check Results */}
      {factCheck && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Fact-Check Result</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${accuracyColors[factCheck.accuracy]}`}>
                {accuracyLabels[factCheck.accuracy]}
              </span>
              <span className={`text-sm font-medium ${getConfidenceColor(factCheck.confidence)}`}>
                {getConfidenceLabel(factCheck.confidence)} Confidence
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Original Claim */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Original Claim:</h4>
              <p className="text-gray-800 italic">"{factCheck.claim}"</p>
            </div>

            {/* Verdict */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Verdict:</h4>
              <p className="text-gray-800 font-medium">{factCheck.verdict}</p>
            </div>

            {/* Explanation */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Explanation:</h4>
              <p className="text-gray-800">{factCheck.explanation}</p>
            </div>

            {/* Evidence */}
            {factCheck.evidence && factCheck.evidence !== 'N/A' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Evidence:</h4>
                <p className="text-gray-800">{factCheck.evidence}</p>
              </div>
            )}

            {/* Context */}
            {factCheck.context && factCheck.context !== 'N/A' && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Context:</h4>
                <p className="text-gray-800">{factCheck.context}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Source: {factCheck.source}</span>
                <span>Checked: {new Date(factCheck.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Analyzing claim with AI...</span>
          </div>
        </div>
      )}
    </div>
  );
}
