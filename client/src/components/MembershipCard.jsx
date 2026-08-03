import { QRCodeSVG } from 'qrcode.react';
import '../styles/card.css';

// Human-readable labels for the details summary. Keys not listed here (internal
// PSGC codes, the raw signature image, the File object) are intentionally hidden.
const DETAIL_FIELDS = [
  ['firstName', 'First Name'],
  ['middleName', 'Middle Name'],
  ['surname', 'Surname'],
  ['birthdate', 'Birthdate'],
  ['birthplace', 'Birthplace'],
  ['age', 'Age'],
  ['gender', 'Gender'],
  ['civilStatus', 'Civil Status'],
  ['religion', 'Religion'],
  ['permanentAddress', 'Address'],
  ['barangay', 'Barangay'],
  ['municipality', 'Municipality / City'],
  ['province', 'Province'],
  ['region', 'Region'],
  ['district', 'District'],
  ['mobileNumber', 'Mobile Number'],
  ['email', 'Email'],
  ['educationalAttainment', 'Educational Attainment'],
  ['nameOfSchool', 'School'],
  ['yearGraduated', 'Year Graduated'],
  ['currentProfession', 'Profession'],
  ['signature', 'Printed Name'],
  ['recruitedBy', 'Recruited By'],
  ['recommendedBy', 'Recommended By']
];

export function MembershipCard({ result, onReset }) {
  const {
    membershipId,
    cardUrl,
    fullName,
    location,
    details = {},
    photoDataUrl
  } = result || {};

  const name = (fullName ||
    [details.firstName, details.surname].filter(Boolean).join(' ') ||
    'Member').toUpperCase();

  const place = (location ||
    [details.municipality, details.province].filter(Boolean).join(', ')).toUpperCase();

  const rows = DETAIL_FIELDS
    .map(([key, label]) => [label, details[key]])
    .filter(([, value]) => value !== undefined && value !== null && value !== '');

  return (
    <div className="card-page">
      <div className="id-card">
        <div className="id-card-banner">
          <img src="/pdp-logo.png" alt="PDP" className="id-card-logo" />
          <span className="id-card-tag">PDP-LABAN MEMBER</span>
        </div>

        <div className="id-card-body">
          {photoDataUrl ? (
            <img src={photoDataUrl} alt={name} className="id-card-photo" />
          ) : (
            <div className="id-card-photo id-card-photo--empty">No photo</div>
          )}

          <h2 className="id-card-name">{name}</h2>
          {place && <p className="id-card-location">{place}</p>}

          <div className="id-card-qr">
            <QRCodeSVG value={cardUrl || membershipId || ''} size={168} level="M" />
          </div>

          <div className="id-card-id">{membershipId}</div>
        </div>
      </div>

      <div className="card-confirm">
        <div className="card-confirm-head">
          <div className="success-icon">✓</div>
          <h2>Registration complete</h2>
          <p>Save your Membership ID below. Please screenshot this card for your records.</p>
        </div>

        {rows.length > 0 && (
          <div className="detail-table">
            <h3>Your submitted details</h3>
            <dl>
              {rows.map(([label, value]) => (
                <div className="detail-row" key={label}>
                  <dt>{label}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <button type="button" onClick={onReset} className="btn-primary">
          Register another member
        </button>
      </div>
    </div>
  );
}
