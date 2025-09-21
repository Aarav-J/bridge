"use client";

import useStore from '@/store/useStore';
import { supabase } from '../../utils/supabaseClient';
import { getPoliticalLabel } from '@/utils/userProfile';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QuizQuestion from '@/app/components/QuizQuestion';
import PoliticalSpectrum from '@/app/components/PoliticalSpectrum';
import { questions, QuizAnswer, PoliticalSpectrum as PoliticalSpectrumType, scoringWeights } from '@/app/data/quizData';

export default function QuizPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [spectrum, setSpectrum] = useState<PoliticalSpectrumType | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const userId = useStore((state) => state.userId);
  const userDataStore = useStore((state) => state.userData);
  const setUserDataStore = useStore((state) => state.setUserData);

  // Check if user is signed up and hasn't completed quiz
  useEffect(() => {
    // Redirect to signup if no userId
    if (!userId) {
      router.push('/signup');
      return;
    }
    // Use Zustand userData if available
    if (userDataStore) {
      setUserData(userDataStore);
      if (userDataStore.quizCompleted) {
        router.push('/');
        return;
      }
    }
    setIsLoading(false);
  }, [router, userId, userDataStore]);

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

  const handleFinish = async () => {
    // Save results to Supabase if userId is present
    if (userId && spectrum) {
      // 1. Update overall_affiliation in public.profiles
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ overall_affiliation: Math.round(spectrum.overall)})
        .eq('id', userId);
      if (profileError) {
        alert('Error updating overall affiliation: ' + profileError.message);
        return;
      }

      // 2. Upsert the user's political spectrum in public.political_spectrum
      const { error: spectrumError } = await supabase
        .from('political_spectrum')
        .upsert([
          {
            id: userId,
            economic: Math.round(spectrum.economic),
            social: Math.round(spectrum.social),
            foreign_policy: Math.round(spectrum.foreignPolicy),
            governance: Math.round(spectrum.governance),
            cultural: Math.round(spectrum.cultural)
          }
        ]);
      if (spectrumError) {
        alert('Error saving political spectrum: ' + spectrumError.message);
        return;
      }
      // 3. Update Zustand userData
      setUserDataStore((prev) => {
        const base = prev ?? {
          fullName: userData?.fullName ?? '',
          username: userData?.username ?? '',
          email: userData?.email ?? '',
          age: userData?.age ?? null,
          quizCompleted: false,
          signupDate: userData?.signupDate ?? new Date().toISOString(),
          overall_affiliation: userData?.overall_affiliation ?? null,
          politicalLean: userData?.politicalLean ?? null,
        };

        const roundedOverall = Math.round(spectrum.overall);

        return {
          ...base,
          quizCompleted: true,
          overall_affiliation: roundedOverall,
          politicalLean: getPoliticalLabel(roundedOverall),
          quizResults: {
            ...base.quizResults,
            answers,
            spectrum,
            completedAt: new Date().toISOString(),
          },
        };
      });
    }

    // Redirect to account page
    router.push('/');
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
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Quiz Complete!</h2>
            <p className="text-gray-600 mb-6">
              Your political spectrum has been calculated. You can now participate in debates.
            </p>
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Continue to Platform
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state while checking user data
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
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
