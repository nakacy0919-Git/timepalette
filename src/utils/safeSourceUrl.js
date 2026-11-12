// Do not load authenticated URLs, active schemes, loopback or private-network resources as teaching sources.
export function safeSourceUrl(value) {
  try {
    const u = new URL(value);
    const h = u.hostname.toLowerCase().replace(/^\[|\]$/g,'').replace(/\.$/,'');
    if(u.protocol !== 'https:' || u.username || u.password || u.port && u.port !== '443') return null;
    if(!h.includes('.') || h.endsWith('.local') || h.endsWith('.localhost') || h.endsWith('.internal') || h === 'localhost' || h.includes(':')) return null;
    if(/^\d+\.\d+\.\d+\.\d+$/.test(h)) return null;
    return u.href;
  } catch { return null; }
}
