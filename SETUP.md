# Google Cloud Setup Guide

This guide walks you through setting up Google Cloud and Google Sheets for the PDP LABAN Membership Form application.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click on the project dropdown at the top
3. Click "NEW PROJECT"
4. Name it "PDP LABAN Membership Form" (or any name you prefer)
5. Click "CREATE"
6. Wait for the project to be created and select it

## 2. Enable Google Sheets API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and then click "ENABLE"
4. Wait for it to enable (about 30 seconds)

## 3. Create a Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the form:
   - Service account name: "pdp-membership-form"
   - Description: "Service account for PDP membership form"
   - Click "CREATE AND CONTINUE"
4. Skip the optional steps and click "DONE"

## 4. Generate a JSON Key

1. In the Credentials page, find your service account in the list
2. Click on it to open the details page
3. Go to the "KEYS" tab
4. Click "Add Key" → "Create new key"
5. Select "JSON" and click "CREATE"
6. A JSON file will be downloaded automatically
7. **Save this file securely** (don't share, don't commit to git)

## 5. Extract Credentials from JSON

Open the downloaded JSON file in a text editor. You'll see something like:

```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "service-account@project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

Copy these values (you'll need them for `.env`):
- `project_id` → `GOOGLE_PROJECT_ID`
- `private_key_id` → `GOOGLE_PRIVATE_KEY_ID`
- `private_key` → `GOOGLE_PRIVATE_KEY`
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `client_id` → `GOOGLE_CLIENT_ID`
- `client_x509_cert_url` → `GOOGLE_CERT_URL`

## 6. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Click "Create" → "Blank spreadsheet"
3. Name it "PDP LABAN Membership Applications"
4. In the first row, add column headers for form fields:
   ```
   First Name | Middle Name | Surname | Birthdate | Birthplace | Age | Gender | Civil Status | Religion | Address | Province | Barangay | Municipality | District | Mobile | Email | Education | School | Year Graduated | Profession | [other fields...]
   ```
5. Keep the spreadsheet open
6. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=0`
   - The SHEET_ID is the long alphanumeric string between `/d/` and `/edit`

## 7. Share the Sheet with Service Account

1. In Google Sheets, click the "Share" button (top right)
2. Copy the `client_email` from your JSON file
3. Paste it in the "Share with people and groups" field
4. Make sure permission is set to "Editor"
5. Uncheck "Notify people"
6. Click "Share"

## 8. Configure the Application

1. Navigate to the `server` folder:
   ```bash
   cd server
   ```

2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

3. Open `server/.env` and fill in the values:
   ```
   PORT=3000
   NODE_ENV=development
   GOOGLE_SHEET_ID=<paste your SHEET_ID here>
   GOOGLE_PROJECT_ID=<paste project_id from JSON>
   GOOGLE_PRIVATE_KEY_ID=<paste private_key_id from JSON>
   GOOGLE_PRIVATE_KEY=<paste private_key from JSON>
   GOOGLE_CLIENT_EMAIL=<paste client_email from JSON>
   GOOGLE_CLIENT_ID=<paste client_id from JSON>
   GOOGLE_CERT_URL=<paste client_x509_cert_url from JSON>
   FRONTEND_URL=http://localhost:5173
   ```

4. **Important**: When copying `GOOGLE_PRIVATE_KEY`, make sure to preserve the `\n` characters. It should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----`

## 9. Run the Application

From the project root directory:

**On Windows:**
```bash
start-dev.bat
```

**On Mac/Linux:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Or manually in separate terminals:**
```bash
# Terminal 1
cd server
npm run dev

# Terminal 2
cd ../client
npm run dev
```

## 10. Test the Application

1. Open http://localhost:5173 in your browser
2. Fill out the form
3. Click "Submit Application"
4. Check your Google Sheet - the data should appear there!

## Troubleshooting

### "Failed to save data to sheet" Error
- **Check 1**: Verify the service account email is shared on the Google Sheet (Editor permission)
- **Check 2**: Confirm Google Sheets API is enabled in Cloud Console
- **Check 3**: Double-check the GOOGLE_SHEET_ID in .env
- **Check 4**: Ensure all Google credentials in .env are correct

### "Cannot find module 'googleapis'"
- Run `npm install` in the server folder
- Verify packages installed: `npm list googleapis`

### "CORS error" in Browser Console
- Make sure FRONTEND_URL in `.env` matches your frontend address
- Check that both backend and frontend are running

### Port Already in Use
- Change the PORT in `server/.env`
- Or kill the process using the port:
  - Windows: `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`
  - Mac/Linux: `lsof -i :3000` then `kill -9 <PID>`

### Still Having Issues?
- Check browser console (F12) for error messages
- Check server terminal for detailed error logs
- Verify all .env values are correctly set
- Make sure the Google Sheet is shared with the service account email
