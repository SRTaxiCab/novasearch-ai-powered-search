require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Endpoint for web search using Bing Search API (example)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q' });
  }

  try {
    const response = await axios.get(process.env.WEB_SEARCH_API_ENDPOINT, {
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.WEB_SEARCH_API_KEY,
      },
      params: {
        q: query,
        count: 5,
        mkt: 'en-US',
      },
    });

    // Extract relevant search results
    const webPages = response.data.webPages?.value || [];
    const results = webPages.map(page => ({
      name: page.name,
      url: page.url,
      snippet: page.snippet,
    }));

    res.json({ results });
  } catch (error) {
    console.error('Search API error:', error.message);
    res.status(500).json({ error: 'Failed to fetch search results' });
  }
});

// Endpoint for generative AI response using OpenAI API
app.post('/api/generate', async (req, res) => {
  const query = req.body.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter q in body' });
  }

  try {
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates creative search-related responses.' },
          { role: 'user', content: `Generate a creative and insightful response about: ${query}` },
        ],
        max_tokens: 150,
        temperature: 0.8,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const generatedText = openaiResponse.data.choices[0].message.content.trim();
    res.json({ response: generatedText });
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
});

// Serve frontend static files (optional, if frontend is served from backend)
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`NovaSearch backend listening at http://localhost:${port}`);
});
