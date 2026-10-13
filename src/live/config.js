import { isIP } from 'node:net';
import { problem } from '../errors.js';

const fail = message => { throw problem('invalid_input', 400, message); };
const fields = ['mode', 'target', 'frontendTarget', 'backendTarget', 'backendRoutes', 'requestDelayMs',
  'responseDelayMs', 'uploadKiBps', 'downloadKiBps', 'jitterMs', 'failureMode', 'headerRules', 'statusRules', 'mockRules'];
const headers = ['stripCORS', 'stripCache', 'corruptContentType'];
const shape = (value, keys) => value && typeof value === 'object' && !Array.isArray(value)
  && Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

export function defaultConfig(target) {
  return { mode: 'unified', target, frontendTarget: target, backendTarget: target, backendRoutes: ['/api', '/graphql'],
    requestDelayMs: 0, responseDelayMs: 0, uploadKiBps: 0, downloadKiBps: 0, jitterMs: 0, failureMode: 'normal',
    headerRules: { stripCORS: false, stripCache: false, corruptContentType: false }, statusRules: [], mockRules: [] };
}

export function validateAddress(address, port, blockedPorts) {
  // Normalize mapped IPv6 through URL's canonical representation, including hex forms.
  let normalized = address.toLowerCase();
  if (normalized.includes(':')) {
    normalized = new URL(`http://[${normalized}]/`).hostname.slice(1, -1);
    const mapped = /^::ffff:([0-9a-f]+):([0-9a-f]+)$/.exec(normalized);
    if (mapped) {
      const high = parseInt(mapped[1], 16), low = parseInt(mapped[2], 16);
      normalized = `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
    }
  }
  const octets = normalized.split('.').map(Number);
  const loopback = normalized === '::1' || (isIP(normalized) === 4 && octets[0] === 127);
  const forbidden = isIP(normalized) === 4
    ? octets[0] === 0 || octets[0] >= 224 || (octets[0] === 169 && octets[1] === 254) || normalized === '100.100.100.200'
    : normalized === '::' || /^fe[89ab]|^ff/.test(normalized) || normalized === 'fd00:ec2::254';
  if (forbidden || (loopback && blockedPorts.includes(port))) fail('Target resolves to a prohibited address or FaultNet listener.');
}

export function validateConfig(value, blockedPorts = []) {
  if (!shape(value, fields)) fail('Supply the complete live configuration with no unknown fields.');
  if (!['unified', 'split'].includes(value.mode)) fail('Proxy mode must be unified or split.');
  const result = structuredClone(value);
  for (const key of ['target', 'frontendTarget', 'backendTarget']) {
    let url;
    try { if (typeof value[key] !== 'string' || value[key].length > 512) fail('Invalid target.'); url = new URL(value[key]); }
    catch { fail('Targets must be absolute HTTP or HTTPS origin URLs.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      fail('Targets must be HTTP/HTTPS origins without credentials, paths, queries or fragments.');
    }
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const port = Number(url.port || (url.protocol === 'https:' ? 443 : 80));
    if (isIP(hostname)) validateAddress(hostname, port, blockedPorts);
    result[key] = url.origin;
  }
  const path = value => typeof value === 'string' && value.length <= 128 && /^\/(?!\/)[^?#\s\\]*$/.test(value);
  if (!Array.isArray(value.backendRoutes) || value.backendRoutes.length > 16 || !value.backendRoutes.every(path)) {
    fail('Use at most 16 backend path prefixes beginning with /, without spaces, queries or fragments.');
  }
  for (const [key, max] of [['requestDelayMs', 5000], ['responseDelayMs', 5000], ['jitterMs', 1000],
    ['uploadKiBps', 500000], ['downloadKiBps', 500000]]) {
    if (!Number.isInteger(value[key]) || value[key] < 0 || value[key] > max) fail(`${key} must be an integer from 0 to ${max}.`);
  }
  if (!['normal', 'timeout', 'hang_body', 'close_body'].includes(value.failureMode)) fail('Unsupported connection failure mode.');
  if (!shape(value.headerRules, headers) || !headers.every(key => typeof value.headerRules[key] === 'boolean')) fail('Invalid header controls.');
  if (!Array.isArray(value.statusRules) || value.statusRules.length > 8 || !value.statusRules.every(rule =>
    shape(rule, ['path', 'status', 'probability']) && path(rule.path) && Number.isInteger(rule.status)
    && rule.status >= 400 && rule.status <= 599 && Number.isInteger(rule.probability) && rule.probability >= 0 && rule.probability <= 100)) {
    fail('Use at most eight status rules: path prefix, status 400–599, integer probability 0–100%.');
  }
  if (!Array.isArray(value.mockRules) || value.mockRules.length > 8) fail('Use at most eight JSON mock rules.');
  for (const rule of value.mockRules) {
    if (!shape(rule, ['path', 'body', 'active']) || !path(rule.path) || typeof rule.active !== 'boolean'
      || typeof rule.body !== 'string' || Buffer.byteLength(rule.body) > 1024) fail('Each mock needs a path, active flag and JSON body of at most 1024 bytes.');
    try { JSON.parse(rule.body); } catch { fail('Mock response bodies must contain valid JSON.'); }
  }
  return result;
}
