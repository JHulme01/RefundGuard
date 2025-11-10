// Ultra-simple test function
export default function handler(req, res) {
  console.log('[test.mjs] Function invoked!');
  res.status(200).json({ 
    message: 'API is alive!', 
    timestamp: new Date().toISOString(),
    env: {
      VERCEL: process.env.VERCEL,
      NODE_VERSION: process.version
    }
  });
}

