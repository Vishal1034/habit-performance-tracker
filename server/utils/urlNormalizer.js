const normalizeDomain = (input = '') => {
  if (!input || typeof input !== 'string') return '';

  const raw = input.trim().toLowerCase();
  if (!raw) return '';

  try {
    const withProtocol = raw.startsWith('http://') || raw.startsWith('https://')
      ? raw
      : `https://${raw}`;

    const hostname = new URL(withProtocol).hostname;
    return hostname.replace(/^www\./, '');
  } catch (_error) {
    return raw
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .trim();
  }
};

module.exports = { normalizeDomain };
