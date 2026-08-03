export function SuccessMessage({ onReset }) {
  return (
    <div className="success-message-container">
      <div className="success-message">
        <div className="success-icon">✓</div>
        <h2>Application Submitted Successfully!</h2>
        <p>
          Thank you for your membership application. We will review your information and contact you soon.
        </p>
        <button onClick={onReset} className="btn-primary">
          Submit Another Application
        </button>
      </div>
    </div>
  );
}
