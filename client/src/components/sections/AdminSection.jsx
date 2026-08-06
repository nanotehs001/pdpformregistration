import { TextInput, CheckboxInput } from '../FormField';

export function AdminSection({ register, formState }) {
  const { errors } = formState;

  return (
    <section className="form-section admin-section">
      <h2>Admin Section (Staff Only)</h2>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="Provincial Council"
            register={register}
            name="provincialCouncil"
            error={errors.provincialCouncil}
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Regional Council"
            register={register}
            name="regionalCouncil"
            error={errors.regionalCouncil}
          />
        </div>
      </div>

      <CheckboxInput
        label="Approved for BMS"
        register={register}
        name="approvedForBMS"
      />

      <TextInput
        label="BMS Conducted by"
        register={register}
        name="bmsConductedBy"
        error={errors.bmsConductedBy}
      />

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="BMS Held at"
            register={register}
            name="bmsHeldAt"
            error={errors.bmsHeldAt}
          />
        </div>
        <div className="form-col">
          <TextInput
            label="Time"
            register={register}
            name="bmsTime"
            error={errors.bmsTime}
          />
        </div>
      </div>

      <div className="form-row">
        <p className="subsection-title">Trainors</p>
      </div>

      {[0, 1, 2].map((index) => (
        <div key={index} className="trainer-block">
          <h4>Trainor {index + 1}</h4>
          <div className="form-row">
            <div className="form-col">
              <TextInput
                label="Trainor Name"
                register={register}
                name={`trainers.${index}.name`}
                error={errors.trainers?.[index]?.name}
              />
            </div>
            <div className="form-col">
              <TextInput
                label="Topic"
                register={register}
                name={`trainers.${index}.topic`}
                error={errors.trainers?.[index]?.topic}
              />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
