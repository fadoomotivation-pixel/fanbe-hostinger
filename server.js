import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = join(__dirname, 'dist');

// Serve hashed assets with long-term cache (safe — filename changes on every build)
app.use('/assets', express.static(join(DIST, 'assets'), {
  maxAge: '1y',
  immutable: true,
}));

// Serve other static files (favicon, robots.txt, images, etc.)
app.use(express.static(DIST, { maxAge: '7d' }));

// SPA fallback — all routes return index.html (no-cache so browser always gets latest)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  res.sendFile(join(DIST, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Fanbe server running on port ${PORT}`);
});
