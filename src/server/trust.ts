import type {IncomingMessage} from 'node:http';

function isLoopback(hostname: string) {
  if (hostname === 'localhost' || hostname === '[::1]') {
    return true;
  }
  const parts = hostname.split('.');
  return (
    parts.length === 4 &&
    parts[0] === '127' &&
    parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)
  );
}

function isTrustedHost(hostUrl: URL, trustedHosts: readonly string[]) {
  return trustedHosts.some(entry => {
    try {
      const entryUrl = new URL(`http://${entry}`);
      const entryHasPort = entry.includes(':');
      return entryHasPort
        ? entryUrl.host === hostUrl.host
        : entryUrl.hostname === hostUrl.hostname;
    } catch {
      return false;
    }
  });
}

export function isSameOriginTrustedRequest(
  req: IncomingMessage,
  trustedHosts: readonly string[] = [],
) {
  const host = req.headers.host;
  if (typeof host !== 'string') {
    return false;
  }
  let hostUrl: URL;
  try {
    hostUrl = new URL(`http://${host}`);
  } catch {
    return false;
  }
  if (!isLoopback(hostUrl.hostname) && !isTrustedHost(hostUrl, trustedHosts)) {
    return false;
  }
  if (req.headers['sec-fetch-site'] === 'cross-site') {
    return false;
  }
  const origin = req.headers.origin;
  if (typeof origin !== 'string') {
    return true;
  }
  try {
    return new URL(origin).host === hostUrl.host;
  } catch {
    return false;
  }
}
