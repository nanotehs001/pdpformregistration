import { useEffect, useState } from 'react';

// True when already running as an installed app, so we don't nag installed users.
function isStandalone() {
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

const DISMISS_KEY = 'pdp_install_dismissed';

/**
 * Shows a top "Install" button and a one-time popup inviting the user to add the
 * app to their Android launcher / PC desktop. Uses the browser's
 * beforeinstallprompt event (Chrome/Edge on Android and desktop).
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [installed, setInstalled] = useState(isStandalone());
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      try {
        if (!localStorage.getItem(DISMISS_KEY)) setShowPopup(true);
      } catch {
        setShowPopup(true);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setShowPopup(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try {
      await deferred.userChoice;
    } catch {
      /* user dismissed */
    }
    setDeferred(null);
    setShowPopup(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  const dismissPopup = () => {
    setShowPopup(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  // Nothing to offer if installed or the browser hasn't signalled installability.
  if (installed || !deferred) return null;

  return (
    <>
      <div className="install-bar">
        <div className="install-bar-inner">
          <img src="/icon-192.png" alt="" className="install-bar-icon" />
          <span className="install-bar-text">Install the PDP LABAN app</span>
          <button type="button" className="install-bar-btn" onClick={install}>
            ⬇ Install
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="install-modal-overlay" role="dialog" aria-modal="true">
          <div className="install-modal">
            <img src="/icon-192.png" alt="" className="install-modal-icon" />
            <h3>Add PDP LABAN to your device</h3>
            <p>
              Install this app for quick access — it adds an icon to your Android
              launcher or a shortcut on your PC desktop.
            </p>
            <div className="install-modal-actions">
              <button type="button" className="btn-secondary" onClick={dismissPopup}>
                Not now
              </button>
              <button type="button" className="btn-primary" onClick={install}>
                ⬇ Install app
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
