import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import express from "express";
import compression from "compression";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 3000;

async function createServer() {
  let vite;

  if (!isProd) {
    vite = await (
      await import("vite")
    ).createServer({
      root,
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  const app = express();
  app.use(compression());

  if (vite) {
    app.use(vite.middlewares);
  } else {
    app.use(
      (await import("sirv")).default(resolve(root, "dist/client"), {
        extensions: [],
      })
    );
  }

  app.use("*", async (req, res, next) => {
    try {
      const url = req.originalUrl;

      let template, render;
      if (vite) {
        template = await (
          await import("node:fs/promises")
        ).readFile(resolve(root, "index.html"), "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
      } else {
        template = (
          await import("node:fs/promises")
        ).readFileSync(resolve(root, "dist/client/index.html"), "utf-8");
        render = (await import(resolve(root, "dist/server/entry-server.js")))
          .render;
      }

      const appHtml = render();
      const html = template.replace("<!--ssr-outlet-->", appHtml);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e) {
      if (vite) vite.ssrFixStacktrace(e);
      console.error(e);
      res.status(500).end(e.stack);
    }
  });

  app.listen(port, () => {
    console.log(`SSR server running at http://localhost:${port}`);
  });
}

createServer();
