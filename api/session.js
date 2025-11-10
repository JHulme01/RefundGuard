// Simple session endpoint - no database, no dependencies
export default function handler(req, res) {
  console.log('[session.js] Function invoked!');
  
  // Always return not connected for now (no session management yet)
  res.status(200).json({ 
    connected: false,
    message: 'Session endpoint working!',
    timestamp: new Date().toISOString()
  });
}

