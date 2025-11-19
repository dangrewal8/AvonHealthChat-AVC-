# Cloudflare Tunnel Migration Plan

**Date:** 2025-11-18
**Objective:** Migrate Avon Health Chat to production setup accessible from any network via Cloudflare Tunnel

---

## Current State Analysis

### ✅ What We Have:
- **Frontend:** React + Vite + Tailwind + TypeScript
- **Backend:** Node.js (Express) on port 3001
- **Features Implemented:**
  - ✅ Chat history system with localStorage persistence
  - ✅ Multi-part question support (6 detection patterns)
  - ✅ Comprehensive query handlers (medications, allergies, vitals, demographics, etc.)
  - ✅ Active/inactive filtering for medications and allergies
  - ✅ SSN security protection
  - ✅ 21 Avon Health API endpoints integrated
  - ✅ User authentication (localStorage-based)
  - ✅ Conversation management (create, switch, delete)

### ⚠️ What Needs to Change:
- **Security:** API keys hardcoded in service files (CRITICAL)
- **CORS:** Not configured for production domains
- **Security Headers:** No helmet.js protection
- **Rate Limiting:** No protection against brute force
- **Environment Variables:** Not properly configured
- **Frontend API URL:** Hardcoded to localhost
- **No HTTPS:** Currently HTTP only (Cloudflare will handle this)
- **No Cloudflare Tunnel:** Not configured

---

## Migration Architecture

### Current (Development):
```
Browser (localhost:5173) → Vite Dev Server
                        → Express API (localhost:3001)
                        → Avon Health API
```

### Target (Production with Cloudflare Tunnel):
```
Any Network (Internet)
    ↓
Cloudflare Global Network (HTTPS, DDoS Protection)
    ↓
Cloudflare Tunnel (encrypted)
    ↓
Your PC (cloudflared daemon)
    ↓
    ├── chat.yourdomain.com → Vite Preview Server (port 4173)
    └── api.yourdomain.com  → Express API (port 3001)
                             → Avon Health API (secured with env vars)
```

---

## Security Implementation Plan

### 1. Environment Variables (CRITICAL - FIRST STEP)

**Create `.env` files (NEVER commit to git):**

**Backend `.env`:**
```env
# Server Configuration
NODE_ENV=production
PORT=3001

# Avon Health API Credentials (SECURE THESE!)
AVON_API_KEY=your_api_key_here
AVON_JWT_TOKEN=your_jwt_token_here

# Session Security
SESSION_SECRET=generate_random_secret_here

# CORS Configuration
ALLOWED_ORIGINS=https://chat.yourdomain.com

# User Authentication (simple username/password)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

**Frontend `.env`:**
```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com

# Environment
VITE_NODE_ENV=production
```

**Add to `.gitignore`:**
```
.env
.env.local
.env.production
*.env
```

---

### 2. Backend Security Enhancements

**Install Security Packages:**
```bash
npm install helmet express-rate-limit cors dotenv
npm install --save-dev @types/cors
```

**Security Middleware to Add:**

1. **Helmet.js** - Security headers
2. **express-rate-limit** - Prevent brute force attacks
3. **CORS** - Restrict API access to your frontend only
4. **Environment Variables** - Secure API keys
5. **Request Logging** - Track all API calls

---

### 3. Frontend Production Configuration

**Build Configuration:**
- Use Vite preview mode for production serving
- Environment-based API URL
- Production optimizations (minification, tree-shaking)

---

### 4. Cloudflare Tunnel Setup

**Prerequisites:**
- Domain name (can use free subdomain from Cloudflare)
- Cloudflare account (free)
- Install `cloudflared` daemon

**Configuration Files:**
- `~/.cloudflared/config.yml` - Tunnel routing config
- Tunnel credentials file

---

## Step-by-Step Implementation

### Phase 1: Secure the Backend (30 minutes)

**Step 1.1: Environment Variables**
- [ ] Create `.env` file with all secrets
- [ ] Update `avonhealth.service.ts` to use `process.env`
- [ ] Install `dotenv` package
- [ ] Load environment variables in `index.ts`
- [ ] Add `.env` to `.gitignore`

**Step 1.2: Security Middleware**
- [ ] Install security packages
- [ ] Add helmet.js configuration
- [ ] Add rate limiting to login endpoint
- [ ] Configure CORS for production domain
- [ ] Add request logging

**Step 1.3: Test Backend**
- [ ] Verify environment variables loaded
- [ ] Test API endpoints still work
- [ ] Verify security headers present

---

### Phase 2: Configure Frontend (15 minutes)

**Step 2.1: Environment Configuration**
- [ ] Create `.env.production` file
- [ ] Update API calls to use `import.meta.env.VITE_API_URL`
- [ ] Add fallback to localhost for development

**Step 2.2: Build Production Version**
- [ ] Run `npm run build`
- [ ] Test with `npm run preview`
- [ ] Verify API calls work on port 4173

---

### Phase 3: Install Cloudflare Tunnel (20 minutes)

**Step 3.1: Install cloudflared**
```bash
# macOS
brew install cloudflare/cloudflare/cloudflared

