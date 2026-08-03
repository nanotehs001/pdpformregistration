import { z } from 'zod';

const philippineMobileRegex = /^(\+63|0)9\d{9}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const membershipFormSchema = z.object({
  // Personal Information (all mandatory)
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().min(1, 'Middle name is required'),
  surname: z.string().min(1, 'Surname is required'),
  birthdate: z.string().min(1, 'Birthdate is required'),
  birthplace: z.string().min(1, 'Birthplace is required'),
  age: z.coerce.number().min(18, 'Must be at least 18 years old'),
  gender: z.enum(['Male', 'Female', 'Other'], { errorMap: () => ({ message: 'Gender is required' }) }),
  civilStatus: z.enum(['Single', 'Married', 'Divorced', 'Widowed', 'Separated'], { errorMap: () => ({ message: 'Civil status is required' }) }),
  religion: z.string().min(1, 'Religion is required'),

  // Address (all mandatory except province, which NCR lacks)
  permanentAddress: z.string().min(1, 'Permanent address is required'),
  region: z.string().min(1, 'Region is required'),
  province: z.string().optional(),
  barangay: z.string().min(1, 'Barangay is required'),
  municipality: z.string().min(1, 'Municipality/City is required'),
  district: z.string().min(1, 'District is required'),

  // Uploaded File object. Must be declared or Zod strips it from the parsed
  // output and the photo never reaches the submit handler.
  profilePhoto: z.any().optional(),

  // PSGC codes backing the address dropdowns (not submitted to the sheet)
  regionCode: z.string().optional(),
  provinceCode: z.string().optional(),
  cityCode: z.string().optional(),
  barangayCode: z.string().optional(),

  // Contact (all mandatory)
  mobileNumber: z.string().regex(philippineMobileRegex, 'Valid Philippine mobile number required (e.g., +639123456789)'),
  email: z.string().email('Valid email address required'),

  // Education (all mandatory)
  educationalAttainment: z.enum(['Elementary', 'High School', 'Vocational', 'Associate', 'Bachelor', 'Master', 'Doctorate'], { errorMap: () => ({ message: 'Educational attainment is required' }) }),
  nameOfSchool: z.string().min(1, 'Name of school is required'),
  yearGraduated: z.coerce.number().min(1950).max(new Date().getFullYear(), 'Valid year required'),

  // Current Profession (mandatory)
  currentProfession: z.string().min(1, 'Current profession is required'),

  // Employment Sections (at least one must have data)
  electedOfficial: z.object({
    checked: z.boolean(),
    position: z.string().optional(),
    dateElected: z.string().optional(),
    placeElected: z.string().optional()
  }).optional(),

  governmentEmployee: z.object({
    checked: z.boolean(),
    position: z.string().optional(),
    yearHired: z.coerce.number().optional(),
    office: z.string().optional()
  }).optional(),

  privateEmployee: z.object({
    checked: z.boolean(),
    position: z.string().optional(),
    office: z.string().optional()
  }).optional(),

  affiliatedOrganization: z.object({
    checked: z.boolean(),
    organization: z.string().optional(),
    designation: z.string().optional(),
    yearJoined: z.coerce.number().optional()
  }).optional(),

  // Attestation (mandatory)
  attestationChecked: z.boolean().refine(val => val === true, 'You must confirm the attestation'),
  signature: z.string().min(1, 'Printed name is required'),
  signatureImage: z.string().min(1, 'Please draw your signature'),

  // Recruitment info (optional)
  recruitedBy: z.string().optional(),
  recommendedBy: z.string().optional(),

  // Admin fields (optional, staff-filled)
  provincialCouncil: z.string().optional(),
  regionalCouncil: z.string().optional(),
  approvedForBMS: z.boolean().optional(),
  bmsConductedBy: z.string().optional(),
  trainers: z.array(z.object({
    name: z.string().optional(),
    topic: z.string().optional()
  })).length(3).optional()
});
