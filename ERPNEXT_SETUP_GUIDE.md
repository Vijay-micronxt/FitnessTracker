# ERPNext Business Assistance Integration - Setup Guide

## Overview

This guide explains how to set up the Business Assistance domain with ERPNext integration. This is **Option 1: Read-Only Operations** - safe for querying business data without modification.

## What's Been Implemented

### Backend Services
- **`backend/src/config/erpnext.config.ts`** - Configuration management with environment variables
- **`backend/src/services/erpnext.service.ts`** - ERPNext API client with:
  - Secure credential management (backend-only)
  - Query building and filtering
  - Caching with TTL
  - Retry logic with exponential backoff
  - Error handling

### Domain Configuration
- **`backend/config/domains/business.json`** - Business domain setup with ERPNext API endpoint
- **`frontend/public/content/business.en.json`** - Business domain UI text and labels

### Supported Operations (Read-Only)
- List customers, suppliers, items
- View sales orders, invoices, payments
- Search documents by filters
- Get item details and stock levels
- Check project information

## Setup Steps

### Step 1: Get ERPNext Credentials

You need 3 things from your ERPNext instance:

1. **ERPNext URL**
   - Example: `https://mycompany.erpnext.com`
   - Or: `https://erpnext.yourdomain.com`

2. **API Key** and **API Secret**
   - Go to: ERPNext → User Menu → Set User Permissions
   - Or: ERPNext → Integrations → API → Create API Key
   - Choose a user with read-only permissions
   - Generate and copy the API Key and API Secret

### Step 2: Update Environment Variables

Add to `backend/.env`:

```bash
# ERPNext Configuration
ERPNEXT_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your-api-key-here
ERPNEXT_API_SECRET=your-api-secret-here

# Optional: ERPNext Settings
ERPNEXT_TIMEOUT=30000          # Request timeout in ms (default: 30 seconds)
ERPNEXT_MAX_RETRIES=3          # Max retry attempts (default: 3)
ERPNEXT_CACHE_TTL=600          # Cache duration in seconds (default: 10 minutes)
```

**Security Note**: These credentials stay in `.env` (backend-only) and are never sent to frontend.

### Step 3: Verify Configuration

Check backend startup logs:

```bash
cd backend
npm run dev
```

Expected output:
```
[INIT] Initializing LLM service...
[ERPNEXT] Loading ERPNext configuration...
[ERPNEXT] Connected to: https://your-instance.com
```

### Step 4: Start the Application

```bash
# Terminal 1: Backend (already started above)
# cd backend && npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Open: http://localhost:3000
```

### Step 5: Set Domain

The business domain is automatically available. To use it:

```bash
# Option A: Environment variable
export DOMAIN=business
npm run dev

# Option B: .env file
echo "DOMAIN=business" >> frontend/.env.local

# Open http://localhost:3000
```

## Testing the Integration

### Test 1: Basic Connection

In the chat, try:
```
Show me all customers
```

Expected: List of customers from ERPNext

### Test 2: Specific Queries

```
What are my pending orders?
Show recent invoices
Check stock levels
Who are my suppliers?
List all projects
```

### Test 3: Search

```
Find customer "Acme"
Search for item "Widget"
Find invoice from March 2026
```

## Troubleshooting

### Problem: "Failed to connect to business data"

**Causes:**
1. ERPNext URL not configured
2. API credentials incorrect
3. ERPNext server not accessible

**Solutions:**
```bash
# Check environment variables
echo $ERPNEXT_URL
echo $ERPNEXT_API_KEY
echo $ERPNEXT_API_SECRET

# Test connection manually
curl -X GET "https://your-erpnext.com/api/resource/Customer" \
  -H "Authorization: token YOUR_KEY:YOUR_SECRET"
```

### Problem: "You don't have permission to access this data"

**Cause:** API key user doesn't have read permissions

**Solution:**
1. Go to ERPNext user settings
2. Check "Role Profile" - should include read permissions for:
   - Customer
   - Supplier
   - Sales Order
   - Sales Invoice
   - Purchase Order
   - Item
   - Payment Entry
   - Project

### Problem: "Request timed out"