# Linux
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Windows
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
```

**Step 3.2: Authenticate**
```bash
cloudflared tunnel login
```

**Step 3.3: Create Tunnel**
```bash
cloudflared tunnel create avon-health-chat
```

**Step 3.4: Configure DNS**
```bash
cloudflared tunnel route dns avon-health-chat chat.yourdomain.com
cloudflared tunnel route dns avon-health-chat api.yourdomain.com
```

---

### Phase 4: Configure Tunnel Routing (15 minutes)

**Step 4.1: Create Configuration File**

Create `~/.cloudflared/config.yml`:
```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /path/to/<YOUR-TUNNEL-ID>.json

ingress:
  # Frontend (Vite preview server)
  - hostname: chat.yourdomain.com
    service: http://localhost:4173
    originRequest:
      noTLSVerify: true

  # Backend API (Express server)
  - hostname: api.yourdomain.com
    service: http://localhost:3001
    originRequest:
      noTLSVerify: true

  # Catch-all (required)
  - service: http_status:404
```

**Step 4.2: Test Tunnel**
```bash
cloudflared tunnel run avon-health-chat
```

---

### Phase 5: Create Startup Scripts (10 minutes)

**Step 5.1: Backend Startup Script**

Create `backend/start-production.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")"
source .env
npm run build
node dist/index.js
```

**Step 5.2: Frontend Startup Script**

Create `frontend/start-production.sh`:
```bash
#!/bin/bash
cd "$(dirname "$0")"
npm run build
npm run preview
```

**Step 5.3: Combined Startup Script**

Create `start-all.sh` in root:
```bash
#!/bin/bash

# Start backend
cd backend
./start-production.sh &
BACKEND_PID=$!

# Start frontend
cd ../frontend
./start-production.sh &
FRONTEND_PID=$!

# Start Cloudflare Tunnel
cloudflared tunnel run avon-health-chat &
TUNNEL_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo "Tunnel PID: $TUNNEL_PID"
echo "All services started!"
```

---

### Phase 6: Install as System Service (Optional - 15 minutes)

**For Linux/macOS:**
```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
```

**For Windows:**
```cmd
cloudflared service install
```

---

## Security Checklist

### ✅ Backend Security:
- [ ] API keys in environment variables (not hardcoded)
- [ ] `.env` file in `.gitignore`
- [ ] Helmet.js security headers enabled
- [ ] Rate limiting on login endpoint (5 attempts per 15 min)
- [ ] CORS restricted to frontend domain only
- [ ] Request logging enabled
- [ ] HTTPS enforced (via Cloudflare)
- [ ] Session secrets randomized

### ✅ Frontend Security:
- [ ] API URL from environment variables
- [ ] No hardcoded secrets
- [ ] Production build minified
- [ ] HTTPS only (via Cloudflare)

### ✅ Infrastructure Security:
- [ ] Cloudflare DDoS protection active
- [ ] Tunnel encrypted (automatic with cloudflared)
- [ ] No port forwarding required
- [ ] PC firewall enabled

---

## File Changes Required

### Files to Modify:

1. **Backend:**
   - ✏️ `backend/src/index.ts` - Add security middleware
   - ✏️ `backend/src/services/avonhealth.service.ts` - Use env vars
   - ✏️ `backend/package.json` - Add security dependencies
   - ➕ `backend/.env` - Create with secrets (DON'T COMMIT)
   - ➕ `backend/start-production.sh` - Create startup script

2. **Frontend:**
   - ✏️ `frontend/src/hooks/useQuery.ts` - Use env-based API URL
   - ➕ `frontend/.env.production` - Create with API URL
   - ➕ `frontend/start-production.sh` - Create startup script

3. **Root:**
   - ✏️ `.gitignore` - Add `.env` files
   - ➕ `~/.cloudflared/config.yml` - Create tunnel config
   - ➕ `start-all.sh` - Combined startup script

---

## Testing Plan

### Local Testing (Before Cloudflare):

**Test 1: Backend Security**
```bash
cd backend
npm run build
node dist/index.js
```
- [ ] Verify environment variables loaded
- [ ] Check security headers present (use browser DevTools)
- [ ] Test rate limiting (try 6 login attempts quickly)
- [ ] Verify CORS blocks unauthorized domains

**Test 2: Frontend Production**
```bash
cd frontend
npm run build
npm run preview
```
- [ ] Open http://localhost:4173
- [ ] Verify API calls work
- [ ] Test chat functionality
- [ ] Verify chat history persists

**Test 3: Full Stack Integration**
- [ ] Both frontend (4173) and backend (3001) running
- [ ] Can login successfully
- [ ] Can send queries and get responses
- [ ] Chat history saves and loads
- [ ] Multi-part questions work
- [ ] All query handlers function

---

### Production Testing (With Cloudflare):

**Test 1: Cloudflare Tunnel**
```bash
cloudflared tunnel run avon-health-chat
```
- [ ] Tunnel connects successfully
- [ ] Both domains resolve (chat.yourdomain.com, api.yourdomain.com)
- [ ] HTTPS certificate automatic
- [ ] No certificate warnings

**Test 2: External Access**
- [ ] Access from different device on different network
- [ ] Open https://chat.yourdomain.com
- [ ] Login works
- [ ] Chat functionality works
- [ ] API calls successful
- [ ] Chat history persists

**Test 3: Security Validation**
- [ ] Direct API access blocked (must go through frontend)
- [ ] Rate limiting works (5 failed logins = temp ban)
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] Security headers present (check DevTools)

---

## Rollback Plan

If something goes wrong:

**Rollback Step 1: Stop Cloudflare Tunnel**
```bash
# If running manually
Ctrl+C

