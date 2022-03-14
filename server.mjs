import fs from 'fs'
import path from 'path'
import express from 'express'
import { createServer } from 'vite'

const resolve = (p) => path.resolve(p)

const manifest = {}

const app = express()

const vite = await createServer({
  root: resolve('.'),
  logLevel: 'info',
  server: {
    middlewareMode: 'ssr',
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
    const url = req.originalUrl;

    let template, render;

    template = fs.readFileSync(resolve('index.html'), 'utf-8');
    template = await vite.transformIndexHtml(url, template);
    render = (await vite.ssrLoadModule('/src/entry-server.ts')).render;

    const appHtml = await render(url, manifest);

    const html = template
      .replace(`<!--app-html-->`, appHtml);

    res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
  } catch (e) {
    vite && vite.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});


app.listen(3000, () => {
  console.log('http://localhost:3000');
})
