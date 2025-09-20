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
      "A bigger government providing more services"
    ],
    category: 'governance',
    type: 'binary'
  },
  {
    id: 2,
    question: "When you say you favor a bigger government providing more services, do you think it would be better to…",
    answers: [
      "Modestly expand on current government services",
      "Greatly expand on current government services"
    ],
    category: 'governance',
    type: 'binary'
  },
  {
    id: 3,
    question: "Which of the following statements come closest to your view?",
    answers: [
      "America's openness to people from all over the world is essential to who we are as a nation",
      "If America is too open to people from all over the world, we risk losing our identity as a nation"
    ],
    category: 'cultural',
    type: 'binary'
  },
  {
    id: 4,
    question: "In general, would you say experts who study a subject for many years are…",
    answers: [
      "Usually BETTER at making good policy decisions about that subject than other people",
      "Usually WORSE at making good policy decisions about that subject than other people",
      "NEITHER BETTER NOR WORSE at making good policy decisions about that subject than other people"
    ],
    category: 'governance',
    type: 'multiple-choice'
  },
  {
    id: 5,
    question: "Thinking about increased trade of goods and services between the U.S. and other nations in recent decades, would you say that the U.S. has…",
    answers: [
      "Gained more than it has lost because increased trade has helped lower prices and increased the competitiveness of some U.S. businesses",
      "Lost more than it has gained because increased trade has cost jobs in manufacturing and other industries and lowered wages for some U.S. workers"
    ],
    category: 'foreign-policy',
    type: 'binary'
  },
  {
    id: 6,
    question: "How much more, if anything, needs to be done to ensure equal rights for all Americans regardless of their racial or ethnic backgrounds?",
    answers: [
      "A lot",
      "A little",
      "Nothing at all"
    ],
    category: 'social',
    type: 'multiple-choice'
  },
  {
    id: 7,
    question: "Which comes closer to your view about what needs to be done to ensure equal rights for all Americans regardless of their racial or ethnic backgrounds — even if neither is exactly right?",
    answers: [
      "Most U.S. laws and major institutions need to be completely rebuilt because they are fundamentally biased against some racial and ethnic groups",
      "While there are many inequities in U.S. laws and institutions, necessary changes can be made by working within the current systems"
    ],
    category: 'social',
    type: 'binary'
  },
  {
    id: 8,
    question: "Which of the following statements comes closest to your view?",
    answers: [
      "Business corporations make too much profit",
      "Most corporations make a fair and reasonable amount of profit"
    ],
    category: 'economic',
    type: 'binary'
  },
  {
    id: 9,
    question: "How much, if at all, would it bother you to regularly hear people speak a language other than English in public places in your community?",
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
    id: 10,
    question: "On a scale of 0 to 100, where 0 means you feel as cold and negative as possible and 100 means you feel as warm and positive as possible, how do you feel toward Democrats?",
    answers: ["0","10","20","30","40","50","60","70","80","90","100"],
    category: 'governance',
    type: 'scale'
  },
  {
    id: 11,
    question: "On a scale of 0 to 100, where 0 means you feel as cold and negative as possible and 100 means you feel as warm and positive as possible, how do you feel toward Republicans?",
    answers: ["0","10","20","30","40","50","60","70","80","90","100"],
    category: 'governance',
    type: 'scale'
  },
  {
    id: 12,
    question: "Which of these statements best describes your opinion about the United States?",
    answers: [
      "The U.S. stands above all other countries in the world",
      "The U.S. is one of the greatest countries in the world, along with some others",
      "There are other countries that are better than the U.S."
    ],
    category: 'foreign-policy',
    type: 'multiple-choice'
  },
  {
    id: 13,
    question: "How much of a problem, if any, would you say people being too easily offended by things others say are in the country today?",
    answers: [
      "Major problem",
      "Minor problem",
      "Not a problem"
    ],
    category: 'cultural',
    type: 'multiple-choice'
  },
  {
    id: 14,
    question: "How much of a problem, if any, would you say people saying things that are very offensive to others are in the country today?",
    answers: [
      "Major problem",
      "Minor problem",
      "Not a problem"
    ],
    category: 'cultural',
    type: 'multiple-choice'
  },
  {
    id: 15,
    question: "Which comes closer to your view of candidates for political office, even if neither is exactly right? I usually feel like…",
    answers: [
      "There is at least one candidate who shares most of my views",
      "None of the candidates represent my views well"
    ],
    category: 'governance',
    type: 'binary'
  },
  {
    id: 16,
    question: "In general, how much do White people benefit from advantages in society that Black people do not have?",
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
    id: 17,
    question: "Do you think greater social acceptance of people who are transgender (people who identify as a gender that is different from the sex they were assigned at birth) is…",
    answers: [
      "Very good for society",
      "Somewhat good for society",
      "Neither good nor bad for society",
      "Somewhat bad for society",
      "Very bad for society"
    ],
    category: 'social',
    type: 'multiple-choice'
  },
  {
    id: 18,
    question: "Overall, would you say people who are convicted of crimes in this country serve…",
    answers: [
      "Too much time in prison",
      "Too little time in prison",
      "About the right amount of time in prison"
    ],
    category: 'governance',
    type: 'multiple-choice'
  },
  {
    id: 19,
    question: "Which of the following statements comes closest to your view?",
    answers: [
      "Religion should be kept separate from government policies",
      "Government policies should support religious values and beliefs"
    ],
    category: 'cultural',
    type: 'binary'
  },
  {
    id: 20,
    question: "In the future, do you think…",
    answers: [
      "U.S. policies should try to keep it so America is the only military superpower",
      "It would be acceptable if another country became as militarily powerful as the U.S."
    ],
    category: 'foreign-policy',
    type: 'binary'
  }
];

