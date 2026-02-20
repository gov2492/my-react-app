# 403 Forbidden Error - Authentication Troubleshooting Guide

## Problem
You're receiving a `403 Forbidden` error when trying to access the dashboard API endpoints.

## Root Cause Analysis

The 403 Forbidden error occurs when:
1. **JWT token is not being sent** - Authorization header is missing or malformed
2. **JWT secret mismatch** - Different services have different JWT secrets
3. **Token is expired** - The JWT token has exceeded its expiration time
4. **Token validation fails** - The token cannot be parsed or validated

## Solution Steps

### Step 1: Verify All Services Are Running

Check that all required microservices are running on their correct ports:

```bash
# Terminal 1 - Auth Service (Port 8083)
cd backend/auth-service
mvn spring-boot:run

# Terminal 2 - Invoice Service (Port 8081)
cd backend/invoice-service
mvn spring-boot:run

# Terminal 3 - Market Service (Port 8082)
cd backend/market-service
mvn spring-boot:run

# Terminal 4 - Dashboard Service (Port 8080)
cd backend/dashboard-service
mvn spring-boot:run

# Terminal 5 - Frontend (Port 5173)
npm run dev
```

### Step 2: Ensure JWT_SECRET is Set (Optional but Recommended)

Set a consistent JWT secret across all services:

```bash
# Set environment variable (macOS/Linux)
export JWT_SECRET="your-super-long-jwt-secret-key-minimum-32-characters"

# Or add to .env file in project root if using Docker
JWT_SECRET=your-super-long-jwt-secret-key-minimum-32-characters
```

If not set, all services will use the default value:
```
change-this-super-long-jwt-secret-change-this-super-long-jwt-secret
```

### Step 3: Verify Token is Being Sent Correctly

Check browser DevTools to ensure token is in requests:

1. **Open Browser DevTools** (F12 or Cmd+Opt+I)
2. **Go to Application > Local Storage**
3. **Look for `luxegem_token` key**
4. **Go to Network tab**
5. **Look at dashboard API request in Headers**
6. **Verify `Authorization: Bearer <token>` header is present**

If header is missing, the frontend is not sending it correctly.

### Step 4: Check Backend Logs

Look for authentication errors in backend logs:

```bash
# Check dashboard-service logs for lines like:
# DEBUG: JWT Token validated for user: admin
# ERROR: JWT Token parsing failed: ...
# WARN: JWT Token validation failed - token invalid or username empty
```

### Step 5: Verify Login Success

Ensure you're logging in successfully:

1. **Use default credentials:**
   - Username: `admin`
   - Password: `admin123`

2. **Check for login error messages in UI**

3. **Verify token is stored in localStorage:**
   ```javascript
   // Run in browser console
   localStorage.getItem('luxegem_token')
   // Should show a long JWT token string, not null
   ```

### Step 6: Test API Directly

Test the APIs using curl to isolate frontend issues:

```bash
# 1. Get auth token
TOKEN=$(curl -X POST http://localhost:8083/auth-api/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

echo "Token: $TOKEN"

# 2. Test dashboard API with token
curl -X GET http://localhost:8080/api/dashboard/overview \
  -H "Authorization: Bearer $TOKEN"

# 3. Test invoice API with token
curl -X GET http://localhost:8081/api/invoices/overview \
  -H "Authorization: Bearer $TOKEN"
```

### Step 7: Check Service-to-Service Communication

Dashboard service aggregates data from other services. Verify:

1. **Invoice Service** responds correctly:
   ```bash
   curl -X GET http://localhost:8081/actuator/health
   # Should return 200 OK
   ```

2. **Market Service** responds correctly:
   ```bash
   curl -X GET http://localhost:8082/actuator/health
   # Should return 200 OK
   ```

3. **Dashboard Service** can reach them:
   - Check that port 8081 and 8082 services are accessible
   - Check Docker/network configuration if services are containerized

## Common Issues & Solutions

### Issue: "No Authorization header found"
**Solution:** Frontend is not sending the token. Make sure:
- User logs in successfully
- Token is stored in localStorage
- Frontend API calls include `Authorization` header

### Issue: "JWT Token parsing failed"
**Solution:** 
1. Verify JWT_SECRET is the same across all services
2. Check token hasn't been corrupted
3. Try logging in again to get a fresh token

### Issue: "Token is invalid or username empty"
**Solution:**
1. Check token expiration (default 1 hour)
2. Try logging out and logging in again
3. Check server time is synchronized

### Issue: Token sent but still 403
**Solution:**
1. Verify downstream service (Invoice or Market) is running
2. Check if downstream service has different JWT_SECRET
3. Review backend logs for specific error messages

## Debugging Frontend

Add this to your browser console to verify token and headers:

```javascript
// Check token in localStorage
console.log('Token:', localStorage.getItem('luxegem_token'));

// Test fetch with token
const token = localStorage.getItem('luxegem_token');
fetch('/api/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
}).then(r => {
  console.log('Status:', r.status);
  return r.json();
}).then(d => console.log('Data:', d))
.catch(e => console.error('Error:', e));
```

## Quick Checklist

- [ ] All microservices running (ports 8080, 8081, 8082, 8083)
- [ ] Frontend running (port 5173)
- [ ] Logged in with admin/admin123
- [ ] Token visible in localStorage
- [ ] Token in Authorization header of requests
- [ ] JWT_SECRET same across all services (or using default)
- [ ] Backend logs show successful token validation
- [ ] Direct curl tests work with token
- [ ] All services responding on /actuator/health

## Logs to Check

### Dashboard Service (Port 8080)
```
INFO  DashboardController - Dashboard overview requested with Authorization header
DEBUG - JWT Token validated for user: admin
```

### Invoice Service (Port 8081)
```
DEBUG - JWT Token validated for user: admin
```

### Market Service (Port 8082)
```
DEBUG - JWT Token validated for user: admin
```

## Database Requirements

Ensure PostgreSQL is running with databases:
- `luxegem_auth` (Auth service)
- `luxegem_invoice` (Invoice service)
- `luxegem_market` (Market service)

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT datname FROM pg_database WHERE datname LIKE 'luxegem%';"

# Should list:
# luxegem_auth
# luxegem_invoice
# luxegem_market
```

## Still Having Issues?

1. **Check browser console** for frontend errors
2. **Check terminal logs** for backend errors
3. **Verify all services started** without errors
4. **Check port conflicts** - ensure ports 8080-8083 are free
5. **Clear browser cache** - Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)
6. **Restart all services** - stop and restart from step 1

---

**Version:** 1.0  
**Last Updated:** February 14, 2026
