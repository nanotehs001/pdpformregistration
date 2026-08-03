import { useEffect, useRef, useState } from 'react';

/**
 * Draw-to-sign canvas. Emits a PNG data URL via onChange, or null when cleared.
 * Uses pointer events so one code path covers mouse, touch and stylus.
 */
export function SignaturePad({ onChange, error }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Size the backing store to the device pixel ratio, otherwise strokes look
  // blurry on phones and the exported image is low-res.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const { width } = canvas.getBoundingClientRect();
      const height = 200;

      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#1a1a1a';
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const positionOf = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const startStroke = (event) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;

    const { x, y } = positionOf(event);
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const continueStroke = (event) => {
    if (!drawingRef.current) return;
    event.preventDefault();

    const { x, y } = positionOf(event);
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endStroke = (event) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    canvasRef.current.releasePointerCapture?.(event.pointerId);

    setHasSignature(true);
    onChange(canvasRef.current.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  };

  return (
    <div className="signature-pad">
      <canvas
        ref={canvasRef}
        className={`signature-canvas ${error ? 'input-error' : ''}`}
        onPointerDown={startStroke}
        onPointerMove={continueStroke}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />

      <div className="signature-actions">
        <span className="signature-status">
          {hasSignature ? '✓ Signature captured' : 'Draw your signature above'}
        </span>
        <button type="button" onClick={clear} className="btn-link" disabled={!hasSignature}>
          Clear
        </button>
      </div>

      {error && <div className="error-message">{error.message}</div>}
    </div>
  );
}
