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

  // Build a strong style prompt based on user selections
  const stylePrompts = {
    Modern:       'sleek modern kitchen, flat-front handleless cabinets, high-gloss lacquer finish, integrated appliances, monochrome palette, polished concrete countertop, under-cabinet LED lighting',
    Scandinavian: 'scandinavian kitchen, natural oak timber cabinets, warm white walls, open shelving, brass fixtures, linen curtains, herringbone timber floor, hygge aesthetic',
    Shaker:       'shaker style kitchen, classic painted cabinet doors, panel inset, simple bar handles, marble countertop, subway tile splashback, traditional proportions',
    Industrial:   'industrial loft kitchen, dark matte cabinet doors, exposed steel, concrete countertop, matte black hardware, brick splashback, pendant factory lights',
    Neoclassic:   'neoclassical kitchen, ornate raised panel doors, brass gold hardware, marble countertops, cornice detail, rich cream and gold palette, heritage elegance',
    Minimalist:   'minimalist kitchen, push-to-open handleless cabinets, seamless flat surfaces, pure white palette, hidden appliances, calm serene atmosphere, no clutter'
  };

  const palettePrompts = {
    'Warm Neutrals':   'warm linen, putty, taupe colour palette',
    'Cool Whites':     'crisp white, light grey, clean minimal colour palette',
    'Dark & Dramatic': 'dark noir graphite, charcoal, dramatic black palette',
    'Natural Timber':  'natural oak, walnut, warm timber tones palette',
    'Sage & Stone':    'sage green, stone grey, organic nature palette',
    'Rich Navy':       'deep navy blue, gold accents, heritage colour palette'
  };

  const stylePrompt = stylePrompts[style] || stylePrompts.Modern;
  const palettePrompt = palettePrompts[palette] || '';
  const roomPrompt = roomType ? roomType.toLowerCase() : 'kitchen';

  const fullPrompt = `Professional interior design photograph of a beautifully renovated ${roomPrompt}, ${stylePrompt}, ${palettePrompt}, HWH Designs premium cabinetry, photorealistic, 8K quality, architectural photography, bright natural lighting, ultra detailed`;
  const negativePrompt = 'cartoon, sketch, drawing, illustration, blurry, low quality, distorted, deformed, ugly, watermark, text, bad anatomy, cluttered, messy';

  try {
    // Start the prediction using controlnet-tile for structure-preserving img2img
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'batouresearch/magic-image-refiner:507ddf6f977a7e30e46c0daefd30de7d563c72322f9e4cf7cbac52ef0f667b13',
        input: {
          image: `data:${mimeType};base64,${imageBase64}`,
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          strength: 0.65,
          guidance_scale: 10,
          num_inference_steps: 30,
          controlnet_conditioning_scale: 0.8
        }
      })
    });

    const prediction = await startResponse.json();

    if (!startResponse.ok) {
      console.error('Replicate start error:', JSON.stringify(prediction));
      return res.status(500).json({ error: prediction.detail || 'Failed to start render' });
    }

    // Poll for completion (max 90 seconds)
    const predictionId = prediction.id;
    let result = null;
    let attempts = 0;
    const maxAttempts = 45;

    while (attempts < maxAttempts) {
      await new Promise(r => setTimeout(r, 2000));
      attempts++;

      const pollResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
      });

      const pollData = await pollResponse.json();
      console.log(`Poll ${attempts}: ${pollData.status}`);

      if (pollData.status === 'succeeded') {
        result = pollData.output;
        break;
      }

      if (pollData.status === 'failed' || pollData.status === 'canceled') {
        console.error('Render failed:', pollData.error);
        return res.status(500).json({ error: pollData.error || 'Render failed' });
      }
    }

    if (!result) {
      return res.status(504).json({ error: 'Render timed out — please try again' });
    }

    // result is an array of image URLs from Replicate
    const imageUrl = Array.isArray(result) ? result[0] : result;
    return res.status(200).json({ imageUrl });

  } catch (err) {
    console.error('Render handler error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
};
