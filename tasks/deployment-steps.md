# Deployment Steps: Render + Cloudflare R2

**Target Stack:**
- **Backend:** Render Web Service
- **Database:** Render PostgreSQL
- **Storage:** Cloudflare R2
- **CMS:** Vercel

---

## Step 1: Set Up Cloudflare R2 (File Storage)

### 1.1 Create Cloudflare Account
1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for a free account
3. Verify your email

### 1.2 Create R2 Bucket
1. Go to https://dash.cloudflare.com/
2. Click **R2** in the left sidebar
3. Click **Create bucket**
4. Bucket name: `walkspace-media` (or your preferred name)
5. Location: **Automatic** (or choose closest region)
6. Click **Create bucket**

### 1.3 Generate R2 API Credentials
1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Token name: `walkspace-backend`
4. Permissions: **Object Read & Write**
5. Apply to specific buckets: Select `walkspace-media`
6. Click **Create API Token**
7. **IMPORTANT:** Copy these values (you won't see them again):
   - `Access Key ID`
   - `Secret Access Key`
   - `Endpoint URL` (format: `https://<account-id>.r2.cloudflarestorage.com`)

### 1.4 Configure R2 Bucket for Public Access (for serving files)
1. In your bucket, go to **Settings** tab
2. Under **Public access**, click **Allow Access**
3. Copy the **Public R2.dev Bucket URL** (e.g., `https://pub-xxxxx.r2.dev`)

**Save these for later:**
```
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
AWS_ENDPOINT=<your-endpoint-url>
AWS_S3_BUCKET=walkspace-media
AWS_REGION=auto
```

---

## Step 2: Deploy PostgreSQL on Render

### 2.1 Create Render Account
1. Go to https://dashboard.render.com/register
2. Sign up (use GitHub for easier integration)
3. Verify your email

### 2.2 Create PostgreSQL Database
1. In Render Dashboard, click **New +**
2. Select **PostgreSQL**
3. Configure:
   - **Name:** `walkspace-db`
   - **Database:** `walkspace`
   - **User:** `walkspace` (or auto-generated)
   - **Region:** Choose closest to your users
   - **Instance Type:** `Free` (for testing) or `Starter` ($7/month, recommended)
   - **PostgreSQL Version:** 14 or higher
4. Click **Create Database**

### 2.3 Wait for Database Provisioning
- Status will show "Creating..." then "Available" (takes 1-2 minutes)
- Once available, you'll see connection details

### 2.4 Copy Database Connection String
1. In database dashboard, find **Connections** section
2. Copy **Internal Database URL** (for Render services):
   ```
   postgresql://user:password@hostname:5432/database
   ```
3. Or **External Database URL** (for local testing):
   ```
   postgresql://user:password@hostname:5432/database
   ```

**Save this URL as `DATABASE_URL` for backend deployment**

---

## Step 3: Deploy Backend to Render

### 3.1 Create Web Service
1. In Render Dashboard, click **New +**
2. Select **Web Service**
3. Connect your GitHub repository:
   - If not connected, click **Connect GitHub**
   - Authorize Render to access your repos
   - Select `walkspace-app` repository

### 3.2 Configure Web Service
Fill in these settings:

**Basic Settings:**
- **Name:** `walkspace-api`
- **Region:** Same as your database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build && npx prisma generate`
- **Start Command:** `npx prisma migrate deploy && npm run start:prod`

**Instance Type:**
- Free tier (512MB RAM) - for testing
- Starter ($7/month, 512MB RAM) - recommended for production

**Advanced Settings (expand):**
- **Auto-Deploy:** Yes (deploys on git push)
- **Health Check Path:** `/health`

### 3.3 Set Environment Variables
Click **Environment** tab and add these variables:

```bash
NODE_ENV=production
PORT=3000

# Database (from Step 2.4)
DATABASE_URL=<internal-database-url-from-render>

# JWT Secrets (generate strong random strings)
JWT_SECRET=<generate-random-string-32-chars>
JWT_REFRESH_SECRET=<generate-different-random-string-32-chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudflare R2 Storage (from Step 1.3)
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=<your-r2-access-key>
AWS_SECRET_ACCESS_KEY=<your-r2-secret-key>
AWS_REGION=auto
AWS_S3_BUCKET=walkspace-media
AWS_ENDPOINT=<your-r2-endpoint-url>

# CORS (will update after CMS deployment)
CORS_ORIGIN=http://localhost:3001

# File Upload
MAX_FILE_SIZE=52428800

# Base URL for file serving (use R2 public URL)
BASE_URL=<your-r2-public-url>
```

**To generate JWT secrets, run this locally:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3.4 Deploy
1. Click **Create Web Service**
2. Render will:
   - Clone your repo
   - Install dependencies
   - Build the app
   - Run Prisma migrations
   - Start the server
3. Watch the deployment logs for errors
4. Wait for status: **Live** (takes 3-5 minutes)

### 3.5 Get Backend URL
1. Once deployed, copy the service URL:
   ```
   https://walkspace-api.onrender.com
   ```
2. Test the health endpoint:
   ```bash
   curl https://walkspace-api.onrender.com/health
   ```
   Should return: `{"status":"ok","info":{"database":{"status":"up"}}}`

### 3.6 Update CORS
1. Go back to **Environment** tab
2. Update `CORS_ORIGIN` to include your CMS URL (we'll get this in Step 4):
   ```
   CORS_ORIGIN=https://walkspace-api.onrender.com,https://your-cms.vercel.app
   ```
3. Click **Save Changes** (will trigger redeployment)

---

## Step 4: Deploy CMS to Vercel

### 4.1 Deploy via CLI
From your project root:

```bash
cd cms
vercel
```

Follow the prompts:
- **Set up and deploy:** Y
- **Which scope:** Your account
- **Link to existing project:** N
- **Project name:** `walkspace-cms` (or your choice)
- **Directory:** `./` (already in cms/)
- **Override settings:** N
- **Deploy:** Y

### 4.2 Set Environment Variables
After first deployment, add environment variables:

```bash
vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://walkspace-api.onrender.com

vercel env add NEXT_PUBLIC_APP_NAME production
# Enter: BANDITE CMS

vercel env add NEXT_PUBLIC_APP_VERSION production
# Enter: 1.0.0
```

### 4.3 Redeploy with Environment Variables
```bash
vercel --prod
```

### 4.4 Get CMS URL
After deployment completes, you'll see:
```
✅ Production: https://walkspace-cms.vercel.app
```

### 4.5 Update Backend CORS (Step 3.6)
Go back to Render backend and update the CORS_ORIGIN to include your Vercel URL.

---

## Step 5: Verify Deployment

### 5.1 Test Backend
```bash
# Health check
curl https://walkspace-api.onrender.com/health

# API docs (Swagger)
open https://walkspace-api.onrender.com/api/docs
```

### 5.2 Test CMS
1. Open https://walkspace-cms.vercel.app
2. Try logging in (if auth is set up)
3. Test tour creation and media upload
4. Verify files upload to R2

### 5.3 Test File Storage
1. Upload a test image in CMS
2. Check Cloudflare R2 dashboard to confirm file is there
3. Verify signed URL works

---

## Step 6: Custom Domains (Optional)

### Backend Custom Domain (Render)
1. In Render service settings, go to **Settings** > **Custom Domain**
2. Add your domain (e.g., `api.walkspace.com`)
3. Add CNAME record in your DNS:
   ```
   api.walkspace.com -> walkspace-api.onrender.com
   ```
4. Wait for SSL certificate (automatic)

### CMS Custom Domain (Vercel)
```bash
vercel domains add cms.walkspace.com
```
Then add DNS records as instructed.

---

## Troubleshooting

### Backend won't start
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Ensure Prisma migrations ran successfully
- Check Node.js version compatibility

### File uploads fail
- Verify R2 credentials are correct
- Check bucket permissions
- Ensure AWS_ENDPOINT URL is correct
- Check backend logs for S3 errors

### CORS errors in CMS
- Verify CORS_ORIGIN includes CMS URL
- Check protocol (http vs https)
- Redeploy backend after CORS changes

### Database connection issues
- Use Internal Database URL for Render services
- Check database is running (Status: Available)
- Verify SSL mode in connection string

---

## Next Steps After Deployment

1. **Set up monitoring:**
   - Add Sentry for error tracking
   - Set up Render alerts for downtime
   - Monitor database performance

2. **Configure backups:**
   - Render PostgreSQL auto-backups (Starter plan+)
   - Download manual backups regularly

3. **Performance optimization:**
   - Enable Render Redis for caching
   - Set up CDN for media files
   - Optimize database queries

4. **Security:**
   - Add rate limiting to API
   - Enable Render Web Application Firewall
   - Rotate secrets regularly
   - Set up 2FA on all accounts

---

## Cost Summary

**Monthly Costs:**
- Render PostgreSQL Starter: $7
- Render Web Service Starter: $7
- Cloudflare R2: Free (10GB storage, 10M requests/month)
- Vercel: Free (hobby tier)

**Total: ~$14/month**

For development, you can use all free tiers initially.
