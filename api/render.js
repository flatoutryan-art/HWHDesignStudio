module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: 'Replicate API token not configured' });
  }

  const { imageBase64, mimeType, style, palette, roomType } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const stylePrompts = {
    Modern:       'sleek modern kitchen, flat-front handleless cabinets, high-gloss lacquer, monochrome palette, LED lighting',
    Scandinavian: 'scandinavian kitchen, natural oak timber cabinets, warm white walls, open shelving, brass fixtures',
    Shaker:       'shaker style kitchen, classic painted cabinet doors, marble countertop, subway tile splashback',
    Industrial:   'industrial kitchen, dark matte cabinet doors, concrete countertop, matte black hardware, brick splashback',
    Neoclassic:   'neoclassical kitchen, ornate raised panel doors, brass hardware, marble countertops, elegant heritage',
    Minimalist:   'minimalist kitchen, handleless cabinets, seamless flat surfaces, pure white palette, hidden appliances'
  };

  const palettePrompts = {
    'Warm Neutrals':   'warm linen putty taupe',
    'Cool Whites':     'crisp white light grey minimal',
    'Dark & Dramatic': 'dark graphite charcoal black',
    'Natural Timber':  'natural oak walnut warm timber',
    'Sage & Stone':    'sage green stone grey organic',
    'Rich Navy':       'deep navy blue gold accents'
  };

  const stylePrompt = stylePrompts[style] || stylePrompts.Modern;
  const palettePrompt = palettePrompts[palette] || '';
  const fullPrompt = `beautiful renovated kitchen interior, ${stylePrompt}, ${palettePrompt}, premium cabinetry, photorealistic interior design photo, architectural photography, bright natural lighting`;
  const negativePrompt = 'cartoon, sketch, blurry, low quality, watermark, text, people';

  // Use data URI directly — Replicate accepts this
  const dataUri = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

  try {
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait=25' // Wait up to 25s synchronously before falling back to async
      },
      body: JSON.stringify({
        version: 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38',
        input: {
          image: dataUri,
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          num_inference_steps: 20,
          guidance_scale: 12,
          prompt_strength: 0.75,
          num_outputs: 1,
          apply_watermark: false
        }
      })
    });

    const data = await response.json();
    console.log('Replicate response status:', response.status);
    console.log('Prediction status:', data.status, 'ID:', data.id);
    if (data.error) console.error('Replicate error:', data.error);

    if (!response.ok) {
      return res.status(500).json({ error: data.detail || data.error || 'Replicate error' });
    }

    // If completed synchronously (Prefer: wait worked)
    if (data.status === 'succeeded' && data.output) {
      const imageUrl = Array.isArray(data.output) ? data.output[0] : data.output;
      return res.status(200).json({ imageUrl, predictionId: data.id, status: 'succeeded' });
    }

    // Otherwise return ID for polling
    return res.status(200).json({ predictionId: data.id, status: data.status });

  } catch (err) {
    console.error('Render error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};
