function parsePagination(query, defaults = {}) {
  const page = Math.max(1, parseInt(query?.page, 10) || defaults.page || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query?.limit, 10) || defaults.limit || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function parseBoundedLimit(value, fallback = 20) {
  return Math.min(100, Math.max(1, parseInt(value, 10) || fallback));
}

module.exports = { parsePagination, parseBoundedLimit };
