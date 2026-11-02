# Notifications

The Notifications feature writes private per-student records for club announcements, new or changed events, cancellations, and RSVP reminders. A five-minute EventBridge job checks Amplify's generated tables so the existing admin/demo write paths continue to work. A weekly EventBridge job sends opt-in digests. Notification read state is changed through authenticated Lambda mutations.

## Email setup

Email delivery is optional until the project has a verified sender. Set these build environment variables for the Amplify branch that deploys the backend:

- `SES_FROM_EMAIL`: sender address verified in Amazon SES in the app's AWS Region (`us-east-2` for the current sandbox).
- `APP_BASE_URL`: the deployed app URL, such as `https://your-app.example.com`, used to make links in email clickable.

The notification Lambda skips email delivery when `SES_FROM_EMAIL` is empty. SES must also have production access before it can send to unverified recipients; while the account is in the SES sandbox, recipient addresses must be verified. See [SES verified identities](https://docs.aws.amazon.com/ses/latest/dg/verify-addresses-and-domains.html).

The weekly digest runs Sunday at 13:00 UTC. This is morning in Notre Dame, Indiana. New updates are collected and processed every five minutes; real-time AppSync subscriptions then update the open app's notification list and unread badge.

## Browser alerts

Browser alerts use the browser Notification API while the app is open. The student must turn them on in Settings and grant browser permission. This does not register a service worker or deliver push notifications while the app is closed.
