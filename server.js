const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const rootDir = path.join(__dirname, "dist");

const contentTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".map", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".webp", "image/webp"],
  [".avif", "image/avif"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
  [".otf", "font/otf"],
  [".mp4", "video/mp4"],
  [".webm", "video/webm"],
  [".pdf", "application/pdf"],
]);

// Build-tool emitted assets (Vite/Vue) are content-hashed and safe to cache forever.
// Anything else (HTML, sitemap, robots, etc.) must revalidate so CF + browsers
// never serve stale HTML that references already-replaced asset hashes.
function cacheControlFor(urlPath, ext) {
  if (urlPath.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  if (ext === ".html" || ext === "") {
    return "public, max-age=0, must-revalidate";
  }
  // Other top-level static files (favicon, manifest, og images, robots, sitemap…):
  // allow short edge cache but require revalidation.
  return "public, max-age=300, must-revalidate";
}

function sendFile(filePath, res, urlPath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes.get(ext) || "application/octet-stream";

  fs.stat(filePath, (statErr, stats) => {
    if (statErr || !stats.isFile()) {
      sendNotFound(res);
      return;
    }

    const headers = {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "Last-Modified": stats.mtime.toUTCString(),
      "Cache-Control": cacheControlFor(urlPath, ext),
    };

    const stream = fs.createReadStream(filePath);
    let headersSent = false;

    stream.on("error", () => {
      if (!headersSent && !res.headersSent) {
        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Internal Server Error");
      } else {
        res.destroy();
      }
    });

    stream.once("open", () => {
      headersSent = true;
      res.writeHead(200, headers);
      stream.pipe(res);
    });
  });
}

function sendNotFound(res) {
  res.writeHead(404, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end("Not Found");
}

function resolvePath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split("?")[0]);
  const normalizedPath = path.posix.normalize(decodedPath);
  const safePath = normalizedPath.replace(/^\/+/, "").replace(/^(\.\.(\/|\\|$))+/, "");
  const requestedPath = safePath === "" ? "index.html" : safePath;
  const absolutePath = path.join(rootDir, requestedPath);

  if (!absolutePath.startsWith(rootDir)) {
    return null;
  }

  return absolutePath;
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad Request");
    return;
  }

  const urlPath = req.url.split("?")[0];
  const filePath = resolvePath(req.url);
  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  // Hard rule: requests under /assets/ MUST resolve to a real file in dist/assets/.
  // Never fall back to index.html for them — that's exactly what poisoned the
  // Cloudflare cache and broke the live site (CSS/JS served as HTML).
  const isAssetRequest = urlPath.startsWith("/assets/");

  fs.stat(filePath, (error, stats) => {
    if (!error && stats.isFile()) {
      sendFile(filePath, res, urlPath);
      return;
    }

    if (!error && stats.isDirectory()) {
      if (isAssetRequest) {
        sendNotFound(res);
        return;
      }
      const indexPath = path.join(filePath, "index.html");
      fs.stat(indexPath, (indexError, indexStats) => {
        if (!indexError && indexStats.isFile()) {
          sendFile(indexPath, res, urlPath);
          return;
        }
        sendNotFound(res);
      });
      return;
    }

    if (isAssetRequest) {
      sendNotFound(res);
      return;
    }

    if (path.extname(filePath)) {
      sendNotFound(res);
      return;
    }

    const fallbackPath = path.join(rootDir, "404.html");
    fs.stat(fallbackPath, (fallbackError, fallbackStats) => {
      if (!fallbackError && fallbackStats.isFile()) {
        // 404.html exists in dist; serve it with a real 404 status so CF and
        // browsers don't cache it as a successful response for arbitrary URLs.
        const stream = fs.createReadStream(fallbackPath);
        res.writeHead(404, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        });
        stream.on("error", () => res.destroy());
        stream.pipe(res);
        return;
      }
      sendNotFound(res);
    });
  });
});

server.listen(port, host, () => {
  console.log(`Static site server listening on http://${host}:${port}`);
});
