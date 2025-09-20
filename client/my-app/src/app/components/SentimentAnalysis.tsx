"use client";

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

interface SentimentAnalysisProps {
  sentiment: SentimentResult | null;
  isLoading: boolean;
}

const sentimentColors = {
  positive: 'text-green-600 bg-green-100',
  negative: 'text-red-600 bg-red-100',
  neutral: 'text-gray-600 bg-gray-100',
  mixed: 'text-yellow-600 bg-yellow-100'
};

const toneColors = {
  respectful: 'text-green-600 bg-green-100',
  aggressive: 'text-red-600 bg-red-100',
  neutral: 'text-gray-600 bg-gray-100',
  passionate: 'text-orange-600 bg-orange-100',
  calm: 'text-blue-600 bg-blue-100'
};

const biasColors = {
  'left-leaning': 'text-blue-600 bg-blue-100',
  'right-leaning': 'text-red-600 bg-red-100',
  'centrist': 'text-purple-600 bg-purple-100',
  'unclear': 'text-gray-600 bg-gray-100'
};

export default function SentimentAnalysis({ sentiment, isLoading }: SentimentAnalysisProps) {
  const getRespectfulnessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRespectfulnessLabel = (score: number) => {
    if (score >= 0.8) return 'Very Respectful';
    if (score >= 0.6) return 'Mostly Respectful';
    if (score >= 0.4) return 'Somewhat Respectful';
    return 'Not Respectful';
  };

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Analyzing speech sentiment...</span>
        </div>
      </div>
    );
  }

  if (!sentiment) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm">No sentiment analysis available yet. Start speaking to see real-time analysis.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Real-time Sentiment Analysis</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Sentiment */}
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${sentimentColors[sentiment.sentiment]}`}>
            {sentiment.sentiment.charAt(0).toUpperCase() + sentiment.sentiment.slice(1)}
          </div>
          <p className="text-xs text-gray-600">Sentiment</p>
        </div>

        {/* Tone */}
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${toneColors[sentiment.tone]}`}>
            {sentiment.tone.charAt(0).toUpperCase() + sentiment.tone.slice(1)}
          </div>
          <p className="text-xs text-gray-600">Tone</p>
        </div>

        {/* Political Bias */}
        <div className="text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-2 ${biasColors[sentiment.political_bias]}`}>
            {sentiment.political_bias.charAt(0).toUpperCase() + sentiment.political_bias.slice(1)}
          </div>
          <p className="text-xs text-gray-600">Political Bias</p>
        </div>

        {/* Respectfulness Score */}
        <div className="text-center">
          <div className={`text-lg font-bold mb-2 ${getRespectfulnessColor(sentiment.respectfulness_score)}`}>
            {Math.round(sentiment.respectfulness_score * 100)}%
          </div>
          <p className="text-xs text-gray-600">{getRespectfulnessLabel(sentiment.respectfulness_score)}</p>
        </div>
      </div>

      {/* Key Emotions */}
      {sentiment.key_emotions && sentiment.key_emotions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Emotions Detected:</h4>
          <div className="flex flex-wrap gap-2">
            {sentiment.key_emotions.map((emotion, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
              >
                {emotion}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">Analysis Summary:</h4>
        <p className="text-gray-800 text-sm">{sentiment.summary}</p>
      </div>

      {/* Metadata */}
      <div className="pt-4 mt-4 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Source: {sentiment.source}</span>
          <span>Analyzed: {new Date(sentiment.analyzed_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
