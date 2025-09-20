"use client";

import { useState, useEffect } from 'react';
import { QuizQuestion as QuizQuestionType, QuizAnswer } from '@/app/data/quizData';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (answer: QuizAnswer) => void;
  currentAnswer?: string;
  questionNumber: number;
  totalQuestions: number;
}

export default function QuizQuestion({ 
  question, 
  onAnswer, 
  currentAnswer, 
  questionNumber, 
  totalQuestions 
}: QuizQuestionProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(currentAnswer || '');

  // Update selectedAnswer when currentAnswer prop changes (when moving to different questions)
  useEffect(() => {
    setSelectedAnswer(currentAnswer || '');
  }, [currentAnswer, question.id]);

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    onAnswer({
      questionId: question.id,
      answer,
      category: question.category
    });
  };

  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Question {questionNumber} of {totalQuestions}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {question.question}
        </h2>
      </div>

      {/* Answers */}
      {question.type === 'scale' ? (
        // Horizontal layout for scale questions (Democrat/Republican thermometer)
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {question.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(answer)}
                className={`px-3 py-2 text-sm rounded-lg border-2 transition-all duration-200 ${
                  selectedAnswer === answer
                    ? 'border-blue-500 bg-blue-50 text-blue-900'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 px-2">
            <span>Cold/Negative</span>
            <span>Warm/Positive</span>
          </div>
        </div>
      ) : (
        // Vertical layout for other question types
        <div className="space-y-3">
          {question.answers.map((answer, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(answer)}
              className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
                selectedAnswer === answer
                  ? 'border-blue-500 bg-blue-50 text-blue-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center">
                <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  selectedAnswer === answer
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswer === answer && (
                    <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                  )}
                </div>
                <span className="text-lg">{answer}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Category Badge */}
      <div className="mt-6 flex justify-center">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          {question.category.replace('-', ' ').toUpperCase()}
        </span>
      </div>
    </div>
  );
}
