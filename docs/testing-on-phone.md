# Testing on a phone with ngrok

Use this guide to open your local app on a phone through a public HTTPS link, like a deployed version.

The phone camera only works on HTTPS, so `http://192.168.x.x` does not work. ngrok gives you an HTTPS link.

## One-time setup

1. Install ngrok:
   - Windows: `winget install ngrok.ngrok` (or download from ngrok.com)
   - macOS: `brew install ngrok`
   - Linux: follow the install page on ngrok.com
2. Create a free account on ngrok.com.
3. Copy your **Authtoken** from the dashboard (not an API key) and run:

   ```bash
   ngrok config add-authtoken <your token>
   ```

   Never commit the token to Git.

## Every time you test

1. Start the web app:

   ```bash
   npm run dev
   ```

   Vite uses port `5173` by default (check the terminal).

2. In a second terminal, start the tunnel:

   ```bash
   ngrok http 5173
   ```

3. Open the `https://...ngrok-free.app` link that ngrok prints on your phone.
   On the free plan you may see a warning page the first time. Tap "Visit Site".
4. When you finish, stop ngrok with `Ctrl+C`.

## Closer to the deployed version (recommended)

The dev server is not the same as the real build. To test the build:

```bash
npm run build
npm run preview
ngrok http 4173
```

Run `ngrok` in a second terminal. Vite preview uses port `4173` by default.

## Troubleshooting

**"Blocked request. This host is not allowed"**
Newer Vite versions block unknown host names. The web package's `vite.config.ts` must contain:

```ts
server: {
  allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev'],
},
```

If preview still blocks the host, add the same `allowedHosts` under `preview`.

**"authentication failed" (ERR_NGROK_105)**
The saved token is not a real authtoken. Copy the **Authtoken** again from https://dashboard.ngrok.com/get-started/your-authtoken and run the `ngrok config add-authtoken` command again.

**API calls fail on the phone**
On the phone, `localhost` means the phone itself. The Vite proxy forwards `/api` to the server, so the app must call `/api/...` (a relative path), not `http://localhost:3000`. Then one ngrok link is enough for both the website and the API.

## Notes

- Anyone with the link can open the site while ngrok runs.
- The free link changes every time ngrok restarts.
- Cookies are stored per address, so the ngrok link has its own settings cookie. This is a good way to test the 7-day settings cookie on a phone.
