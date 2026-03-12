# iOS Push Notification Verification Checklist (Fix-L)

## Developer Setup

### 1. Generate VAPID Keys
```bash
pnpm push:keygen
```
Copy the output into `.env.local` (local dev) and Vercel environment variables (production). Update `VAPID_EMAIL` with your real email.

### 2. Deploy with VAPID Env Vars
Ensure these are set in Vercel:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL` (format: `mailto:you@example.com`)

### 3. Grant Admin Access
In Supabase SQL editor:
```sql
UPDATE profiles SET is_admin = true WHERE id = '<your-user-uuid>';
```

### 4. Test on iPhone
1. Open the production URL in **Safari** on iPhone (iOS 16.4+)
2. Tap **Share** → **Add to Home Screen**
3. Open the app from the Home Screen (must be standalone mode)
4. Go to **Mi Cuenta** → **Notificaciones push**
5. Tap **Activar notificaciones** → grant permission
6. The **Enviar prueba** button appears (admin-only)
7. Tap it → a test notification should arrive within seconds
8. Tap the notification → app should open to `/account`

### Known Limitation
Only one `push_subscription` per profile row — the last device to subscribe gets pushes. Multi-device support would require a separate subscriptions table.

---

## Prerequisites
- [ ] iPhone running iOS 16.4+ (push for PWA requires 16.4+)
- [ ] Safari (not Chrome/Firefox — only Safari supports PWA push on iOS)
- [ ] App deployed to production URL with valid HTTPS
- [ ] VAPID keys configured in environment variables

## 1. PWA Installation
- [ ] Open app in Safari on iPhone
- [ ] Tap Share → "Add to Home Screen"
- [ ] App icon appears on Home Screen with correct name ("Senda") and icon
- [ ] Launch from Home Screen — opens in standalone mode (no Safari UI)

## 2. Push Permission Flow
- [ ] `ServiceWorkerRegistration` component loads successfully in standalone mode
- [ ] Permission prompt appears when triggered (account page or dashboard visit)
- [ ] User can grant permission — no console errors
- [ ] User can deny permission — app continues working normally
- [ ] `push_subscription` column in `profiles` table is populated after granting
- [ ] iOS Safari tab (non-PWA) shows install hint instead of enable button

## 3. Notification Delivery
- [ ] Tap "Enviar prueba" button on account page (admin-only)
- [ ] Notification appears in iOS Notification Center
- [ ] Notification title, body, and icon render correctly
- [ ] Notification appears when app is in background (Home Screen)
- [ ] Notification appears when app is fully closed (swiped away)
- [ ] Badge count appears on app icon (if implemented)

## 4. Deep Link on Tap
- [ ] Tapping notification opens the PWA (not Safari)
- [ ] Navigates to correct route (e.g. `/account` for test, `/study` for cron)
- [ ] If app was closed, it re-opens and navigates correctly

## 5. Service Worker Lifecycle
- [ ] `sw.js` registers successfully (check DevTools → Application → Service Workers)
- [ ] SW updates properly when new version is deployed
- [ ] Push subscription survives SW update (no re-subscribe needed)
- [ ] Push subscription survives device restart

## 6. Edge Cases
- [ ] User revokes notification permission in iOS Settings → app degrades gracefully
- [ ] Network offline → push subscription does not break on reconnect
- [ ] Multiple devices with same account → each gets its own subscription
- [ ] Uninstall PWA from Home Screen → subscription is stale (acceptable; server-side cleanup on 410)
- [ ] Malformed push payload → SW shows generic notification (try/catch hardening)

## Known iOS Limitations
- Push for web apps requires iOS 16.4+ and standalone mode (Add to Home Screen)
- No push support in Safari tab (non-PWA) on iOS
- Badge API (`navigator.setAppBadge`) requires iOS 16.4+
- Silent push / background fetch not supported for web apps on iOS
- Provisional notifications (quiet delivery) not supported for web apps
- Maximum payload size: 4 KB (same as native APNs)

## Test Results
| Test | Status | Notes |
|------|--------|-------|
| PWA install | | |
| Permission grant | | |
| Permission deny | | |
| iOS Safari tab install hint | | |
| Notification display (test button) | | |
| Notification display (background) | | |
| Notification display (closed) | | |
| Deep link on tap | | |
| SW update | | |
| Permission revoke | | |
| Malformed payload fallback | | |

Date tested: ___________
iOS version: ___________
Device: ___________