// Scoring weights for each answer (liberal to conservative scale)
export const scoringWeights: Record<number, Record<string, number>> = {
  1: {
    "A smaller government providing fewer services": 80,
    "A bigger government providing more services": -80
  },
  2: {
    "Modestly expand on current government services": -20,
    "Greatly expand on current government services": -60
  },
  3: {
    "America's openness to people from all over the world is essential to who we are as a nation": -60,
    "If America is too open to people from all over the world, we risk losing our identity as a nation": 60
  },
  4: {
    "Usually BETTER at making good policy decisions about that subject than other people": -40,
    "Usually WORSE at making good policy decisions about that subject than other people": 40,
    "NEITHER BETTER NOR WORSE at making good policy decisions about that subject than other people": 0
  },
  5: {
    "Gained more than it has lost because increased trade has helped lower prices and increased the competitiveness of some U.S. businesses": -30,
    "Lost more than it has gained because increased trade has cost jobs in manufacturing and other industries and lowered wages for some U.S. workers": 30
  },
  6: {
    "A lot": -70,
    "A little": -20,
    "Nothing at all": 70
  },
  7: {
    "Most U.S. laws and major institutions need to be completely rebuilt because they are fundamentally biased against some racial and ethnic groups": -60,
    "While there are many inequities in U.S. laws and institutions, necessary changes can be made by working within the current systems": 20
  },
  8: {
    "Business corporations make too much profit": -50,
    "Most corporations make a fair and reasonable amount of profit": 50
  },
  9: {
    "A lot": 80,
    "Some": 40,
    "Not much": -20,
    "Not at all": -60
  },
  10: {
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
  11: {
    "0": 80,
    "10": 60,
    "20": 40,
    "30": 20,
    "40": 0,
    "50": 0,
    "60": -20,
    "70": -40,
    "80": -60,
    "90": -80,
    "100": -100
  },
  12: {
    "The U.S. stands above all other countries in the world": 60,
    "The U.S. is one of the greatest countries in the world, along with some others": 0,
    "There are other countries that are better than the U.S.": -40
  },
  13: {
    "Major problem": 70,
    "Minor problem": 20,
    "Not a problem": -30
  },
  14: {
    "Major problem": -70,
    "Minor problem": -20,
    "Not a problem": 30
  },
  15: {
    "There is at least one candidate who shares most of my views": 0,
    "None of the candidates represent my views well": 0
  },
  16: {
    "A great deal": -80,
    "A fair amount": -40,
    "Not too much": 20,
    "Not at all": 60
  },
  17: {
    "Very good for society": -80,
    "Somewhat good for society": -40,
    "Neither good nor bad for society": 0,
    "Somewhat bad for society": 40,
    "Very bad for society": 80
  },
  18: {
    "Too much time in prison": -60,
    "Too little time in prison": 60,
    "About the right amount of time in prison": 0
  },
  19: {
    "Religion should be kept separate from government policies": -60,
    "Government policies should support religious values and beliefs": 60
  },
  20: {
    "U.S. policies should try to keep it so America is the only military superpower": 60,
    "It would be acceptable if another country became as militarily powerful as the U.S.": -30
  }
};
