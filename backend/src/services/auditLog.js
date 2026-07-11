const AUDIT_LOG = [];
const MAX_LOG_SIZE = 1000;

function logAction({ admin, action, resource, resourceId, details, success, ip, userAgent }) {
  const entry = {
    timestamp: new Date().toISOString(),
    admin: admin?.email || 'unknown',
    adminId: admin?._id || admin?.id || 'unknown',
    action,
    resource,
    resourceId: resourceId || null,
    details: details || '',
    success: success !== false,
    ip: ip || 'unknown',
    userAgent: userAgent || '',
  };
  AUDIT_LOG.unshift(entry);
  if (AUDIT_LOG.length > MAX_LOG_SIZE) AUDIT_LOG.length = MAX_LOG_SIZE;
  return entry;
}

function auditMiddleware(action, resource) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      logAction({
        admin: req.admin,
        action,
        resource: resource || req.path,
        resourceId: req.params?.id,
        details: action === 'delete' ? `Deleted ${resource || req.path} ${req.params?.id || ''}` : '',
        success: body?.success !== false,
        ip: req.ip,
        userAgent: req.headers?.['user-agent'],
      });
      return originalJson(body);
    };
    next();
  };
}

function getAuditLogs(filter = {}) {
  let logs = AUDIT_LOG;
  if (filter.action) logs = logs.filter(l => l.action === filter.action);
  if (filter.admin) logs = logs.filter(l => l.admin === filter.admin);
  if (filter.resource) logs = logs.filter(l => l.resource.includes(filter.resource));
  if (filter.since) logs = logs.filter(l => new Date(l.timestamp) >= new Date(filter.since));
  return { count: logs.length, data: logs.slice(0, filter.limit || 200) };
}

module.exports = { logAction, auditMiddleware, getAuditLogs };
