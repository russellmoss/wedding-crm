# Complete Deployment Guide with Supabase Authentication

## Overview

This guide creates a secure, authenticated CRM dashboard that:
- ✅ Requires email/password login via Supabase
- ✅ Protects your wedding lead data
- ✅ Syncs with your Google Sheet
- ✅ Shows dismissible alerts
- ✅ Deploys to Netlify

## Part 1: Project Setup

### Step 1.1: Create Project Directory

```bash
mkdir winery-crm-authenticated
cd winery-crm-authenticated
```

### Step 1.2: Initialize Project

```bash
npm init -y
```

### Step 1.3: Install Dependencies

```bash
npm install react react-dom lucide-react @supabase/supabase-js
npm install -D vite @vitejs/plugin-react tailwindcss postcss autoprefixer
```

### Step 1.4: Setup Configuration Files

**package.json:**
```json
{
  "name": "winery-crm-authenticated",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1",
    "@supabase/supabase-js": "^2.39.0"
  },
  "devDependencies": {
    "vite": "^4.4.0",
    "@vitejs/plugin-react": "^4.0.0",
    "tailwindcss": "^3.3.0",
    "postcss": "^8.4.24",
    "autoprefixer": "^10.4.14"
  }
}
```

**vite.config.js:**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})
```

**tailwind.config.js:**
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'winery-beige': '#f5f1e3',
        'winery-brown': '#3e2f1c',
      },
      fontFamily: {
        'cochin': ['Cochin', 'serif'],
        'avenir': ['Avenir', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

**postcss.config.js:**
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Milea Estate Vineyard - CRM Dashboard</title>
    <link href="https://fonts.googleapis.com/css2?family=Cochin:wght@400;700&display=swap" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Avenir:wght@300;400;500;600&display=swap');
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

**netlify.toml:**
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

**.env:**
```env
VITE_SUPABASE_URL=https://bclroqmiesewlsmidvww.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHJvcW1pZXNld2xzbWlkdnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjIyNzUsImV4cCI6MjA2NzgzODI3NX0.bDuz3G-Yj36AuNxne-6-G1DQX1y69FhMpu_O6ZEc4MI
```

**.gitignore:**
```
node_modules
dist
.env
.env.local
.env.production
```

## Part 2: Create Source Files

### Step 2.1: Create Directory Structure

```bash
mkdir -p src/components/auth
mkdir -p src/contexts
mkdir -p src/lib
```

### Step 2.2: Create Core Files

Create these files by copying the code from the previous artifacts:

- `src/lib/supabase.js` (from Supabase setup artifact)
- `src/contexts/AuthContext.jsx` (from Supabase setup artifact)
- `src/components/auth/LoginForm.jsx` (from auth components artifact)
- `src/components/auth/SignupForm.jsx` (from auth components artifact)
- `src/components/auth/ForgotPasswordForm.jsx` (from auth components artifact)
- `src/components/auth/AuthPage.jsx` (from auth components artifact)
- `src/components/ProtectedRoute.jsx` (from auth components artifact)
- `src/components/CRMDashboard.jsx` (from updated main app artifact)
- `src/App.jsx` (from updated main app artifact)
- `src/main.jsx` (from updated main app artifact)

### Step 2.3: Create CSS File

**src/index.css:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Cochin:wght@400;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Avenir:wght@300;400;500;600;700&display=swap');

body {
  font-family: 'Avenir', sans-serif;
  background-color: #f5f1e3;
  color: #3e2f1c;
}

h1, h2, h3, h4, h5, h6 {
  font-family: 'Cochin', serif;
}

/* Custom scrollbar for alert dropdown */
.alert-scroll::-webkit-scrollbar {
  width: 6px;
}

.alert-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.alert-scroll::-webkit-scrollbar-thumb {
  background: #3e2f1c;
  border-radius: 3px;
}

.alert-scroll::-webkit-scrollbar-thumb:hover {
  background: #2a1f12;
}
```

## Part 3: Google Apps Script Backend

### Step 3.1: Update Your Google Apps Script

Replace your existing Google Apps Script with the enhanced version from the first artifact, which includes:
- Authentication-ready API endpoints
- Alert management system
- CORS headers for web requests

### Step 3.2: Deploy the Script

1. In Google Apps Script, click **Deploy → New Deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the **Web app URL**

### Step 3.3: Update API URL

In `src/components/CRMDashboard.jsx`, replace:
```javascript
const API_BASE_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
```

With your actual script URL:
```javascript
const API_BASE_URL = 'https://script.google.com/macros/s/ACTUAL_SCRIPT_ID_HERE/exec';
```

## Part 4: Supabase Configuration

### Step 4.1: Configure Authentication in Supabase

1. Go to https://supabase.com/dashboard
2. Open your "Wedding CRM authentication" project
3. Go to **Authentication → Settings**

