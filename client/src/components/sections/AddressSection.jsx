import { useEffect, useState } from 'react';
import { TextInput, FormField } from '../FormField';
import {
  fetchRegions,
  fetchProvinces,
  fetchCitiesByRegion,
  fetchCitiesByProvince,
  fetchBarangays
} from '../../api/psgc';

function CascadingSelect({ label, value, onChange, options, disabled, loading, placeholder, error, required }) {
  return (
    <FormField label={label} error={error} required={required}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`form-input ${error ? 'input-error' : ''}`}
      >
        <option value="">{loading ? 'Loading…' : placeholder}</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>{opt.name}</option>
        ))}
      </select>
    </FormField>
  );
}

export function AddressSection({ register, formState, setValue, watch }) {
  const { errors } = formState;

  const [regions, setRegions] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  // Seed from form state so selections survive leaving and returning to this step.
  const [regionCode, setRegionCode] = useState(() => watch('regionCode') || '');
  const [provinceCode, setProvinceCode] = useState(() => watch('provinceCode') || '');
  const [cityCode, setCityCode] = useState(() => watch('cityCode') || '');
  const [barangayCode, setBarangayCode] = useState(() => watch('barangayCode') || '');

  const [loading, setLoading] = useState({ regions: false, provinces: false, cities: false, barangays: false });
  const [loadError, setLoadError] = useState(null);

  const setLoadingFor = (key, isLoading) =>
    setLoading((prev) => ({ ...prev, [key]: isLoading }));

  // Register the values the form actually submits — names, not PSGC codes.
  useEffect(() => {
    register('region');
    register('province');
    register('municipality');
    register('barangay');
    register('regionCode');
    register('provinceCode');
    register('cityCode');
    register('barangayCode');
  }, [register]);

  // Load the region list, plus any dependent lists needed to redisplay a
  // previous selection. Responses are cached, so revisits are instant.
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      setLoadingFor('regions', true);
      try {
        const regionList = await fetchRegions();
        if (cancelled) return;
        setRegions(regionList);

        if (regionCode) {
          const provinceList = await fetchProvinces(regionCode);
          if (cancelled) return;
          setProvinces(provinceList);

          if (provinceList.length === 0) {
            setCities(await fetchCitiesByRegion(regionCode));
          } else if (provinceCode) {
            setCities(await fetchCitiesByProvince(provinceCode));
          }
          if (cancelled) return;

          if (cityCode) {
            setBarangays(await fetchBarangays(cityCode));
          }
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message);
      } finally {
        if (!cancelled) setLoadingFor('regions', false);
      }
    };

    restore();
    return () => { cancelled = true; };
    // Runs once on mount; codes are only read to restore prior selections.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nameFor = (list, code) => list.find((item) => item.code === code)?.name || '';

  const handleRegionChange = async (code) => {
    setRegionCode(code);
    setProvinceCode('');
    setCityCode('');
    setBarangayCode('');
    setProvinces([]);
    setCities([]);
    setBarangays([]);

    setValue('region', nameFor(regions, code), { shouldValidate: true });
    setValue('province', '');
    setValue('municipality', '');
    setValue('barangay', '');
    setValue('regionCode', code);
    setValue('provinceCode', '');
    setValue('cityCode', '');
    setValue('barangayCode', '');

    if (!code) return;

    setLoadError(null);
    setLoadingFor('provinces', true);
    try {
      const provinceList = await fetchProvinces(code);
      setProvinces(provinceList);

      // NCR returns no provinces; its cities attach to the region directly.
      if (provinceList.length === 0) {
        setLoadingFor('cities', true);
        setCities(await fetchCitiesByRegion(code));
        setLoadingFor('cities', false);
      }
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingFor('provinces', false);
    }
  };

  const handleProvinceChange = async (code) => {
    setProvinceCode(code);
    setCityCode('');
    setBarangayCode('');
    setCities([]);
    setBarangays([]);

    setValue('province', nameFor(provinces, code), { shouldValidate: true });
    setValue('municipality', '');
    setValue('barangay', '');
    setValue('provinceCode', code);
    setValue('cityCode', '');
    setValue('barangayCode', '');

    if (!code) return;

    setLoadError(null);
    setLoadingFor('cities', true);
    try {
      setCities(await fetchCitiesByProvince(code));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingFor('cities', false);
    }
  };

  const handleCityChange = async (code) => {
    setCityCode(code);
    setBarangayCode('');
    setBarangays([]);

    setValue('municipality', nameFor(cities, code), { shouldValidate: true });
    setValue('barangay', '');
    setValue('cityCode', code);
    setValue('barangayCode', '');

    if (!code) return;

    setLoadError(null);
    setLoadingFor('barangays', true);
    try {
      setBarangays(await fetchBarangays(code));
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoadingFor('barangays', false);
    }
  };

  const handleBarangayChange = (code) => {
    setBarangayCode(code);
    setValue('barangay', nameFor(barangays, code), { shouldValidate: true });
    setValue('barangayCode', code);
  };

  // NCR and similar province-less regions skip straight to city selection.
  const provinceless = regionCode && !loading.provinces && provinces.length === 0;

  return (
    <section className="form-section">
      <h2>Permanent Address</h2>

      {loadError && (
        <div className="form-error-banner">
          <p>Could not load address list: {loadError}</p>
        </div>
      )}

      <div className="form-row">
        <div className="form-col">
          <CascadingSelect
            label="Region"
            value={regionCode}
            onChange={handleRegionChange}
            options={regions}
            loading={loading.regions}
            placeholder="Select region"
            error={errors.region}
            required
          />
        </div>
        <div className="form-col">
          <CascadingSelect
            label="Province"
            value={provinceCode}
            onChange={handleProvinceChange}
            options={provinces}
            disabled={!regionCode || provinceless}
            loading={loading.provinces}
            placeholder={provinceless ? 'Not applicable' : 'Select province'}
            error={errors.province}
            required={!provinceless}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <CascadingSelect
            label="Municipality / City"
            value={cityCode}
            onChange={handleCityChange}
            options={cities}
            disabled={!cities.length}
            loading={loading.cities}
            placeholder="Select municipality or city"
            error={errors.municipality}
            required
          />
        </div>
        <div className="form-col">
          <CascadingSelect
            label="Barangay"
            value={barangayCode}
            onChange={handleBarangayChange}
            options={barangays}
            disabled={!cityCode}
            loading={loading.barangays}
            placeholder="Select barangay"
            error={errors.barangay}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col full">
          <TextInput
            label="House No. / Street / Subdivision"
            register={register}
            name="permanentAddress"
            error={errors.permanentAddress}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-col">
          <TextInput
            label="District"
            register={register}
            name="district"
            error={errors.district}
          />
        </div>
      </div>
    </section>
  );
}
