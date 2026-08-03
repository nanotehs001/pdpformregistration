import { useState } from 'react';
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

function ReadOnlyValue({ label, value, envVar, empty }) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className={`readonly-value ${value ? '' : 'is-empty'}`}>
        {value || empty}
      </div>
      <p className="hint">
        Set by <code>{envVar}</code>
      </p>
    </div>
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
  const { config, problems, loading, error, connectGoogle } = useAdminConfig();

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

          <section className="card">
            <div className="card-head">
              <h2>Destination</h2>
              <span className="card-badge badge-muted">Read-only</span>
            </div>

            <ReadOnlyValue
              label="Google Sheet ID"
              value={config?.sheetId}
              envVar="GOOGLE_SHEET_URL"
              empty="Not set"
            />

            <ReadOnlyValue
              label="Drive Folder ID"
              value={config?.folderId}
              envVar="GOOGLE_DRIVE_FOLDER_URL"
              empty="Not set — files go to your Drive root"
            />
          </section>
        </div>

        <section className="card card-wide">
          <div className="card-head">
            <h2>Changing these settings</h2>
          </div>
          <div className="how-grid">
            <div className="how-item">
              <h3>Locally</h3>
              <p>
                Edit <code>server/.env</code> and restart the server.
              </p>
            </div>
            <div className="how-item">
              <h3>On Vercel</h3>
              <p>
                Update Environment Variables in the project settings, then redeploy.
              </p>
            </div>
            <div className="how-item">
              <h3>Why read-only</h3>
              <p>
                There is no database, so nothing saved here could survive a restart.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
