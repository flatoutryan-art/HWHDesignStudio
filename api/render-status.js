// render-status.js — polls Replicate for prediction status
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Replicate API token not configured' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'No prediction ID provided' });
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.detail || 'Status check failed' });
    }

    const result = {
      status: data.status,
      imageUrl: null,
      error: null
    };

    if (data.status === 'succeeded') {
      result.imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
    }

    if (data.status === 'failed' || data.status === 'canceled') {
      result.error = data.error || 'Render failed';
    }

    return res.status(200).json(result);

  } catch (err) {
    console.error('Status check error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
