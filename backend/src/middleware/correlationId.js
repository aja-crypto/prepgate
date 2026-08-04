const crypto = require('crypto');

function correlationId(req, res, next) {
  const id = req.headers['x-request-id'] || req.headers['x-correlation-id'] || crypto.randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-ID', id);
  next();
}

module.exports = { correlationId };
