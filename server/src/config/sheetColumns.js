/**
 * Canonical sheet layout — the single source of truth for both the header row
 * and the order of values in each submission.
 *
 * Defining these together is deliberate: when the header and the row builder
 * are separate lists they drift, and data silently lands under the wrong
 * heading. Add new fields at the END so existing sheets stay aligned.
 */
export const SHEET_COLUMNS = [
  { key: 'submittedAt', label: 'Submitted At' },
  { key: 'firstName', label: 'First Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'surname', label: 'Surname' },
  { key: 'birthdate', label: 'Birthdate' },
  { key: 'birthplace', label: 'Birthplace' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'civilStatus', label: 'Civil Status' },
  { key: 'religion', label: 'Religion' },
  { key: 'permanentAddress', label: 'House/Street' },
  { key: 'region', label: 'Region' },
  { key: 'province', label: 'Province' },
  { key: 'municipality', label: 'Municipality / City' },
  { key: 'barangay', label: 'Barangay' },
  { key: 'district', label: 'District' },
  { key: 'mobileNumber', label: 'Mobile Number' },
  { key: 'email', label: 'Email Address' },
  { key: 'educationalAttainment', label: 'Educational Attainment' },
  { key: 'nameOfSchool', label: 'Name of School' },
  { key: 'yearGraduated', label: 'Year Graduated' },
  { key: 'currentProfession', label: 'Current Profession' },
  { key: 'employmentType', label: 'Employment Type' },
  { key: 'employmentPosition', label: 'Position / Designation' },
  { key: 'employmentOffice', label: 'Office / Organization' },
  { key: 'employmentDetail', label: 'Employment Detail' },
  { key: 'signature', label: 'Printed Name' },
  { key: 'signatureImageUrl', label: 'Signature Image' },
  { key: 'profilePhotoUrl', label: 'Profile Photo' },
  { key: 'recruitedBy', label: 'Recruited By' },
  { key: 'recommendedBy', label: 'Recommended By' },
  { key: 'membershipId', label: 'Membership ID' },
  { key: 'cardUrl', label: 'Card URL (print)' }
];

export const SHEET_HEADERS = SHEET_COLUMNS.map((column) => column.label);
export const SHEET_KEYS = SHEET_COLUMNS.map((column) => column.key);

/**
 * Flattens the four mutually-exclusive employment sections into the shared
 * columns above, so one application always occupies exactly one row.
 */
function flattenEmployment(data) {
  const sections = [
    { type: 'Elected Official', src: data.electedOfficial, position: 'position', office: 'placeElected', detail: 'dateElected' },
    { type: 'Government Employee', src: data.governmentEmployee, position: 'position', office: 'office', detail: 'yearHired' },
    { type: 'Private Employee', src: data.privateEmployee, position: 'position', office: 'office', detail: null },
    { type: 'Affiliated Organization', src: data.affiliatedOrganization, position: 'designation', office: 'organization', detail: 'yearJoined' }
  ];

  const active = sections.filter((section) => section.src?.checked);
  if (active.length === 0) {
    return { employmentType: '', employmentPosition: '', employmentOffice: '', employmentDetail: '' };
  }

  return {
    employmentType: active.map((s) => s.type).join('; '),
    employmentPosition: active.map((s) => s.src[s.position] || '').filter(Boolean).join('; '),
    employmentOffice: active.map((s) => s.src[s.office] || '').filter(Boolean).join('; '),
    employmentDetail: active.map((s) => (s.detail ? s.src[s.detail] : '') || '').filter(Boolean).join('; ')
  };
}

/** Builds one sheet row in SHEET_COLUMNS order. */
export function buildSheetRow(data) {
  const enriched = {
    ...data,
    ...flattenEmployment(data),
    submittedAt: new Date().toISOString()
  };

  return SHEET_KEYS.map((key) => {
    const value = enriched[key];
    if (value === undefined || value === null) return '';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  });
}
