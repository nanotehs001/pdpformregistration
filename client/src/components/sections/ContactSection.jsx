import { TextInput } from '../FormField';

export function ContactSection({ register, formState }) {
  const { errors } = formState;

  return (
    <section className="form-section">
      <h2>Contact Information</h2>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="Mobile Number"
            register={register}
            name="mobileNumber"
            error={errors.mobileNumber}
            type="tel"
            required
          />
          <p className="field-hint">Format: +639123456789 or 09123456789</p>
        </div>
        <div className="form-col">
          <TextInput
            label="Email Address"
            register={register}
            name="email"
            error={errors.email}
            type="email"
            required
          />
        </div>
      </div>
    </section>
  );
}
