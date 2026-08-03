import { SelectInput, TextInput } from '../FormField';

export function EducationSection({ register, formState }) {
  const { errors } = formState;

  return (
    <section className="form-section">
      <h2>Educational Attainment</h2>

      <div className="form-row">
        <div className="form-col">
          <SelectInput
            label="Educational Attainment"
            register={register}
            name="educationalAttainment"
            error={errors.educationalAttainment}
            options={['Elementary', 'High School', 'Vocational', 'Associate', 'Bachelor', 'Master', 'Doctorate']}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="Name of School"
            register={register}
            name="nameOfSchool"
            error={errors.nameOfSchool}
            required
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Year Graduated"
            register={register}
            name="yearGraduated"
            error={errors.yearGraduated}
            type="number"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col full">
          <TextInput
            label="Current Profession"
            register={register}
            name="currentProfession"
            error={errors.currentProfession}
            required
          />
        </div>
      </div>
    </section>
  );
}
