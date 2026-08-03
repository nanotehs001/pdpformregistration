import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL
});

const FIELD_ORDER = [
  'firstName', 'middleName', 'surname', 'birthdate', 'birthplace', 'age',
  'gender', 'civilStatus', 'religion', 'permanentAddress', 'region',
  'province', 'barangay', 'municipality', 'district', 'mobileNumber',
  'email', 'educationalAttainment', 'nameOfSchool', 'yearGraduated',
  'currentProfession', 'signature', 'signatureImageUrl', 'profilePhotoUrl'
];

export async function submitFormData(formData) {
  try {
    // A File object cannot survive JSON.stringify, so the photo is sent as a
    // real multipart part and the rest of the answers ride along as JSON.
    const { profilePhoto, ...rest } = formData;

    const payload = new FormData();
    payload.append('data', JSON.stringify(rest));
    payload.append('fieldOrder', JSON.stringify(FIELD_ORDER));

    if (profilePhoto instanceof File) {
      payload.append('profilePhoto', profilePhoto, profilePhoto.name);
    }

    // Let the browser set Content-Type so the multipart boundary is included.
    const response = await apiClient.post('/submit-form', payload);

    return response.data;
  } catch (error) {
    // `message` carries the specific cause (e.g. no sheet configured);
    // `error` is only a generic label.
    const detail = error.response?.data?.message || error.response?.data?.error;
    if (detail) {
      throw new Error(detail);
    }
    throw new Error('Network error. Please check your connection.');
  }
}
