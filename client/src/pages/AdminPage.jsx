import { useState, useEffect } from 'react';
import { useAdminConfig } from '../hooks/useAdminConfig';
import { useAdminAuth } from '../hooks/useAdminAuth';
import '../styles/admin.css';

function LoginScreen({ onLogin, error }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    await onLogin(password);
    setBusy(false);
  };

  return (
    <div className="admin-page">
      <div className="login-shell">
        <form className="card login-card" onSubmit={submit}>
          <h1>Admin sign in</h1>
          <p className="card-lead">Enter the admin password to view settings.</p>

          <div className="field">
            <label htmlFor="adminPassword">Password</label>
            <input
              id="adminPassword"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={busy || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          {error && <div className="alert alert-error">{error}</div>}
        </form>
      </div>
    </div>
  );
}

function StatusPill({ ok, children }) {
  return (
    <span className={`pill ${ok ? 'pill-ok' : 'pill-warn'}`}>
      <span className="pill-dot" />
      {children}
    </span>
  );
}

function DestinationCard({ config, updateDestination }) {
  const [sheetUrl, setSheetUrl] = useState('');
  const [folderUrl, setFolderUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedVia, setSavedVia] = useState(null); // 'kv' | 'env' | null
  const [manualEnv, setManualEnv] = useState(null);

  // Prefill with the current ids so the fields aren't blank on load.
  useEffect(() => {
    setSheetUrl(config?.sheetId || '');
    setFolderUrl(config?.folderId || '');
  }, [config?.sheetId, config?.folderId]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setSavedVia(null);
    setManualEnv(null);
    try {
      const result = await updateDestination({ sheetUrl, folderUrl });
      if (result.saved) {
        setSavedVia(result.via || 'env');
      } else if (result.needsManualEnv) {
        setManualEnv(result.values || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the destination.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Destination</h2>
        <span className="card-badge badge-muted">Editable</span>
      </div>

      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="sheetUrl">Google Sheet URL or ID</label>
          <input
            id="sheetUrl"
            className="input"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…/edit"
          />
          <p className="hint">Stored as <code>GOOGLE_SHEET_URL</code></p>
        </div>

        <div className="field">
          <label htmlFor="folderUrl">Drive Folder URL or ID (optional)</label>
          <input
            id="folderUrl"
            className="input"
            value={folderUrl}
            onChange={(e) => setFolderUrl(e.target.value)}
            placeholder="https://drive.google.com/drive/folders/… (blank = Drive root)"
          />
          <p className="hint">Stored as <code>GOOGLE_DRIVE_FOLDER_URL</code></p>
        </div>

        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save destination'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {savedVia === 'kv' && (
        <div className="alert alert-success">
          Saved and live now — new submissions use these immediately. No redeploy needed.
        </div>
      )}

      {savedVia === 'env' && (
        <div className="alert alert-success">
          Saved to <code>server/.env</code>. Restart the server for it to take effect.
        </div>
      )}

      {manualEnv && (
        <div className="alert alert-warn">
          <strong>Add these in Vercel → Settings → Environment Variables, then redeploy:</strong>
          <ul className="problem-list">
            {manualEnv.map((v) => (
              <li key={v.key}>
                <code>{v.key}</code> = <code>{v.value}</code>
              </li>
            ))}
          </ul>
          <p className="card-note">
            The server here can’t write files (read-only on Vercel), so these must be set in the dashboard.
          </p>
        </div>
      )}
    </section>
  );
}

export function AdminPage() {
  const auth = useAdminAuth();

  if (auth.checking) {
    return (
      <div className="admin-page">
        <div className="admin-shell">
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  if (auth.authRequired && !auth.authenticated) {
    return <LoginScreen onLogin={auth.login} error={auth.loginError} />;
  }

  return <AdminDashboard onSignOut={auth.logout} showSignOut={auth.authRequired} />;
}

function AdminDashboard({ onSignOut, showSignOut }) {
  const { config, problems, loading, error, connectGoogle, updateDestination } = useAdminConfig();

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-shell">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    );
  }

  const connected = Boolean(config?.isConnected);
  const sheetReady = Boolean(config?.sheetId);
  const ready = connected && sheetReady && problems.length === 0;

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <header className="admin-topbar">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="admin-subtitle">
              Current server configuration.
            </p>
          </div>
          <div className="admin-pills">
            <StatusPill ok={ready}>
              {ready ? 'Accepting submissions' : 'Needs attention'}
            </StatusPill>
            {showSignOut && (
              <button type="button" onClick={onSignOut} className="btn btn-ghost btn-small">
                Sign out
              </button>
            )}
          </div>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {problems.length > 0 && (
          <div className="alert alert-error">
            <strong>Submissions will fail until these are set:</strong>
            <ul className="problem-list">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="card-grid">
          <section className="card">
            <div className="card-head">
              <h2>Google Access</h2>
              <span className={`card-badge ${connected ? '' : 'badge-muted'}`}>
                {connected ? 'Connected' : 'Missing'}
              </span>
            </div>

            <dl className="detail-list">
              <div>
                <dt>Scopes</dt>
                <dd>Drive &amp; Sheets</dd>
              </div>
              <div>
                <dt>Refresh token</dt>
                <dd>{connected ? 'Present' : 'Not set'}</dd>
              </div>
            </dl>

            <button onClick={connectGoogle} className={`btn ${connected ? 'btn-ghost' : 'btn-primary'}`}>
              {connected ? 'Reconnect Google account' : 'Connect Google account'}
            </button>

            <p className="card-note">
              {connected
                ? 'Reconnect to switch accounts, or if uploads start failing because access was revoked.'
                : 'Authorize access so the form can write to your Sheet and store files in Drive.'}
            </p>
          </section>

          <DestinationCard config={config} updateDestination={updateDestination} />
        </div>

        <section className="card card-wide">
          <div className="card-head">
            <h2>How saving works</h2>
          </div>
          <div className="how-grid">
            <div className="how-item">
              <h3>Locally</h3>
              <p>
                Saving writes to <code>server/.env</code> and takes effect right away.
              </p>
            </div>
            <div className="how-item">
              <h3>On Vercel</h3>
              <p>
                The filesystem is read-only, so saving shows the exact values to paste
                into Environment Variables — then redeploy.
              </p>
            </div>
            <div className="how-item">
              <h3>No database</h3>
              <p>
                Everything lives in environment variables, which is why Vercel changes
                need a redeploy to stick.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
