export function FormField({ label, error, required, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      {children}
      {error && <div className="error-message">{error.message}</div>}
    </div>
  );
}

export function TextInput({ label, register, name, error, required, type = 'text', readOnly = false }) {
  return (
    <FormField label={label} error={error} required={required}>
      <input
        type={type}
        readOnly={readOnly}
        {...register(name)}
        className={`form-input ${readOnly ? 'input-readonly' : ''} ${error ? 'input-error' : ''}`}
      />
    </FormField>
  );
}

export function SelectInput({ label, register, name, error, required, options }) {
  return (
    <FormField label={label} error={error} required={required}>
      <select
        {...register(name)}
        className={`form-input ${error ? 'input-error' : ''}`}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </FormField>
  );
}

export function CheckboxInput({ label, register, name, error, required }) {
  return (
    <div className="form-group checkbox">
      <label className="checkbox-label">
        <input
          type="checkbox"
          {...register(name)}
          className={`form-checkbox ${error ? 'input-error' : ''}`}
        />
        <span>{label}</span>
      </label>
      {error && <div className="error-message">{error.message}</div>}
    </div>
  );
}

export function TextAreaInput({ label, register, name, error, required }) {
  return (
    <FormField label={label} error={error} required={required}>
      <textarea
        {...register(name)}
        className={`form-input form-textarea ${error ? 'input-error' : ''}`}
        rows={3}
      />
    </FormField>
  );
}
