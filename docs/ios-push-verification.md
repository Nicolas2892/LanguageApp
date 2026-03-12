# iOS Push Notification Verification Checklist (Fix-L)

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
- [ ] Permission prompt appears when triggered (first study session or dashboard visit)
- [ ] User can grant permission — no console errors
- [ ] User can deny permission — app continues working normally
- [ ] `push_subscription` column in `profiles` table is populated after granting

## 3. Notification Delivery
- [ ] Send test push via Supabase Edge Function or `web-push` script
- [ ] Notification appears in iOS Notification Center
- [ ] Notification title, body, and icon render correctly
- [ ] Notification appears when app is in background (Home Screen)
- [ ] Notification appears when app is fully closed (swiped away)
- [ ] Badge count appears on app icon (if implemented)

## 4. Deep Link on Tap
- [ ] Tapping notification opens the PWA (not Safari)
- [ ] Navigates to correct route (e.g. `/study` or `/dashboard`)
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
- [ ] Uninstall PWA from Home Screen → subscription is stale (acceptable; server-side cleanup needed?)

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
| Notification display (background) | | |
| Notification display (closed) | | |
| Deep link on tap | | |
| SW update | | |
| Permission revoke | | |

Date tested: ___________
iOS version: ___________
Device: ___________
