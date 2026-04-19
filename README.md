# Web Applet

A small interactive web applet built with HTML, CSS, and JavaScript.

## Files

- `index.html` — main UI
- `styles.css` — applet styling
- `app.js` — counter and theme logic

## Run locally

Open `index.html` in VS Code and use `Live Server` to serve the static front-end. If you have the extension installed, right-click `index.html` and choose `Open with Live Server`.

The app will be available at `http://127.0.0.1:5500` by default.

For the Google GenAI backend, start the Express server separately in another terminal:

```powershell
copy .env.example .env
# edit .env and set GOOGLE_API_KEY
npm install
npm start
```

This keeps your API key out of source control by loading it from `.env`.

## Backend proxy for Google GenAI

This project includes `server.js`, which proxies PDF uploads to Google Generative Language API.

1. Copy `.env.example` to `.env` and set your key:

```bash
copy .env.example .env
# Then edit .env and set GOOGLE_API_KEY
```

2. Install and start the server:

```bash
npm install
npm start
```

3. Open `match.html` in a browser and use the PDF upload / GenAI query section.

The API key is loaded from the `GOOGLE_API_KEY` environment variable and is not stored in source control.