**Causes:**
1. ERPNext server is slow
2. Network connectivity issues
3. Query returns too much data

**Solutions:**
```bash
# Increase timeout in .env
ERPNEXT_TIMEOUT=60000  # 60 seconds

# Check network
ping your-erpnext.com

# Limit results in config
# backend/config/domains/business.json
"maxRecordsPerQuery": 100
```

### Problem: Caching issues - data not updating

**Solution:**
Clear the cache programmatically or restart the server:

```bash
# Restart backend
pkill -f "tsx watch"
npm run dev
```

## Architecture

```
Frontend (http://localhost:3000)
    ↓ User types: "Show customers"
Backend API (http://localhost:3002)
    ↓ Parse intent with Claude
    ↓ Call ERPNextService.list('Customer')
    ↓ Check cache first
    ↓ Build query with auth token
    ↓ Send to ERPNext API
ERPNext Server (https://your-instance.com)
    ↓ Verify permissions
    ↓ Return customer list
    ↓ Backend caches response
Frontend
    ↓ Display formatted results
```

## API Client Usage (Backend Only)

Example using the service directly:

```typescript
import { erpnextService } from '@/services/erpnext.service';

// List all customers
const customers = await erpnextService.list('Customer', {
  fields: ['name', 'customer_name', 'email'],
  filters: [['territory', '=', 'USA']],
  limit: 20
});

// Get single item
const item = await erpnextService.get('Item', 'ITEM-001');

// Search
const results = await erpnextService.search('Sales Order', 'SO-2026', {
  limit: 10
});

// Count
const count = await erpnextService.count('Customer');
```

## Next Steps

### Option 1: Add More Languages
Create `frontend/public/content/business.{lang}.json` files:

```bash
cp frontend/public/content/business.en.json \
   frontend/public/content/business.hi.json

# Edit business.hi.json with Hindi translations
```

### Option 2: Add Create/Update Operations (Level 2)
Enable write operations by:
1. Creating `POST` and `PUT` methods in `erpnextService`
2. Adding user confirmations before modifications
3. Implementing audit logging

### Option 3: Add Custom Queries (Level 3)
Create custom ERPNext methods and call them:

```typescript
await erpnextService.callMethod(
  'erpnext.selling.doctype.sales_order.sales_order.get_total_orders'
);
```

### Option 4: Add Webhooks (Real-time)
Enable ERPNext webhooks to push updates to the chat in real-time.

## Security Best Practices

✅ **Implemented:**
- Credentials stored in `.env` (backend only)
- Read-only operations by default
- Request timeouts and retries
- Caching to reduce API calls
- Error handling without exposing details

✅ **Recommended:**
- Create API key with minimal required permissions
- Use role-based access control in ERPNext
- Enable audit logging for all operations
- Monitor rate limits
- Regularly rotate API credentials
- Use HTTPS only for all connections

## Configuration Reference

### ERPNext DocTypes Supported (Read-Only)

| DocType | Purpose | Example Query |
|---------|---------|----------------|
| Customer | Customer data | "Show me all customers" |
| Supplier | Supplier info | "List my suppliers" |
| Item | Products/services | "Check stock levels" |
| Sales Order | Customer orders | "What are pending orders?" |
| Sales Invoice | Customer invoices | "Show recent invoices" |
| Purchase Order | Supplier orders | "List purchase orders" |
| Payment Entry | Payments | "Show pending payments" |
| Project | Projects | "List all projects" |

### Configuration Options

```json
{
  "erp": {
    "enabled": true,
    "integrationPoints": [
      "customer_data",
      "sales_orders",
      "invoices",
      "payments",
      "inventory",
      "suppliers",
      "projects"
    ],
    "timeoutMs": 30000,
    "retryCount": 3
  }
}
```

## Support

For issues:
1. Check troubleshooting section above
2. Review backend logs: `npm run dev`
3. Test ERPNext API directly with curl
4. Check ERPNext API documentation: https://frappe.io/docs/user/guides/using-the-rest-api

---

**Version**: 1.0.0  
**Status**: ✅ Ready for Use  
**Last Updated**: March 21, 2026  
**Branch**: `business-assistance`
