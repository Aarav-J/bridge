export interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  category: 'economic' | 'social' | 'foreign-policy' | 'governance' | 'cultural';
  type: 'multiple-choice' | 'scale' | 'binary';
}

export interface QuizAnswer {
  questionId: number;
  answer: string;
  category: string;
}

export interface PoliticalSpectrum {
  economic: number; // -100 (very liberal) to +100 (very conservative)
  social: number;
  foreignPolicy: number;
  governance: number;
  cultural: number;
  overall: number;
}

export const questions: QuizQuestion[] = [
  {
    id: 1,
    question: "If you had to choose, would you rather have…",
    answers: [
      "A smaller government providing fewer services",
      "A bigger government providing more services",
      "Modestly expand on current government services",
      "Greatly expand on current government services"
    ],
    category: 'governance',
    type: 'multiple-choice'
  },
  {
    id: 2,
    question: "Which of the following statements come closest to your view?",
    answers: [
      "America's openness to people from all over the world is essential to who we are as a nation",
      "If America is too open to people from all over the world, we risk losing our identity as a nation"
    ],
    category: 'cultural',
    type: 'binary'
  },
  {
    id: 3,
    question: "In general, would you say experts who study a subject for many years are…",
    answers: [
      "Usually BETTER at making good policy decisions",
      "Usually WORSE at making good policy decisions",
      "NEITHER BETTER NOR WORSE at making good policy decisions"
    ],
    category: 'governance',
    type: 'multiple-choice'
  },
  {
    id: 4,
    question: "Thinking about increased trade of goods and services between the U.S. and other nations, would you say the U.S. has…",
    answers: [
      "Gained more than it has lost",
      "Lost more than it has gained"
    ],
    category: 'foreign-policy',
    type: 'binary'
  },
  {
    id: 5,
    question: "How much more needs to be done to ensure equal rights for all Americans regardless of race or ethnicity?",
    answers: [
      "A lot",
      "A little",
      "Nothing at all"
    ],
    category: 'social',
    type: 'multiple-choice'
  },
  {
    id: 6,
    question: "Which comes closer to your view about corporations?",
    answers: [
      "Business corporations make too much profit",
      "Most corporations make a fair and reasonable amount of profit"
    ],
    category: 'economic',
    type: 'binary'
  },
  {
    id: 7,
    question: "How much would it bother you to hear people speak a language other than English in public?",
    answers: [
      "A lot",
      "Some",
      "Not much",
      "Not at all"
    ],
    category: 'cultural',
    type: 'multiple-choice'
  },
  {
    id: 8,
    question: "On a scale of 0 to 100, how warm or cold do you feel toward Democrats and Republicans?",
    answers: ["0","10","20","30","40","50","60","70","80","90","100"],
    category: 'governance',
    type: 'scale'
  },
  {
    id: 9,
    question: "Which statement best describes your opinion about the U.S.?",
    answers: [
      "The U.S. stands above all other countries",
      "The U.S. is one of the greatest countries along with some others",
      "There are other countries better than the U.S."
    ],
    category: 'foreign-policy',
    type: 'multiple-choice'
  },
  {
    id: 10,
    question: "How much of a problem are the following in the U.S. today?",
    answers: [
      "People being too easily offended",
      "People saying very offensive things",
      "Major problem",
      "Minor problem",
      "Not a problem"
    ],
    category: 'cultural',
    type: 'multiple-choice'
  },
  {
    id: 11,
    question: "Which comes closer to your view of political candidates?",
    answers: [
      "There is at least one candidate who shares most of my views",
      "None of the candidates represent my views well"
    ],
    category: 'governance',
    type: 'binary'
  },
  {
    id: 12,
    question: "In general, how much do White people benefit from advantages in society that Black people do not?",
    answers: [
      "A great deal",
      "A fair amount",
      "Not too much",
      "Not at all"
    ],
    category: 'social',
    type: 'multiple-choice'
  },
  {
    id: 13,
    question: "Most U.S. laws and major institutions need to be completely rebuilt / Necessary changes can be made by working within current systems",
    answers: [
      "Need to be completely rebuilt",
      "Can be changed within current systems"
    ],
    category: 'governance',
    type: 'binary'
  },
  {
    id: 14,
    question: "How much do you trust the government to do what is right?",
    answers: ["A lot", "Some", "Not much", "None at all"],
    category: 'governance',
    type: 'multiple-choice'
  },
  {
    id: 15,
    question: "Do you feel personally affected by economic inequality?",
    answers: ["A lot", "Some", "Not much", "Not at all"],
    category: 'economic',
    type: 'multiple-choice'
  },
  {
    id: 16,
    question: "Do you think the U.S. should prioritize environmental protection even if it reduces economic growth?",
    answers: ["Yes", "No", "Not sure"],
    category: 'economic',
    type: 'multiple-choice'
  }
];

// Scoring weights for each answer (liberal to conservative scale)
export const scoringWeights: Record<number, Record<string, number>> = {
  1: {
    "A smaller government providing fewer services": 80,
    "A bigger government providing more services": -80,
    "Modestly expand on current government services": -20,
    "Greatly expand on current government services": -60
  },
  2: {
    "America's openness to people from all over the world is essential to who we are as a nation": -60,
    "If America is too open to people from all over the world, we risk losing our identity as a nation": 60
  },
  3: {
    "Usually BETTER at making good policy decisions": -40,
    "Usually WORSE at making good policy decisions": 40,
    "NEITHER BETTER NOR WORSE at making good policy decisions": 0
  },
  4: {
    "Gained more than it has lost": -30,
    "Lost more than it has gained": 30
  },
  5: {
    "A lot": -70,
    "A little": -20,
    "Nothing at all": 70
  },
  6: {
    "Business corporations make too much profit": -50,
    "Most corporations make a fair and reasonable amount of profit": 50
  },
  7: {
    "A lot": 80,
    "Some": 40,
    "Not much": -20,
    "Not at all": -60
  },
  8: {
    "0": -80,
    "10": -60,
    "20": -40,
    "30": -20,
    "40": 0,
    "50": 0,
    "60": 20,
    "70": 40,
    "80": 60,
    "90": 80,
    "100": 100
  },
  9: {
    "The U.S. stands above all other countries": 60,
    "The U.S. is one of the greatest countries along with some others": 0,
    "There are other countries better than the U.S.": -40
  },
  10: {
    "People being too easily offended": 70,
    "People saying very offensive things": -70,
    "Major problem": 0,
    "Minor problem": 0,
    "Not a problem": 0
  },
  11: {
    "There is at least one candidate who shares most of my views": 0,
    "None of the candidates represent my views well": 0
  },
  12: {
    "A great deal": -80,
    "A fair amount": -40,
    "Not too much": 20,
    "Not at all": 60
  },
  13: {
    "Need to be completely rebuilt": -60,
    "Can be changed within current systems": 20
  },
  14: {
    "A lot": 20,
    "Some": 0,
    "Not much": -20,
    "None at all": -40
  },
  15: {
    "A lot": -60,
    "Some": -20,
    "Not much": 20,
    "Not at all": 40
  },
  16: {
    "Yes": -40,
    "No": 40,
    "Not sure": 0
  }
};
