import { CheckboxInput, TextInput } from '../FormField';
import { Controller } from 'react-hook-form';

export function EmploymentSection({ register, formState, watch, control }) {
  const { errors } = formState;

  const electedOfficialChecked = watch('electedOfficial.checked');
  const governmentEmployeeChecked = watch('governmentEmployee.checked');
  const privateEmployeeChecked = watch('privateEmployee.checked');
  const affiliatedChecked = watch('affiliatedOrganization.checked');

  return (
    <section className="form-section">
      <h2>Employment / Affiliation</h2>
      <p className="section-hint">Select at least one category that applies to you</p>

      {/* Elected Official */}
      <div className="subsection">
        <CheckboxInput
          label="Elected Official"
          register={register}
          name="electedOfficial.checked"
        />
        {electedOfficialChecked && (
          <div className="conditional-fields">
            <TextInput
              label="Position"
              register={register}
              name="electedOfficial.position"
              error={errors.electedOfficial?.position}
            />
            <TextInput
              label="Date Elected"
              register={register}
              name="electedOfficial.dateElected"
              type="date"
              error={errors.electedOfficial?.dateElected}
            />
            <TextInput
              label="Place where Elected"
              register={register}
              name="electedOfficial.placeElected"
              error={errors.electedOfficial?.placeElected}
            />
          </div>
        )}
      </div>

      {/* Government Employee */}
      <div className="subsection">
        <CheckboxInput
          label="Government Employee"
          register={register}
          name="governmentEmployee.checked"
        />
        {governmentEmployeeChecked && (
          <div className="conditional-fields">
            <TextInput
              label="Position"
              register={register}
              name="governmentEmployee.position"
              error={errors.governmentEmployee?.position}
            />
            <TextInput
              label="Year Hired"
              register={register}
              name="governmentEmployee.yearHired"
              type="number"
              error={errors.governmentEmployee?.yearHired}
            />
            <TextInput
              label="Office / Agency"
              register={register}
              name="governmentEmployee.office"
              error={errors.governmentEmployee?.office}
            />
          </div>
        )}
      </div>

      {/* Private Employee */}
      <div className="subsection">
        <CheckboxInput
          label="Private Employee"
          register={register}
          name="privateEmployee.checked"
        />
        {privateEmployeeChecked && (
          <div className="conditional-fields">
            <TextInput
              label="Position"
              register={register}
              name="privateEmployee.position"
              error={errors.privateEmployee?.position}
            />
            <TextInput
              label="Office / Company"
              register={register}
              name="privateEmployee.office"
              error={errors.privateEmployee?.office}
            />
          </div>
        )}
      </div>

      {/* Affiliated Organization */}
      <div className="subsection">
        <CheckboxInput
          label="Affiliated Organization"
          register={register}
          name="affiliatedOrganization.checked"
        />
        {affiliatedChecked && (
          <div className="conditional-fields">
            <TextInput
              label="Organization"
              register={register}
              name="affiliatedOrganization.organization"
              error={errors.affiliatedOrganization?.organization}
            />
            <TextInput
              label="Designation"
              register={register}
              name="affiliatedOrganization.designation"
              error={errors.affiliatedOrganization?.designation}
            />
            <TextInput
              label="Year Joined"
              register={register}
              name="affiliatedOrganization.yearJoined"
              type="number"
              error={errors.affiliatedOrganization?.yearJoined}
            />
          </div>
        )}
      </div>

      {errors.employment && (
        <div className="section-error">{errors.employment.message}</div>
      )}
    </section>
  );
}
