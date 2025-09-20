"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuizQuestion from '@/components/QuizQuestion';
import PoliticalSpectrum from '@/components/PoliticalSpectrum';
import { questions, QuizAnswer, PoliticalSpectrum as PoliticalSpectrumType, scoringWeights } from '@/data/quizData';

export default function QuizPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [spectrum, setSpectrum] = useState<PoliticalSpectrumType | null>(null);
  const router = useRouter();

  // Filter questions based on previous answers (conditional logic)
  const getAvailableQuestions = () => {
    const availableQuestions = [...questions];
    
    // If user answered "smaller government" for question 1, skip question 2
    const answer1 = answers.find(a => a.questionId === 1);
    if (answer1 && answer1.answer === "A smaller government providing fewer services") {
      return availableQuestions.filter(q => q.id !== 2);
    }
    
    return availableQuestions;
  };

  const availableQuestions = getAvailableQuestions();
  const currentQuestion = availableQuestions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion.id);

  const handleAnswer = (answer: QuizAnswer) => {
    setAnswers(prev => {
      const filtered = prev.filter(a => a.questionId !== answer.questionId);
      return [...filtered, answer];
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < availableQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Quiz complete - calculate spectrum
      calculateSpectrum();
      setIsComplete(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const calculateSpectrum = () => {
    const categoryScores: Record<string, number[]> = {
      economic: [],
      social: [],
      'foreign-policy': [],
      governance: [],
      cultural: []
    };

    // Calculate scores for each category
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question && scoringWeights[question.id]) {
        const score = scoringWeights[question.id][answer.answer] || 0;
        categoryScores[answer.category].push(score);
      }
    });

    // Calculate average scores for each category
    const spectrum: PoliticalSpectrumType = {
      economic: calculateAverage(categoryScores.economic),
      social: calculateAverage(categoryScores.social),
      foreignPolicy: calculateAverage(categoryScores['foreign-policy']),
      governance: calculateAverage(categoryScores.governance),
      cultural: calculateAverage(categoryScores.cultural),
      overall: 0
    };

    // Calculate overall score
    const allScores = [
      spectrum.economic,
      spectrum.social,
      spectrum.foreignPolicy,
      spectrum.governance,
      spectrum.cultural
    ];
    spectrum.overall = calculateAverage(allScores);

    setSpectrum(spectrum);
  };

  const calculateAverage = (scores: number[]): number => {
    if (scores.length === 0) return 0;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const handleStartDebate = () => {
    // TODO: Implement debate matching logic
    router.push('/debate');
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setIsComplete(false);
    setSpectrum(null);
  };

  if (isComplete && spectrum) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <PoliticalSpectrum spectrum={spectrum} />
        <div className="max-w-4xl mx-auto p-6 mt-8">
          <div className="flex gap-4 justify-center">
            <button
              onClick={handleStartDebate}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Find Debate Partner
            </button>
            <button
              onClick={handleRetakeQuiz}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <QuizQuestion
        question={currentQuestion}
        onAnswer={handleAnswer}
        currentAnswer={currentAnswer?.answer}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={availableQuestions.length}
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
          >
            Previous
          </button>
          
          <button
            onClick={handleNext}
            disabled={!currentAnswer}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
          >
            {currentQuestionIndex === availableQuestions.length - 1 ? 'Complete Quiz' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
