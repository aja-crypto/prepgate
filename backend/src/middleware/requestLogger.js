function requestLogger(req, res, next) {
  const start = Date.now();
  const hrStart = process.hrtime.bigint();
  const { method, path: routePath, requestId } = req;
  req._perfStart = hrStart;

  const origJson = res.json.bind(res);
  res.json = (body) => {
    try {
      const len = body ? Buffer.byteLength(JSON.stringify(body), 'utf8') : 0;
      res.setHeader('X-Response-Bytes', String(len));
    } catch {}
    return origJson(body);
  };

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const hrDurMs = Number(process.hrtime.bigint() - hrStart) / 1e6;
    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: requestId || '-',
      method,
      route: routePath,
      status: res.statusCode,
      durationMs,
      hrDurMs: Math.round(hrDurMs),
      contentLength: res.getHeader('content-length') || res.getHeader('X-Response-Bytes') || 0,
      userId: req.user?._id?.toString() || req.admin?._id?.toString() || '-',
    };
    const level = log.level === 'error' ? console.error : log.level === 'warn' ? console.warn : console.log;
    level(JSON.stringify(log));
  });

  next();
}

module.exports = { requestLogger };
