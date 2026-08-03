import { useState } from 'react';
import { MembershipForm } from '../components/MembershipForm';
import { MembershipCard } from '../components/MembershipCard';

export function FormPage() {
  const [result, setResult] = useState(null);

  if (result) {
    return <MembershipCard result={result} onReset={() => setResult(null)} />;
  }

  return <MembershipForm onSuccess={setResult} />;
}
