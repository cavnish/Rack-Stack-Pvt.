import { createServer } from "node:http";
import {
  createBrotliCompress,
  createGzip,
  constants as zlibConstants,
} from "node:zlib";
import next from "next";

const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
// `npm start` is the only entry point for this file and it runs a production
// build, so production is the default. Deriving this from `NODE_ENV !== "production"`
// would silently boot Next in dev mode, because `node server.mjs` leaves
// NODE_ENV unset. Opt into dev explicitly.
const dev = process.env.SERVER_DEV === "1" || process.env.NODE_ENV === "development";

/**
 * Compression for the custom server.
 *
 * `next start` compresses, but a custom `server.mjs` bypasses Next's own HTTP
 * server entirely, so every response left this process uncompressed: the
 * homepage shipped 357 KB of HTML, product pages 335 KB, and `/_next/static`
 * JS/CSS had no `Content-Encoding` at all. These are the largest single
 * payload win available and they apply to every route.
 */

/** Text-ish payloads that compress well and are safe to recompress. */
const COMPRESSIBLE =
  /^(?:text\/|application\/(?:javascript|ecmascript|json|xml|x-javascript|x-httpd-php|rss\+xml|atom\+xml|manifest\+json|xhtml\+xml|x-font-ttf|vnd\.ms-fontobject|ld\+json))/i;

/**
 * Already-compressed binary payloads. Compressing these costs CPU and can
 * inflate them. `image/svg+xml` is deliberately absent: SVG is markup and is
 * one of the best-compressing types the site serves.
 */
const INCOMPRESSIBLE =
  /^(?:image\/(?!svg)|video\/|audio\/|font\/(?!svg)|application\/(?:zip|gzip|x-gzip|x-bzip2|x-7z-compressed|x-rar-compressed|x-compress|x-xz|pdf|octet-stream|wasm|vnd\.ms-excel|x-makeself|epub\+zip))/i;

const BROTLI_QUALITY = 5;
const GZIP_LEVEL = 6;

/** Responses below this size are not worth a compression context. */
const MIN_BYTES = 512;

/**
 * Pick the best encoding this client accepts, honouring q-values so an
 * explicit `br;q=0` correctly falls back to gzip.
 */
function negotiateEncoding(header) {
  if (!header) return null;
  const weights = new Map();
  for (const part of String(header).toLowerCase().split(",")) {
    const [rawName, ...params] = part.trim().split(";");
    const name = rawName?.trim();
    if (!name) continue;
    let q = 1;
    for (const param of params) {
      const match = /^\s*q\s*=\s*([\d.]+)\s*$/i.exec(param);
      if (match) q = Number.parseFloat(match[1]);
    }
    weights.set(name, Number.isFinite(q) ? q : 0);
  }
  const br = weights.get("br") ?? 0;
  const gzip = weights.get("gzip") ?? 0;
  if (br >= 0.1 && br >= gzip) return "br";
  if (gzip >= 0.1) return "gzip";
  return null;
}

function shouldCompressType(contentType) {
  if (!contentType) return false;
  if (INCOMPRESSIBLE.test(contentType)) return false;
  return COMPRESSIBLE.test(contentType);
}

function addVaryAcceptEncoding(res) {
  const existing = res.getHeader("Vary");
  if (!existing) {
    res.setHeader("Vary", "Accept-Encoding");
    return;
  }
  const values = String(existing)
    .split(",")
    .map((value) => value.trim().toLowerCase());
  if (!values.includes("accept-encoding")) {
    res.setHeader("Vary", `${existing}, Accept-Encoding`);
  }
}

/**
 * Wrap `res` so the first header flush decides whether to compress. The
 * decision has to wait for that point because `Content-Type` is not known
 * until Next sets it.
 */