# If running as service
sudo systemctl stop cloudflared
```

**Rollback Step 2: Return to Development Mode**
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

**Rollback Step 3: Restore Original Files**
```bash
git checkout backend/src/index.ts
git checkout backend/src/services/avonhealth.service.ts
git checkout frontend/src/hooks/useQuery.ts
```

---

## Post-Migration Monitoring

### What to Monitor:

1. **Uptime**
   - Set up UptimeRobot (free) for https://chat.yourdomain.com
   - Email alerts if site goes down

2. **Performance**
   - Monitor response times
   - Check Cloudflare Analytics dashboard

3. **Security**
   - Review backend logs for failed login attempts
   - Monitor for unusual traffic patterns

4. **PC Health**
   - Ensure PC doesn't overheat
   - Monitor CPU/RAM usage
   - Ensure stable internet connection

---

## Estimated Timeline

| Phase | Duration | Can Be Done In Parallel? |
|-------|----------|-------------------------|
| Phase 1: Secure Backend | 30 min | No (foundation) |
| Phase 2: Configure Frontend | 15 min | After Phase 1 |
| Phase 3: Install Cloudflare | 20 min | After Phase 1 |
| Phase 4: Configure Tunnel | 15 min | After Phase 3 |
| Phase 5: Startup Scripts | 10 min | Anytime |
| Phase 6: System Service | 15 min | Optional |
| **Total** | **1.5-2 hours** | |

---

## Prerequisites Before Starting

### Required Information:

1. **Domain Name:**
   - Do you have a domain? (e.g., example.com)
   - OR use Cloudflare's free subdomain (e.g., avon-health.trycloudflare.com)

2. **Avon Health API Credentials:**
   - API Key (currently hardcoded)
   - JWT Token (currently hardcoded)

3. **Admin Credentials:**
   - Choose admin username (default: admin)
   - Choose strong password (min 12 characters)

4. **System Requirements:**
   - PC must run 24/7 or app goes offline
   - Reliable internet connection
   - Minimum 10 Mbps upload speed

---

## Success Criteria

Migration is successful when:

✅ You can access https://chat.yourdomain.com from your phone (cellular data)
✅ You can login with admin credentials
✅ You can send queries and receive accurate responses
✅ Chat history persists across sessions
✅ Multi-part questions work correctly
✅ All security headers present (check DevTools Network tab)
✅ Rate limiting prevents brute force (5 failed logins = temp block)
✅ Direct API access returns CORS error (security working)
✅ PC can be accessed from any network
✅ No API keys visible in browser (all in backend env)

---

## Next Steps

Once you approve this plan, I will:

1. ✅ Create `.env` template files
2. ✅ Modify backend with security middleware
3. ✅ Update frontend for production
4. ✅ Create Cloudflare Tunnel config template
5. ✅ Create startup scripts
6. ✅ Provide step-by-step execution guide

**Ready to proceed?**

Please provide:
- [ ] Your domain name (or confirm you'll use Cloudflare's free subdomain)
- [ ] Confirm you have the Avon Health API credentials ready
- [ ] Preferred admin username/password for the application
