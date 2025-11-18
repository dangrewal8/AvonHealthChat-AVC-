# Avon Health Chat - Production Deployment Guide

**Last Updated:** 2025-11-18
**Deployment Type:** Cloudflare Tunnel (Local PC Hosting)

---

## ✅ What's Been Implemented

This deployment setup includes:

✅ **Environment-based Configuration** - All API keys and credentials moved to `.env` files
✅ **Production Security Middleware** - helmet.js, rate limiting, CORS protection
✅ **Frontend Login Authentication** - Environment-based username/password
✅ **Cloudflare Tunnel Configuration** - Template for internet exposure
✅ **Automated Startup Scripts** - One-command production startup
✅ **Chat History System** - Persistent localStorage conversations
✅ **Multi-Part Question Support** - Handle complex compound queries
✅ **Comprehensive Query Handlers** - All 21 Avon Health API endpoints
✅ **SSN Security Protection** - Blocks sensitive data requests
✅ **All Latest Features** - Full capabilities preserved

---

## 📋 Prerequisites

Before deploying, ensure you have:

- [ ] **Node.js 18+** installed
- [ ] **Avon Health API credentials** (client_id, client_secret, account, user_id)
- [ ] **Domain name** (or use Cloudflare's free subdomain)
- [ ] **Cloudflare account** (free tier works)
- [ ] **Reliable internet connection** (10+ Mbps upload recommended)
- [ ] **PC that can run 24/7** (or accept downtime when PC is off)

---

## 🚀 Quick Start (For Testing)

Want to test locally first before setting up Cloudflare Tunnel?

```bash
# From project root:
cd /home/user/AvonHealthChat-AVC-

# Start without tunnel (local only):
./start-all.sh --no-tunnel

# Access at: http://localhost:4173
```

---

## 🔐 Security Summary

**Already Implemented:**
- ✅ HTTPS via Cloudflare Tunnel (automatic SSL)
- ✅ Rate limiting: 100 requests per 15 minutes per IP
- ✅ CORS protection: Only your domain can access API
- ✅ Helmet.js security headers
- ✅ SSN blocking: Social Security Numbers cannot be displayed
- ✅ Environment variables: No secrets in code
- ✅ Active-only data filtering

**Login Credentials:**
- Default: admin / pbOUAByKyzf2MRhhFbgcjidUMlqWzhQE
- **CHANGE THESE in frontend/.env.production before deploying!**

---

## 📝 Configuration Files Summary

**Backend (.env):**
- Avon Health API credentials
- CORS origin (your frontend domain)
- Rate limiting settings

**Frontend (.env.production):**
- API URL (https://api.yourdomain.com)
- Login credentials (username/password)

**Cloudflare (~/.cloudflared/config.yml):**
- Tunnel ID
- Domain routing (chat.yourdomain.com, api.yourdomain.com)
- Port mappings (4173 for frontend, 3001 for backend)

---

## 🎯 Deployment Steps Summary

1. **Configure Backend** - Create backend/.env with Avon Health credentials
2. **Configure Frontend** - Edit frontend/.env.production with API URL and login
3. **Install Cloudflare Tunnel** - Install cloudflared, create tunnel, configure DNS
4. **Start Services** - Run ./start-all.sh
5. **Test** - Access https://chat.yourdomain.com from any network

**Full detailed instructions:** See CLOUDFLARE_TUNNEL_MIGRATION_PLAN.md

---

## 🧪 Testing Checklist

Before deployment:
- [ ] Backend builds: `cd backend && npm run build`
- [ ] Frontend builds: `cd frontend && npm run build`
- [ ] Local test works: `./start-all.sh --no-tunnel` → http://localhost:4173

After deployment:
- [ ] Can access https://chat.yourdomain.com from phone (cellular)
- [ ] HTTPS certificate valid (green padlock)
- [ ] Can login with configured credentials
- [ ] Queries work: "What medications is the patient taking?"
- [ ] Chat history persists across page refresh
- [ ] Multi-part works: "What are allergies and blood pressure?"
- [ ] SSN blocked: "What is the SSN?" → returns security message

---

## 🛠️ Startup Commands

**Start everything:**
```bash
./start-all.sh
```

**Start without tunnel (local only):**
```bash
./start-all.sh --no-tunnel
```

**Stop everything:**
```
Press Ctrl+C in the terminal running start-all.sh
```

**View logs:**
```bash
tail -f logs/backend.log
tail -f logs/frontend.log
tail -f logs/tunnel.log
```

---

## 🔄 Updating After Code Changes

```bash
# 1. Stop services (Ctrl+C)

# 2. Rebuild
cd backend && npm run build
cd ../frontend && npm run build
cd ..

# 3. Restart
./start-all.sh
```

---

## 🆘 Common Issues & Solutions

**"CORS error" in browser:**
→ Check backend/.env has correct CORS_ORIGIN matching your domain

**"Connection refused":**
→ Check services are running: `ps aux | grep "node\|cloudflared"`

**"DNS resolution error":**
→ Wait 2-5 minutes for DNS propagation after creating tunnel

**Login not working:**
→ Check frontend/.env.production has correct credentials
→ Rebuild frontend: `cd frontend && npm run build`

---

## 📊 Monitoring

**Check service status:**
```bash
ps aux | grep "node\|cloudflared"
```

**View traffic in Cloudflare Dashboard:**
https://one.dash.cloudflare.com/ → Networks → Tunnels → avon-health-chat

---

## 🎉 Success!

If you can access https://chat.yourdomain.com from your phone using cellular data,
login successfully, and send queries - **your deployment is complete!**

All features are preserved:
✅ Chat history with conversations
✅ Multi-part question support
✅ All query handlers (medications, allergies, vitals, demographics, etc.)
✅ SSN security protection
✅ Rate limiting protection
✅ HTTPS encryption

---

For detailed step-by-step instructions, see:
- **CLOUDFLARE_TUNNEL_MIGRATION_PLAN.md** - Comprehensive migration planning
- **INTERNET_ACCESS_RESEARCH.md** - Research on hosting options

For questions about specific features:
- **CHAT_HISTORY_SYSTEM.md** - Chat history documentation
- **MULTI_PART_QUESTION_SUPPORT.md** - Multi-part questions
- **API_FIELD_VERIFICATION.md** - Data accuracy verification
- **COMPREHENSIVE_QUERY_CAPABILITIES.md** - All query types

