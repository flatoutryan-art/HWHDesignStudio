// Debug endpoint — tests Replicate connection with a sample image
module.exports = async function handler(req, res) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  
  if (!REPLICATE_API_TOKEN) {
    return res.status(200).json({ 
      status: 'ERROR', 
      message: 'REPLICATE_API_TOKEN not set' 
    });
  }

  try {
    // Test 1: Check account
    const accountRes = await fetch('https://api.replicate.com/v1/account', {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    const accountData = await accountRes.json();

    // Test 2: Check model exists
    const modelRes = await fetch('https://api.replicate.com/v1/models/adirik/interior-design', {
      headers: { 'Authorization': `Token ${REPLICATE_API_TOKEN}` }
    });
    const modelData = await modelRes.json();

    return res.status(200).json({
      status: 'OK',
      token_prefix: REPLICATE_API_TOKEN.substring(0, 6) + '...',
      account: accountRes.ok ? { username: accountData.username } : { error: accountData.detail },
      model: modelRes.ok ? { name: modelData.name, latest_version: modelData.latest_version?.id?.substring(0,8) } : { error: modelData.detail }
    });

  } catch (err) {
    return res.status(200).json({ status: 'ERROR', message: err.message });
  }
};
