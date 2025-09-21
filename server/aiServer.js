const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
const port = 3001; // Different port to avoid conflicts

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Better error handling for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.error('JSON parsing error:', error.message);
    return res.status(400).json({ 
      error: 'Invalid JSON format', 
      details: error.message,
      tip: 'Make sure your JSON is properly formatted with quotes around keys and values'
    });
  }
  next();
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'AI Server is running!', 
    status: 'ok',
    endpoints: [
      'GET / - This message',
      'POST /facts - Generate political facts'
    ]
  });
});

// Generate political facts
app.post('/facts', async (req, res) => {
  try {
    const { topic } = req.body;
    
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }

    console.log(`Generating facts for topic: ${topic}`);

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

    const result = JSON.parse(response.choices[0].message.content);
    
    res.json({
      ...result,
      generated_at: new Date().toISOString(),
      source: 'openai_gpt4'
    });

  } catch (error) {
    console.error('Error generating facts:', error);
    res.status(500).json({ 
      error: 'Failed to generate facts',
      details: error.message 
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`🚀 AI Server running on http://localhost:${port}`);
  console.log(`📝 API Key status: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${port}/`);
  console.log(`   POST http://localhost:${port}/facts`);
});
