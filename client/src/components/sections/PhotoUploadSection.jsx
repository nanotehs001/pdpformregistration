import { useState } from 'react';
import { FormField } from '../FormField';

export function PhotoUploadSection({ register, formState, watch, setValue }) {
  const { errors } = formState;
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState(null);

  const [fileError, setFileError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);

    if (file.size > 4 * 1024 * 1024) {
      setFileError('Photo must be smaller than 4MB.');
      e.target.value = '';
      return;
    }

    // Browser File objects expose `type`, not multer's `mimetype`.
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setFileError('Only JPG and PNG photos are allowed.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      setFileName(file.name);
      setValue('profilePhoto', file);
    };
    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPreview(null);
    setFileName(null);
    setFileError(null);
    setValue('profilePhoto', null);
    const input = document.getElementById('profilePhoto');
    if (input) input.value = '';
  };

  return (
    <section className="form-section">
      <h2>Profile Photo</h2>

      <div className="photo-upload-container">
        <FormField label="Upload Photo" error={errors.profilePhoto}>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={handleFileChange}
              className="file-input"
              id="profilePhoto"
            />
            <label htmlFor="profilePhoto" className="file-input-label">
              📷 Choose Photo
            </label>
            <p className="file-input-hint">JPG or PNG, max 4MB</p>
          </div>
        </FormField>

        {fileError && <div className="error-message">{fileError}</div>}

        {preview && (
          <div className="photo-preview-container">
            <h3>Preview</h3>
            <img src={preview} alt="Profile preview" className="photo-preview" />
            <p className="preview-filename">{fileName}</p>
            <button
              type="button"
              onClick={clearPhoto}
              className="btn-remove-photo"
            >
              Remove Photo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
