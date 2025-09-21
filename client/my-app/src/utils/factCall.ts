import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
})

export const factCall = async ({question}: {question: string}) => {
    const prompt = `Generate 3-5 accurate, well-sourced facts about the political question: "${question}"
    
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

    const response = await openai.chat.completions.create({
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
      temperature: 0.0,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    if (!content) {
        throw new Error('No content received from OpenAI API');
    }
    const result = JSON.parse(content);
    return result; 
}