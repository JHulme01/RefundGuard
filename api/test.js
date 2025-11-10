// Ultra-simple test function
export default function handler(req, res) {
  console.log('[test.js] Function invoked!');
  res.status(200).json({ 
    message: 'API is alive!', 
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    env: {
      VERCEL: process.env.VERCEL,
      NODE_VERSION: process.version
    }
  });
}

