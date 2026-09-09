# Server startup and admin keep-alive

- The frontend waits for `GET /api/health` before mounting the app.
- While the API is unavailable, a Happy Toys splash screen is shown.
- The health check retries every 2 seconds until the API responds.
- The service worker does not intercept `/api/*`, so health checks always reach the server.
- Once an admin page is open, the admin layout sends a `/api/health` request immediately and then every 14 minutes.
- The 14-minute timer is cleared when leaving the admin area.