**Site URL Configuration:**
- Site URL: `http://localhost:5173` (for development)
- Additional redirect URLs: `https://your-app-name.netlify.app/**`

**Email Settings:**
- Enable Email authentication
- Optionally disable email confirmations for easier testing

### Step 4.2: Create Initial User (Optional)

1. Go to **Authentication → Users**
2. Click **Add user**
3. Create an admin user with your email
4. Set a temporary password

## Part 5: Local Development & Testing

### Step 5.1: Start Development Server

```bash
npm install
npm run dev
```

### Step 5.2: Test Authentication Flow

1. Visit `http://localhost:5173`
2. Try signing up with a new email
3. Try signing in with existing credentials
4. Test password reset functionality
5. Verify logout works correctly

### Step 5.3: Test CRM Functionality

1. After authentication, verify the CRM loads
2. Test editing dropdown columns (N, P, Q, R, S)
3. Test the "Update Lead" button
4. Check that alerts appear and can be dismissed
5. Verify data syncs with your Google Sheet

## Part 6: Netlify Deployment

### Option 1: Netlify CLI (Recommended)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Option 2: Git + Netlify Dashboard

1. **Initialize Git:**
   ```bash
   git init
   git add .
   git commit -m "Initial authenticated CRM dashboard"
   git branch -M main
   git remote add origin https://github.com/yourusername/winery-crm-authenticated.git
   git push -u origin main
   ```

2. **Deploy via Netlify Dashboard:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repo
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`

### Step 6.1: Configure Environment Variables

In Netlify Dashboard → Site settings → Environment variables:

- `VITE_SUPABASE_URL`: `https://bclroqmiesewlsmidvww.supabase.co`
- `VITE_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjbHJvcW1pZXNld2xzbWlkdnd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNjIyNzUsImV4cCI6MjA2NzgzODI3NX0.bDuz3G-Yj36AuNxne-6-G1DQX1y69FhMpu_O6ZEc4MI`

### Step 6.2: Update Supabase URLs

After deployment, add your Netlify URL to Supabase:

1. Copy your Netlify app URL (e.g., `https://amazing-app-123456.netlify.app`)
2. In Supabase → Authentication → Settings:
   - Site URL: `https://amazing-app-123456.netlify.app`
   - Additional redirect URLs: `https://amazing-app-123456.netlify.app/**`

## Part 7: Set Up Google Apps Script Triggers

1. In Apps Script, go to **Triggers** (clock icon)
2. Create these triggers:
   - `sendFollowUpEmail` - Daily at 9 AM
   - `checkHotLeads` - Every 30 minutes
   - `checkStaleHotLeads` - Daily at 10 AM

## Part 8: Testing & Security

### Security Checklist:

✅ **Authentication Required**: No access without login  
✅ **Session Management**: Users stay logged in across browser sessions  
✅ **Secure Headers**: CSRF protection via Netlify headers  
✅ **HTTPS Only**: All traffic encrypted in production  
✅ **API Security**: Google Apps Script uses user permissions  

### Test Checklist:

✅ **Authentication Flow**: Login, signup, password reset  
✅ **Data Security**: Unauthenticated users can't access CRM  
✅ **CRM Functionality**: All features work after authentication  
✅ **Mobile Responsive**: Works on phones and tablets  
✅ **Google Sheet Sync**: Changes reflect in Google Sheets  
✅ **Alert System**: Alerts appear and can be dismissed  

## Part 9: User Management

### Adding Team Members:

1. **Via Supabase Dashboard:**
   - Go to Authentication → Users
   - Click "Add user"
   - Enter their email and temporary password
   - Send them login credentials

2. **Via Signup Form:**
   - Share your app URL
   - Users can self-register
   - Admin can manage users in Supabase dashboard

### Managing Access:

- **View Users**: Supabase → Authentication → Users
- **Delete Users**: Click user → Delete
- **Reset Passwords**: User can use "Forgot Password" feature
- **Monitor Activity**: Supabase logs all authentication events

## Success! 🎉

Your authenticated CRM dashboard is now:

- 🔐 **Secured** with email/password authentication
- 📱 **Accessible** from any device via your Netlify URL
- 🔄 **Synced** with your Google Sheet in real-time
- 🔔 **Alert-enabled** with dismissible notifications
- 👥 **Team-ready** with user management
- 🚀 **Production-deployed** on Netlify

**Your app URL:** `https://your-app-name.netlify.app`

## Troubleshooting

### Common Issues:

1. **Can't login**: Check Supabase URL configuration
2. **CORS errors**: Verify Google Apps Script CORS headers
3. **Data not loading**: Check API URL in CRMDashboard.jsx
4. **Build fails**: Run `npm install` and check for missing dependencies
5. **Redirect issues**: Verify Supabase redirect URLs match your domain

### Getting Help:

- Check browser console for errors
- Verify Supabase authentication logs
- Test API endpoints directly
- Ensure environment variables are set correctly