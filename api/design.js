module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
 
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }
 
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': ANTHROPIC_API_KEY
      },
      body: JSON.stringify(req.body)
    });
 
    const data = await response.json();
 
    // Log error details from Anthropic for debugging
    if (!response.ok) {
      console.error('Anthropic error:', response.status, JSON.stringify(data));
    }
 
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
 
// Increase body size limit to 20mb for base64 image uploads
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
};
