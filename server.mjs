import fs from 'fs'
import path from 'path'
import express from 'express'
import { createServer } from 'vite'

const resolve = (p) => path.resolve(p)

const app = express()

const vite = await createServer({
  root: resolve('.'),
  logLevel: 'info',
  appType: 'custom',
  server: {
    middlewareMode: true,
    watch: {
      // During tests we edit the files too fast and sometimes chokidar
      // misses change events, so enforce polling for consistency
      usePolling: true,
      interval: 100,
    },
  },
})

// use vite's connect instance as middleware
app.use(vite.middlewares);

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl || req.url;
    const template = await vite.transformIndexHtml(url, fs.readFileSync(resolve('index.html'), 'utf-8'));
    const { render } = await vite.ssrLoadModule('/src/entry-server.ts');

    const renderRes = await render(url);

    console.log()

    const html = template
      .replace(`<!--app-html-->`, renderRes.html);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (e) {
    vite && vite.ssrFixStacktrace(e);
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});


app.listen(3000, () => {
  console.log('http://localhost:3000');
})
