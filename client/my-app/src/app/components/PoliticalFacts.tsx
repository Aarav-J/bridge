"use client";

import { useState } from 'react';

interface PoliticalFact {
  fact: string;
  source: string;
  reliability: 'high' | 'medium' | 'low';
  context: string;
}

interface PoliticalFactsResult {
  topic: string;
  facts: PoliticalFact[];
  last_updated: string;
  generated_at: string;
  source: string;
}

interface PoliticalFactsProps {
  facts: PoliticalFactsResult | null;
  isLoading: boolean;
  onRequestFacts: (topic: string) => void;
}

const reliabilityColors = {
  high: 'text-green-600 bg-green-100',
  medium: 'text-yellow-600 bg-yellow-100',
  low: 'text-red-600 bg-red-100'
};

const reliabilityLabels = {
  high: 'High Reliability',
  medium: 'Medium Reliability',
  low: 'Low Reliability'
};

export default function PoliticalFacts({ facts, isLoading, onRequestFacts }: PoliticalFactsProps) {
  const [topicInput, setTopicInput] = useState('');

  const handleRequestFacts = () => {
    if (topicInput.trim()) {
      onRequestFacts(topicInput.trim());
      setTopicInput('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Facts Request Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Generate Political Facts</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
              Political Topic *
            </label>
            <input
              id="topic"
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              placeholder="e.g., Healthcare Reform, Climate Change, Economic Policy..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleRequestFacts}
            disabled={!topicInput.trim() || isLoading}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              !topicInput.trim() || isLoading
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {isLoading ? 'Generating Facts...' : 'Generate Facts'}
          </button>
        </div>
      </div>

      {/* Generated Facts */}
      {facts && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Facts about: {facts.topic}
            </h3>
            <div className="text-sm text-gray-500">
              Generated: {new Date(facts.generated_at).toLocaleString()}
            </div>
          </div>

          {facts.facts.length > 0 ? (
            <div className="space-y-4">
              {facts.facts.map((fact, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${reliabilityColors[fact.reliability]}`}>
                      {reliabilityLabels[fact.reliability]}
                    </span>
                  </div>
                  
                  <p className="text-gray-800 mb-3 font-medium">{fact.fact}</p>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Source:</span> {fact.source}
                    </div>
                    {fact.context && (
                      <div>
                        <span className="font-medium">Context:</span> {fact.context}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No facts were generated for this topic.</p>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 mt-6 border-t border-gray-200">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Source: {facts.source}</span>
              <span>Last Updated: {facts.last_updated}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <span className="text-gray-700">Generating political facts with AI...</span>
          </div>
        </div>
      )}
    </div>
  );
}
