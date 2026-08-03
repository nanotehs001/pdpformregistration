import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { toPng } from 'html-to-image';
import '../styles/card.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Public printable ID card for a member, reached via /card/:id — the URL stored
 * in the Sheet and encoded in the QR. Reads the record from the API (KV-backed).
 */
export function CardPage() {
  const { id } = useParams();
  const [state, setState] = useState({ status: 'loading', member: null, error: '' });
  const [saving, setSaving] = useState(false);
  const cardRef = useRef(null);

  const saveAsImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    try {
      // Capture only the ID card node (not the whole page).
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement('a');
      link.download = `${id}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Save as image failed:', err);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    let active = true;
    axios
      .get(`${API_BASE_URL}/members/${encodeURIComponent(id)}`)
      .then(({ data }) => {
        if (active) setState({ status: 'ok', member: data, error: '' });
      })
      .catch((err) => {
        if (active) {
          setState({
            status: 'error',
            member: null,
            error: err.response?.data?.error || 'Could not load this card.'
          });
        }
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (state.status === 'loading') {
    return <div className="card-page"><p style={{ textAlign: 'center' }}>Loading…</p></div>;
  }

  if (state.status === 'error') {
    return (
      <div className="card-page">
        <div className="id-card">
          <div className="id-card-banner">
            <img src="/pdp-logo.png" alt="PDP" className="id-card-logo" />
            <span className="id-card-tag">MEMBERSHIP</span>
          </div>
          <div className="id-card-body">
            <h2 className="id-card-name" style={{ color: '#b91c1c' }}>Not found</h2>
            <p className="id-card-location">{state.error}</p>
            <div className="id-card-id">{id}</div>
          </div>
        </div>
      </div>
    );
  }

  const { member } = state;
  const name = (member.fullName || 'Member').toUpperCase();
  const place = (member.location || '').toUpperCase();
  const cardUrl = typeof window !== 'undefined' ? window.location.href : id;

  // Load the photo through the same-origin proxy so the canvas isn't tainted
  // when saving as an image; fall back to the direct Drive URL if that 404s.
  const proxyPhoto = `${API_BASE_URL}/members/${encodeURIComponent(member.id)}/photo`;

  return (
    <div className="card-page">
      <div className="id-card" ref={cardRef}>
        <div className="id-card-banner">
          <img src="/pdp-logo.png" alt="PDP" className="id-card-logo" />
          <span className="id-card-tag">PDP-LABAN MEMBER</span>
        </div>

        <div className="id-card-body">
          {member.photoUrl || member.photoFileId ? (
            <img
              src={proxyPhoto}
              alt={name}
              className="id-card-photo"
              crossOrigin="anonymous"
              onError={(e) => {
                if (member.photoUrl && e.currentTarget.src !== member.photoUrl) {
                  e.currentTarget.src = member.photoUrl;
                }
              }}
            />
          ) : (
            <div className="id-card-photo id-card-photo--empty">No photo</div>
          )}

          <h2 className="id-card-name">{name}</h2>
          {place && <p className="id-card-location">{place}</p>}

          <div className="id-card-qr">
            <QRCodeSVG value={cardUrl} size={168} level="M" />
          </div>

          <div className="id-card-id">{member.id}</div>
        </div>
      </div>

      <div className="card-print-actions">
        <button type="button" className="btn-primary" onClick={saveAsImage} disabled={saving}>
          {saving ? 'Saving…' : '⬇ Save as image'}
        </button>
      </div>
    </div>
  );
}
