

# Fix: Barint AI Not Working

## Problem
The edge function `barint-chat` is deployed but returns **401 Unauthorized**. Supabase's gateway is enforcing JWT verification on the function, and the client sends the anon key as a Bearer token, which is not a valid user JWT. The request never reaches the function code.

## Solution

### 1. Update `supabase/config.toml`
Add a function config block to disable JWT verification for `barint-chat`:
```toml
[functions.barint-chat]
verify_jwt = false
```
This lets the anon key pass through and the function handles requests directly.

### 2. Update CORS headers in the edge function
The current CORS `Access-Control-Allow-Headers` is missing headers that the Supabase client sends (`x-supabase-client-platform`, etc.), which can cause preflight failures in some browsers. Update to include all required headers.

### 3. Redeploy
After these two changes, the function will accept requests and stream AI responses correctly.

## Files Changed
- `supabase/config.toml` — add `[functions.barint-chat]` block
- `supabase/functions/barint-chat/index.ts` — update CORS headers

