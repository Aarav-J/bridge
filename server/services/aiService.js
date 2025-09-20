const OpenAI = require('openai');

class AIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Fact-check a political claim using OpenAI
   * @param {string} claim - The claim to fact-check
   * @param {string} topic - The political topic/context
   * @returns {Promise<Object>} Fact-check result with accuracy assessment
   */
  async factCheckClaim(claim, topic = 'general politics') {
    try {
      const prompt = `You are an expert fact-checker specializing in political information. 
      
      Please analyze the following claim and provide a comprehensive fact-check:
      
      Claim: "${claim}"
      Topic Context: ${topic}
      
      Please provide your analysis in the following JSON format:
      {
        "claim": "the original claim",
        "accuracy": "accurate|mostly_accurate|partially_accurate|mostly_inaccurate|inaccurate|unverifiable",
        "confidence": 0.0-1.0,
        "explanation": "detailed explanation of why this claim is accurate/inaccurate",
        "evidence": "supporting evidence or sources that contradict/support the claim",
        "context": "important context that affects the accuracy",
        "verdict": "brief summary of the fact-check result"
      }
      
      Be objective, cite reliable sources when possible, and explain your reasoning clearly.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a professional fact-checker with expertise in political information. Provide accurate, unbiased analysis based on verifiable facts."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        ...result,
        timestamp: new Date().toISOString(),
        source: 'openai_gpt4'
      };
    } catch (error) {
      console.error('Error in fact-checking:', error);
      return {
        claim,
        accuracy: 'unverifiable',
        confidence: 0.0,
        explanation: 'Unable to fact-check due to technical error',
        evidence: 'N/A',
        context: 'N/A',
        verdict: 'Unable to verify',
        timestamp: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Generate political facts about a specific topic
   * @param {string} topic - The political topic to generate facts about
   * @returns {Promise<Object>} Generated facts with sources
   */
  async generatePoliticalFacts(topic) {
    try {
      const prompt = `Generate 3-5 accurate, well-sourced facts about the political topic: "${topic}"
      
      Please provide your response in the following JSON format:
      {
        "topic": "the requested topic",
        "facts": [
          {
            "fact": "the factual statement",
            "source": "reliable source or reference",
            "reliability": "high|medium|low",
            "context": "important context about this fact"
          }
        ],
        "last_updated": "approximate date when this information was current"
      }
      
      Focus on verifiable, non-partisan facts that would be useful in a political debate.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a political research assistant. Provide accurate, well-sourced facts that are useful for political discussions and debates."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        ...result,
        generated_at: new Date().toISOString(),
        source: 'openai_gpt4'
      };
    } catch (error) {
      console.error('Error generating facts:', error);
      return {
        topic,
        facts: [],
        last_updated: 'N/A',
        generated_at: new Date().toISOString(),
        error: error.message
      };
    }
  }

  /**
   * Analyze the tone and sentiment of transcribed speech
   * @param {string} transcript - The transcribed text
   * @returns {Promise<Object>} Sentiment analysis result
   */
  async analyzeSentiment(transcript) {
    try {
      const prompt = `Analyze the sentiment and tone of the following political speech transcript:
      
      "${transcript}"
      
      Please provide your analysis in the following JSON format:
      {
        "sentiment": "positive|negative|neutral|mixed",
        "tone": "respectful|aggressive|neutral|passionate|calm",
        "political_bias": "left-leaning|right-leaning|centrist|unclear",
        "respectfulness_score": 0.0-1.0,
        "key_emotions": ["emotion1", "emotion2"],
        "summary": "brief summary of the overall tone and approach"
      }`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an expert in analyzing political discourse. Focus on tone, respectfulness, and political positioning."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      });

      const result = JSON.parse(response.choices[0].message.content);
      return {
        ...result,
        analyzed_at: new Date().toISOString(),
        source: 'openai_gpt4'
      };
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      return {
        sentiment: 'neutral',
        tone: 'neutral',
        political_bias: 'unclear',
        respectfulness_score: 0.5,
        key_emotions: [],
        summary: 'Unable to analyze',
        analyzed_at: new Date().toISOString(),
        error: error.message
      };
    }
  }
}

module.exports = AIService;
