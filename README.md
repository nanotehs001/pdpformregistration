# PDP Membership Application Form

A modern web application for collecting PDP (Philippine Democratic Party) membership applications. Features complex form handling with conditional employment sections, built with React frontend and Node.js/Express backend that writes directly to Google Sheets.

## Quick Start

### Prerequisites
- Node.js 16+ installed
- Google Cloud Project with Sheets API enabled
- Service account JSON key from Google Cloud
- A Google Sheet to store submissions

### Step 1: Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable the "Google Sheets API"

2. **Create a Service Account**
   - Navigate to "Credentials" in the sidebar
   - Click "Create Credentials" → "Service Account"
   - Fill in the details and create
   - In the service account details, go to "Keys" tab
   - Add a new JSON key and download it
   - Keep this file safe (don't commit to git)

3. **Create a Google Sheet**
   - Open [Google Sheets](https://sheets.google.com) and create a new sheet
   - Add column headers in the first row (they'll be filled by form fields)
   - Share the sheet with your service account email (found in the JSON key file)
   - Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/...`

### Step 2: Application Setup

1. **Install Dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies (in another terminal)
   cd ../client
   npm install
   ```

2. **Configure Environment Variables**
   
   **Backend setup** (`server/.env`):
   ```bash
   # Copy the example and fill in values
   cp .env.example .env
   
   # Edit .env with your Google credentials:
   # - GOOGLE_SHEET_ID: from step 1.3
   # - GOOGLE_PROJECT_ID, GOOGLE_PRIVATE_KEY_ID, GOOGLE_PRIVATE_KEY, 
   #   GOOGLE_CLIENT_EMAIL, GOOGLE_CLIENT_ID, GOOGLE_CERT_URL: from the JSON key file
   ```
   
   **Frontend setup** (`client/.env` - optional, defaults to localhost):
   ```bash
   cp .env.example .env
   # Only needed if backend is on a different host
   ```

### Step 3: Run the Application

```bash
# Terminal 1: Start backend (from server folder)
cd server
npm run dev

# Terminal 2: Start frontend (from client folder)
cd ../client
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

The form is now ready to accept applications. Submitted data will appear in your Google Sheet in real-time.

## Form Structure

The membership form includes:
- **Personal Information** (name, birthdate, age, gender, civil status, religion)
- **Address** (permanent address with province, barangay, municipality, district)
- **Contact** (mobile number, email)
- **Education** (attainment level, school name, graduation year)
- **Current Profession**
- **Employment/Affiliation** (conditional sections for elected officials, government employees, private employees, or affiliated organizations)
- **Attestation** (pledge confirmation and signature)
- **Admin Fields** (staff-filled after approval)

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Form sections and UI components
│   │   ├── schemas/     # Zod validation schemas
│   │   ├── api/         # API client functions
│   │   ├── styles/      # CSS stylesheets
│   │   └── App.jsx      # Main app component
│   └── package.json
│
├── server/              # Node.js/Express backend
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── controllers/ # Request handlers
│   │   ├── services/    # Google Sheets integration
│   │   ├── config/      # Google auth configuration
│   │   └── middleware/  # Validation middleware
│   ├── .env.example     # Environment variables template
│   └── package.json
│
└── README.md
```

## How It Works

1. User fills out the membership form in the browser
2. React validates the form data using Zod schemas
3. Form is submitted to the Express backend (`POST /api/submit-form`)
4. Backend validates again server-side
5. Backend transforms data and appends row to Google Sheet via Sheets API
6. Success message displayed to user
7. New submissions immediately appear in your Google Sheet

## Features

- ✅ Comprehensive membership form with 50+ fields
- ✅ Client-side and server-side validation
- ✅ Conditional employment sections
- ✅ Auto-calculate age from birthdate
- ✅ Real-time data storage in Google Sheets
- ✅ Responsive design (mobile-friendly)
- ✅ Error handling and user feedback
- ✅ Staff section for post-approval processing

## Troubleshooting

**"Failed to save data to sheet" error**
- Verify service account email is shared on the Google Sheet
- Check Google Sheets API is enabled in Cloud Console
- Verify GOOGLE_SHEET_ID in .env is correct

**Form not submitting**
- Check browser console for validation errors
- Ensure backend is running on port 3000
- Verify CORS is properly configured in server

**Port already in use**
- Change PORT in `server/.env`
- Change port in `client/vite.config.js`
