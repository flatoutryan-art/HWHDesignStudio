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
    Modern:       'sleek modern kitchen, flat-front handleless cabinets, high-gloss lacquer, integrated appliances, monochrome palette, LED lighting, polished surfaces',
    Scandinavian: 'scandinavian kitchen, natural oak timber cabinets, warm white walls, open shelving, brass fixtures, herringbone timber floor, hygge aesthetic',
    Shaker:       'shaker style kitchen, classic painted cabinet doors, panel inset, bar handles, marble countertop, subway tile splashback, timeless proportions',
    Industrial:   'industrial loft kitchen, dark matte cabinet doors, exposed steel, concrete countertop, matte black hardware, brick splashback, factory pendant lights',
    Neoclassic:   'neoclassical kitchen, ornate raised panel doors, brass gold hardware, marble countertops, cornice moulding, rich cream and gold palette, elegant heritage',
    Minimalist:   'minimalist kitchen, handleless push-to-open cabinets, seamless flat surfaces, pure white palette, hidden appliances, serene calm atmosphere'
  };

  const palettePrompts = {
    'Warm Neutrals':   'warm linen putty taupe colour palette',
    'Cool Whites':     'crisp white light grey minimal colour palette',
    'Dark & Dramatic': 'dark noir graphite charcoal black palette',
    'Natural Timber':  'natural oak walnut warm timber tones',
    'Sage & Stone':    'sage green stone grey organic nature palette',
    'Rich Navy':       'deep navy blue gold accents heritage palette'
  };

  const stylePrompt = stylePrompts[style] || stylePrompts.Modern;
  const palettePrompt = palettePrompts[palette] || '';
  const roomPrompt = roomType ? roomType.toLowerCase() : 'kitchen';
  const fullPrompt = `A beautifully redesigned ${roomPrompt}, ${stylePrompt}, ${palettePrompt}, HWH Designs premium cabinetry, photorealistic interior design photography, professional architectural photo, bright natural lighting`;
  const negativePrompt = 'cartoon, sketch, blurry, low quality, distorted, watermark, text, people';

  try {
    // Step 1: Upload image to Replicate's file storage to get a URL
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    
    const uploadResponse = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': mimeType || 'image/jpeg'
      },
      body: imageBuffer
    });

    const uploadData = await uploadResponse.json();
    console.log('Upload response:', uploadResponse.status, uploadData.id, uploadData.urls);

    if (!uploadResponse.ok || !uploadData.urls?.get) {
      console.error('Upload failed:', JSON.stringify(uploadData));
      return res.status(500).json({ error: 'Failed to upload image: ' + (uploadData.detail || 'unknown error') });
    }

    const imageUrl = uploadData.urls.get;

    // Step 2: Start the prediction with the hosted URL
    const startResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: 'adirik/interior-design:76604baddc85b1b4616e1c6475eca080da339c8875bd4996705440484a6eac38',
        input: {
          image: imageUrl,
          prompt: fullPrompt,
          negative_prompt: negativePrompt,
          num_inference_steps: 30,
          guidance_scale: 15,
          prompt_strength: 0.8,
          num_outputs: 1,
          apply_watermark: false
        }
      })
    });

    const prediction = await startResponse.json();
    console.log('Prediction started:', prediction.id, prediction.status, prediction.error);

    if (!startResponse.ok || prediction.error) {
      return res.status(500).json({ error: prediction.detail || prediction.error || 'Failed to start render' });
    }

    return res.status(200).json({ predictionId: prediction.id, status: prediction.status });

  } catch (err) {
    console.error('Render error:', err.message);
    return res.status(500).json({ error: err.message });
  }
};

module.exports.config = {
  api: { bodyParser: { sizeLimit: '20mb' } }
};