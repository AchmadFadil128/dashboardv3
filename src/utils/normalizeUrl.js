function normalizeUrl(url) {
  if (!url) return url;
  const publicUrl = process.env.PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
  if (url.includes('filer:8888') || url.includes('localhost:8888')) {
    const filename = url.substring(url.lastIndexOf('/uploads'));
    return `${publicUrl}${filename}`;
  }
  return url;
}

function normalizeItem(item, urlFields) {
  if (!item) return item;
  const normalized = { ...item };
  for (const field of urlFields) {
    if (normalized[field]) {
      normalized[field] = normalizeUrl(normalized[field]);
    }
  }
  return normalized;
}

function normalizeList(items, urlFields) {
  return items.map(item => normalizeItem(item, urlFields));
}

module.exports = { normalizeUrl, normalizeItem, normalizeList };