function attachCompression(req, res, encoding) {
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);
  const originalWriteHead = res.writeHead.bind(res);
  const originalFlushHeaders = res.flushHeaders?.bind(res);

  let decided = false;
  let compressing = false;
  let stream = null;

  const decline = () => {
    decided = true;
    compressing = false;
    // Keep Next's own Content-Length: we are not touching the body.
  };

  const decide = (pendingHeaders) => {
    if (decided) return;
    decided = true;

    const headerValue = (name) =>
      pendingHeaders?.[name] ?? res.getHeader(name) ?? undefined;

    const status = res.statusCode;
    if (status === 204 || status === 205 || status === 304 || status < 200) {
      decline();
      return;
    }

    const existingEncoding = headerValue("content-encoding");
    if (existingEncoding && existingEncoding !== "identity") {
      decline(); // never double-compress
      return;
    }

    if (!shouldCompressType(headerValue("content-type"))) {
      decline();
      return;
    }

    const declaredLength = headerValue("content-length");
    if (declaredLength !== undefined) {
      const length = Number(declaredLength);
      if (Number.isFinite(length) && length < MIN_BYTES) {
        decline();
        return;
      }
    }

    compressing = true;
    res.setHeader("Content-Encoding", encoding);
    // The encoded length is unknown until the stream ends.
    res.removeHeader("Content-Length");
    addVaryAcceptEncoding(res);

    stream =
      encoding === "br"
        ? createBrotliCompress({
            params: {
              [zlibConstants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY,
              [zlibConstants.BROTLI_PARAM_SIZE_HINT]: declaredLength
                ? Number(declaredLength)
                : 0,
            },
          })
        : createGzip({ level: GZIP_LEVEL });

    stream.on("data", (chunk) => {
      if (!originalWrite(chunk)) stream.pause();
    });
    stream.on("end", () => originalEnd());
    stream.on("error", () => {
      compressing = false;
      originalEnd();
    });
    res.on("drain", () => stream?.resume());
  };

  res.writeHead = function writeHead(statusCode, ...rest) {
    const pending =
      rest[0] && typeof rest[0] === "object" && !Array.isArray(rest[0])
        ? rest[0]
        : undefined;
    if (pending && pending["content-type"]) res.setHeader("content-type", pending["content-type"]);
    decide(pending);
    return originalWriteHead(statusCode, ...rest);
  };

  res.flushHeaders = function flushHeaders() {
    decide();
    return originalFlushHeaders ? originalFlushHeaders() : undefined;
  };

  res.write = function write(chunk, encodingOrCallback, maybeCallback) {
    if (!decided) decide();
    if (!compressing) return originalWrite(chunk, encodingOrCallback, maybeCallback);
    return stream.write(chunk, encodingOrCallback, maybeCallback);
  };

  res.end = function end(chunk, encodingOrCallback, maybeCallback) {
    if (!decided) decide();
    if (!compressing) return originalEnd(chunk, encodingOrCallback, maybeCallback);

    let body = chunk;
    let encoding = encodingOrCallback;
    let callback = maybeCallback;
    if (typeof body === "function") {
      callback = body;
      body = undefined;
      encoding = undefined;
    } else if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }

    if (body !== undefined && body !== null && body.length) {
      if (callback) {
        if (encoding) stream.end(body, encoding, callback);
        else stream.end(body, callback);
      } else if (encoding) stream.end(body, encoding);
      else stream.end(body);
      return res;
    }

    stream.end();
    if (callback) stream.once("end", callback);
    return res;
  };
}

const compressionMiddleware = dev
  ? () => false
  : (req, res) => {
      if (req.method === "HEAD" || req.headers.range) {
        return false; // no body to compress / partial content
      }
      const encoding = negotiateEncoding(req.headers["accept-encoding"]);
      if (!encoding) return false;
      attachCompression(req, res, encoding);
      return true;
    };

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

await app.prepare();

const server = createServer((request, response) => {
  const compressed = compressionMiddleware(request, response);
  const done = () => handle(request, response);
  if (compressed) {
    response.on("error", () => {});
    done();
  } else {
    done();
  }
});

// Bound slow/hostile clients so a stalled socket cannot pin a slot forever.
server.requestTimeout = 60_000;
server.headersTimeout = 70_000;
server.keepAliveTimeout = 15_000;
server.maxRequestsPerSocket = 0;

server.listen(port, hostname, () => {
  console.log(`Rack & Stack production server ready on http://${hostname}:${port}`);
});

server.on("error", (error) => {
  console.error("[server] http server error", error);
  process.exitCode = 1;
});

// Track sockets so shutdown does not wait on keep-alive connections.
const sockets = new Set();
server.on("connection", (socket) => {
  sockets.add(socket);
  socket.on("close", () => sockets.delete(socket));
});

let shuttingDown = false;
const shutdown = (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[server] ${signal} received, closing`);
  const force = setTimeout(() => {
    for (const socket of sockets) socket.destroy();
    process.exit(0);
  }, 10_000);
  force.unref();
  server.close(() => {
    clearTimeout(force);
    process.exit(0);
  });
  for (const socket of sockets) socket.end();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  console.error("[server] unhandled rejection", reason);
});