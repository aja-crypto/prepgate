function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, path: routePath, requestId } = req;

  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      requestId: requestId || '-',
      method,
      route: routePath,
      status: res.statusCode,
      durationMs,
      contentLength: res.getHeader('content-length') || 0,
      userId: req.user?._id?.toString() || req.admin?._id?.toString() || '-',
    };
    const level = log.level === 'error' ? console.error : log.level === 'warn' ? console.warn : console.log;
    level(JSON.stringify(log));
  });

  next();
}

module.exports = { requestLogger };
