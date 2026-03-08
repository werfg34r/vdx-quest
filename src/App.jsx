import { useEffect, useRef } from 'react';
import { startGame } from './game/engine.js';

function App() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const cleanup = startGame(canvas);
    return cleanup;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        background: '#0a0a1a',
        cursor: 'default',
      }}
    />
  );
}

export default App;
