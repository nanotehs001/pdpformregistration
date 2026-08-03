import { useState } from 'react';
import { MembershipForm } from '../components/MembershipForm';
import { SuccessMessage } from '../components/SuccessMessage';

export function FormPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSuccess = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  return (
    <>
      {submitted ? (
        <SuccessMessage onReset={() => setSubmitted(false)} />
      ) : (
        <MembershipForm onSuccess={handleSuccess} />
      )}
    </>
  );
}
