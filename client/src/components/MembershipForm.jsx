import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { membershipFormSchema } from '../schemas/membershipFormSchema';
import { PersonalInfoSection } from './sections/PersonalInfoSection';
import { AddressSection } from './sections/AddressSection';
import { ContactSection } from './sections/ContactSection';
import { PhotoUploadSection } from './sections/PhotoUploadSection';
import { EducationSection } from './sections/EducationSection';
import { EmploymentSection } from './sections/EmploymentSection';
import { AttestationSection } from './sections/AttestationSection';
import { AdminSection } from './sections/AdminSection';
import { submitFormData } from '../api/submitForm';
import { useState } from 'react';

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const STEPS = [
  { id: 1, title: 'Personal Information', description: 'Your basic details' },
  { id: 2, title: 'Address & Photo', description: 'Where you live + profile photo' },
  { id: 3, title: 'Contact & Education', description: 'How to reach you' },
  { id: 4, title: 'Employment', description: 'Your work history' },
  { id: 5, title: 'Attestation', description: 'Confirm and sign' }
];

export function MembershipForm({ onSuccess }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const {
    register,
    handleSubmit,
    formState,
    watch,
    reset,
    control,
    setValue,
    trigger
  } = useForm({
    resolver: zodResolver(membershipFormSchema),
    mode: 'onChange',
    defaultValues: {
      electedOfficial: { checked: false },
      governmentEmployee: { checked: false },
      privateEmployee: { checked: false },
      affiliatedOrganization: { checked: false },
      trainers: [
        { name: '', topic: '' },
        { name: '', topic: '' },
        { name: '', topic: '' }
      ]
    }
  });

  // Define fields for each step
  const stepFields = {
    1: ['firstName', 'middleName', 'surname', 'birthdate', 'birthplace', 'age', 'gender', 'civilStatus', 'religion'],
    2: ['permanentAddress', 'region', 'barangay', 'municipality', 'district', 'profilePhoto'],
    3: ['mobileNumber', 'email', 'educationalAttainment', 'nameOfSchool', 'yearGraduated', 'currentProfession'],
    4: ['electedOfficial', 'governmentEmployee', 'privateEmployee', 'affiliatedOrganization'],
    5: ['attestationChecked', 'signature', 'signatureImage', 'recruitedBy', 'recommendedBy']
  };

  const handleNext = async () => {
    const fieldsToValidate = stepFields[currentStep];
    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await submitFormData(data);
      // Capture the chosen photo as a data URL before reset() clears it, so the
      // confirmation card can show it immediately without waiting on Drive.
      const photoDataUrl =
        data.profilePhoto instanceof File ? await fileToDataUrl(data.profilePhoto) : '';
      onSuccess({ ...result, details: data, photoDataUrl });
      reset();
    } catch (error) {
      setSubmitError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // react-hook-form calls this when validation blocks submission. Without it,
  // a failing field on a hidden step (or the top-level employment refine, whose
  // error has no rendered field) makes the Submit button appear to do nothing.
  const onInvalid = (errors) => {
    const readable = {
      firstName: 'First name', middleName: 'Middle name', surname: 'Surname',
      birthdate: 'Birthdate', birthplace: 'Birthplace', age: 'Age',
      gender: 'Gender', civilStatus: 'Civil status', religion: 'Religion',
      permanentAddress: 'Permanent address', region: 'Region', barangay: 'Barangay',
      municipality: 'Municipality/City', district: 'District',
      mobileNumber: 'Mobile number', email: 'Email',
      educationalAttainment: 'Educational attainment', nameOfSchool: 'School',
      yearGraduated: 'Year graduated', currentProfession: 'Current profession',
      employment: 'Employment (fill at least one section with a position/organization)',
      attestationChecked: 'Attestation checkbox', signature: 'Printed name',
      signatureImage: 'Signature drawing'
    };

    const labels = Object.keys(errors).map((key) => readable[key] || key);
    setSubmitError(
      `Please complete these before submitting: ${labels.join(', ')}.`
    );
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="membership-form">
      <div className="form-header">
        <h1>PDP Membership Application Form</h1>
        <p className="form-subtitle">Philippine Democratic Party</p>
      </div>

      {/* Progress Indicator */}
      <div className="progress-container">
        <div className="progress-steps">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
            >
              <div className="step-number">{step.id}</div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(currentStep / STEPS.length) * 100}%` }}></div>
        </div>
      </div>

      {/* Step Content */}
      <div className="step-content">
        {currentStep === 1 && (
          <PersonalInfoSection register={register} formState={formState} watch={watch} setValue={setValue} />
        )}
        {currentStep === 2 && (
          <>
            <AddressSection register={register} formState={formState} setValue={setValue} watch={watch} />
            <PhotoUploadSection register={register} formState={formState} watch={watch} setValue={setValue} />
          </>
        )}
        {currentStep === 3 && (
          <>
            <ContactSection register={register} formState={formState} />
            <EducationSection register={register} formState={formState} />
          </>
        )}
        {currentStep === 4 && (
          <EmploymentSection register={register} formState={formState} watch={watch} control={control} />
        )}
        {currentStep === 5 && (
          <>
            <AttestationSection register={register} formState={formState} setValue={setValue} />
            <AdminSection register={register} formState={formState} />
          </>
        )}
      </div>

      {submitError && (
        <div className="form-error-banner">
          <p>{submitError}</p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="form-navigation">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={handlePrevious}
            className="btn-secondary"
          >
            ← Previous
          </button>
        )}

        {currentStep < STEPS.length && (
          <button
            type="button"
            onClick={handleNext}
            className="btn-primary"
          >
            Next →
          </button>
        )}

        {currentStep === STEPS.length && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary btn-submit"
          >
            {isSubmitting ? 'Submitting...' : '✓ Submit Application'}
          </button>
        )}
      </div>
    </form>
  );
}
