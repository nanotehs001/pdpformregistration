import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { FormPage } from './pages/FormPage';
import { AdminPage } from './pages/AdminPage';
import { CardPage } from './pages/CardPage';
import './styles/app.css';

function App() {
  return (
    <Router>
      <div className="app-wrapper">
        <nav className="app-nav">
          <div className="nav-container">
            <h1 className="nav-logo">PDP Membership</h1>
            <ul className="nav-links">
              <li><Link to="/">Member Form</Link></li>
            </ul>
          </div>
        </nav>

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
      </div>
    </Router>
  );
}

export default App;
