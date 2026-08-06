import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { FormPage } from './pages/FormPage';
import { AdminPage } from './pages/AdminPage';
import { CardPage } from './pages/CardPage';
import { InstallPrompt } from './components/InstallPrompt';
import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <InstallPrompt />
        <div className="app-container">
          <Routes>
            <Route path="/" element={<FormPage />} />
            {/* Printable member ID card / QR verification target. */}
            <Route path="/card/:id" element={<CardPage />} />
            {/* Unlinked on purpose — reachable only by typing the URL. */}
            <Route path="/pdpadmin" element={<AdminPage />} />
            {/* Unknown paths (including the old /admin) fall back to the form
                rather than rendering a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        <footer className="app-footer">
          © {new Date().getFullYear()} PDP LABAN Membership — Exclusively made by Region 10. All rights reserved.
        </footer>
      </div>
    </Router>
  );
}

export default App;
