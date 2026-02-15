# Vercel Deployment Guide for Ambaturide Backend

## Prerequisites

1. **Database Setup** (choose one):
   - **PlanetScale** (recommended): Free tier with built-in connection pooling
   - **Railway**: Simple MySQL hosting with free tier
   - **AWS RDS**: Production-grade, pay-as-you-go
   - **Azure Database for MySQL**: Enterprise option

2. **Cloudinary Account** (for image uploads):
   - Sign up free at [cloudinary.com](https://cloudinary.com)
   - Get your Cloud Name, API Key, and API Secret from the dashboard

## Deployment Steps

### 1. Prepare Your Environment Variables

Create a `.env` file locally (already in `.gitignore`):

```env
# Database
DB_HOST=your-database-host.com
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=ambaturide_db
DB_PORT=3306
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true

# Application
NODE_ENV=production
PORT=3001
CLIENT_ORIGIN=https://your-frontend-domain.vercel.app

# JWT Authentication
JWT_SECRET=generate-a-secure-random-string-here-at-least-32-chars
JWT_EXPIRES_IN=7d

# Cloudinary (required for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 2. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm install -g vercel
vercel login
vercel
```

**Option B: Using Git Integration**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your repository
5. Configure environment variables (see step 3)

### 3. Configure Environment Variables in Vercel

In Vercel Dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable from your `.env` file:

**Database:**
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- `DB_SSL`
- `DB_SSL_REJECT_UNAUTHORIZED`

**Authentication:**
- `JWT_SECRET` (generate with: `openssl rand -base64 32`)
- `JWT_EXPIRES_IN` (e.g., "7d" for 7 days)

**Cloudinary:**
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Other:**
- `CLIENT_ORIGIN` (your frontend URL)
- `NODE_ENV` (set to "production")

### 4. Database Provider Examples

**PlanetScale:**
```env
DB_HOST=aws.connect.psdb.cloud
DB_USER=your-username
DB_PASSWORD=pscale_pw_xxxxxxxxxxxx
DB_NAME=ambaturide_db
DB_PORT=3306
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

**Railway:**
```env
DB_HOST=containers-us-west-xxx.railway.app
DB_USER=root
DB_PASSWORD=xxxxxxxxxxxxx
DB_NAME=railway
DB_PORT=6543
DB_SSL=false
DB_SSL_REJECT_UNAUTHORIZED=false
```

## Architecture Overview

### Serverless-Compatible Design

This backend has been refactored for Vercel serverless deployment:

1. **Stateless Authentication (JWT)**
   - No server-side sessions
   - Tokens stored in HTTP-only cookies
   - 7-day expiration by default

2. **Cloud Image Storage (Cloudinary)**
   - Profile pictures, driver licenses, vehicle images
   - Automatic image optimization
   - No local filesystem dependency

3. **Connection Pooling**
   - mysql2 pool with automatic reconnection
   - SSL support for cloud databases

## Frontend Integration

### Updating API URL

Before deploying, update your frontend API configuration to use the Vercel deployment URL:

```javascript
// In src/api/api.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

Then add `VITE_API_URL` to your Vercel environment variables.

### JWT Token Handling

The backend uses JWT tokens stored in HTTP-only cookies. The frontend doesn't need to manage tokens manually.

**Important:** Ensure `credentials: 'include'` is set in your axios/fetch calls:

```javascript
axios.defaults.withCredentials = true;
```

## Testing Locally

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your local database and Cloudinary credentials

3. Run the development server:
```bash
node src/Backend/server.js
```

## Migration Checklist

- [x] Replace `createConnection` with `createPool`
- [x] Convert all `db.query` to `await pool.query`
- [x] Add `async` to all route handlers
- [x] Move credentials to environment variables
- [x] Add SSL configuration
- [x] Export app for Vercel
- [x] Migrate all db.query calls to pool.query
- [x] Replace file uploads with Cloudinary
- [x] Replace sessions with JWT authentication
- [ ] Update frontend API URL to Vercel deployment URL

## Helpful Commands

```bash
# Install dependencies
npm install

# Test locally
node src/Backend/server.js

# Deploy to Vercel
vercel --prod

# View logs
vercel logs

# Generate JWT secret
openssl rand -base64 32
```

## Troubleshooting

**CORS Error after deployment:**
- Ensure `CLIENT_ORIGIN` matches your frontend URL exactly
- Check for trailing slashes

**Database connection failed:**
- Verify DB credentials are correct
- Check if your IP needs to be whitelisted
- For PlanetScale/Railway, ensure `DB_SSL=true`

**Image upload failed:**
- Verify Cloudinary credentials
- Check the Cloudinary dashboard for upload limits

**401 Unauthorized on protected routes:**
- Ensure cookies are being sent (`credentials: 'include'`)
- Check if the JWT has expired
- Verify JWT_SECRET matches between environments

## Security Best Practices

1. ✅ Never commit `.env` to git
2. ✅ Use strong, random `JWT_SECRET` (32+ characters)
3. ✅ Enable SSL for database connections in production
4. ✅ Use `helmet` for security headers (already configured)
5. ✅ Implement rate limiting (already configured)
6. ✅ Use prepared statements (parameterized queries)
7. ✅ Hash passwords with bcrypt (already implemented)
8. ✅ JWT-based authentication for serverless (implemented)
