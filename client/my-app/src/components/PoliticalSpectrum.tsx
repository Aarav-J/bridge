"use client";

import type { PoliticalSpectrum } from '@/data/quizData';

interface PoliticalSpectrumProps {
  spectrum: PoliticalSpectrum;
}

export default function PoliticalSpectrum({ spectrum }: PoliticalSpectrumProps) {
  const getSpectrumColor = (value: number) => {
    if (value < -50) return 'bg-blue-500';
    if (value < -20) return 'bg-blue-400';
    if (value < 20) return 'bg-gray-400';
    if (value < 50) return 'bg-red-400';
    return 'bg-red-500';
  };

  const getSpectrumLabel = (value: number) => {
    if (value < -50) return 'Very Liberal';
    if (value < -20) return 'Liberal';
    if (value < 20) return 'Moderate';
    if (value < 50) return 'Conservative';
    return 'Very Conservative';
  };

  const getSpectrumPosition = (value: number) => {
    // Convert -100 to +100 scale to 0-100% position
    return ((value + 100) / 200) * 100;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold text-center mb-8">Your Political Spectrum</h2>
      
      {/* Overall Spectrum */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-center">Overall Political Position</h3>
        <div className="relative">
          <div className="w-full h-8 bg-gradient-to-r from-blue-500 via-gray-400 to-red-500 rounded-lg relative">
            <div 
              className="absolute top-0 w-4 h-8 bg-white border-2 border-gray-800 rounded transform -translate-x-2"
              style={{ left: `${getSpectrumPosition(spectrum.overall)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Very Liberal</span>
            <span>Moderate</span>
            <span>Very Conservative</span>
          </div>
          <div className="text-center mt-2">
            <span className={`inline-block px-4 py-2 rounded-full text-white font-semibold ${getSpectrumColor(spectrum.overall)}`}>
              {getSpectrumLabel(spectrum.overall)} ({spectrum.overall.toFixed(0)})
            </span>
          </div>
        </div>
      </div>

      {/* Individual Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(spectrum).filter(([key]) => key !== 'overall').map(([category, value]) => (
          <div key={category} className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 capitalize">
              {category.replace(/([A-Z])/g, ' $1').trim()}
            </h4>
            <div className="relative">
              <div className="w-full h-6 bg-gradient-to-r from-blue-500 via-gray-400 to-red-500 rounded relative">
                <div 
                  className="absolute top-0 w-3 h-6 bg-white border border-gray-800 rounded transform -translate-x-1.5"
                  style={{ left: `${getSpectrumPosition(value)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-600">
                <span>Liberal</span>
                <span>Conservative</span>
              </div>
              <div className="text-center mt-1">
                <span className="text-sm font-medium">
                  {getSpectrumLabel(value)} ({value.toFixed(0)})
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Interpretation */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">What This Means</h3>
        <p className="text-gray-700 leading-relaxed">
          Your political spectrum is calculated based on your responses to questions covering 
          economic policy, social issues, foreign policy, governance, and cultural values. 
          The scale ranges from -100 (very liberal) to +100 (very conservative), with 0 
          representing a moderate position. This helps match you with debate partners who 
          have different perspectives while ensuring meaningful political discourse.
        </p>
      </div>
    </div>
  );
}
