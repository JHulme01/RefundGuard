// Minimal test version to debug the blank screen
import { useState, useEffect } from 'react';

function App() {
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    setStatus('App mounted successfully!');
    
    // Test API call
    fetch('/api/test')
      .then(res => {
        console.log('Response status:', res.status);
        return res.text();
      })
      .then(text => {
        console.log('Response text:', text);
        try {
          const data = JSON.parse(text);
          setStatus(`API working! Message: ${data.message}`);
        } catch (e) {
          setError(`Not JSON. Got: ${text.substring(0, 100)}`);
          setStatus('API responded but not with JSON');
        }
      })
      .catch(err => {
        setError(err.message);
        setStatus('API call failed completely');
      });
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      background: '#0f172a',
      color: 'white',
      fontFamily: 'system-ui',
      padding: '20px'
    }}>
      <h1>RefundGuard Debug</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>{status}</p>
      {error && <p style={{ color: '#ef4444', marginTop: '10px' }}>Error: {error}</p>}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        background: '#1e293b', 
        borderRadius: '8px',
        maxWidth: '600px'
      }}>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          If you see this screen, React is working correctly. If the API call succeeds, 
          the backend is also working. If you see "API call failed", there's a backend issue.
        </p>
      </div>
    </div>
  );
}

export default App;

