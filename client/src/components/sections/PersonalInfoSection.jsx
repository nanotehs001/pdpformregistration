import { useEffect } from 'react';
import { TextInput, SelectInput } from '../FormField';

// Whole years elapsed, accounting for whether this year's birthday has passed.
function calculateAge(birthdate) {
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }

  return age >= 0 && age < 150 ? age : null;
}

export function PersonalInfoSection({ register, formState, watch, setValue }) {
  const { errors } = formState;
  const birthdate = watch('birthdate');

  useEffect(() => {
    if (!birthdate) return;
    const age = calculateAge(birthdate);
    if (age !== null) {
      setValue('age', age, { shouldValidate: true, shouldDirty: true });
    }
  }, [birthdate, setValue]);

  return (
    <section className="form-section">
      <h2>Personal Information</h2>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="First Name"
            register={register}
            name="firstName"
            error={errors.firstName}
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Middle Name"
            register={register}
            name="middleName"
            error={errors.middleName}
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Surname"
            register={register}
            name="surname"
            error={errors.surname}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="Birthdate"
            register={register}
            name="birthdate"
            error={errors.birthdate}
            type="date"
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Birthplace"
            register={register}
            name="birthplace"
            error={errors.birthplace}
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Age"
            register={register}
            name="age"
            error={errors.age}
            type="number"
            required
            readOnly
          />
          <p className="field-hint">Calculated from your birthdate</p>
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <SelectInput
            label="Gender"
            register={register}
            name="gender"
            error={errors.gender}
            options={['Male', 'Female', 'Other']}
            required
          />
        </div>
        <div className="form-col">
          <SelectInput
            label="Civil Status"
            register={register}
            name="civilStatus"
            error={errors.civilStatus}
            options={['Single', 'Married', 'Divorced', 'Widowed', 'Separated']}
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Religion"
            register={register}
            name="religion"
            error={errors.religion}
            required
          />
        </div>
      </div>
    </section>
  );
}
