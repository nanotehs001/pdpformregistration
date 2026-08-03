import { useEffect } from 'react';
import { CheckboxInput, TextInput, FormField } from '../FormField';
import { SignaturePad } from '../SignaturePad';

export function AttestationSection({ register, formState, setValue }) {
  const { errors } = formState;

  useEffect(() => {
    register('signatureImage');
  }, [register]);

  return (
    <section className="form-section">
      <h2>Attestation</h2>

      <div className="attestation-box">
        <p>
          I am aware that the Party has limited resources. If my application for
          membership is approved, I pledge to regularly pay my dues and other fees
          as may be prescribed by the National Council.
        </p>
      </div>

      <CheckboxInput
        label="I agree to the attestation above"
        register={register}
        name="attestationChecked"
        error={errors.attestationChecked}
      />

      <div className="form-row">
        <div className="form-col full">
          <FormField label="Applicant's Signature" error={errors.signatureImage} required>
            <SignaturePad
              onChange={(dataUrl) =>
                setValue('signatureImage', dataUrl, { shouldValidate: true, shouldDirty: true })
              }
              error={errors.signatureImage}
            />
          </FormField>
        </div>
      </div>

      <div className="form-row">
        <div className="form-col full">
          <TextInput
            label="Printed Name"
            register={register}
            name="signature"
            error={errors.signature}
            required
          />
          <p className="field-hint">Type your full name exactly as signed above</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="Recruited by"
            register={register}
            name="recruitedBy"
            error={errors.recruitedBy}
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Recommended by"
            register={register}
            name="recommendedBy"
            error={errors.recommendedBy}
          />
        </div>
      </div>
    </section>
  );
}
