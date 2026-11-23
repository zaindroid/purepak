'use strict';
// Company-mailbox provisioning on the real mail server (@purepak.com.pk),
// via cPanel's `uapi` run over SSH. cPanel's own HTTPS API (port 2083) is
// firewalled off for this hosting account and returns a blanket 403
// regardless of credentials, but a plain SSH session can run `uapi` locally
// on the server, which works fine — so that's the transport used here.
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// single-quotes a value for safe inclusion in the POSIX command string sent
// as the SSH "remote command" — ssh itself does not shell-escape its
// trailing args, it just joins them with spaces and hands the whole string
// to a shell on the far end, so this has to be done by hand.
function shQuote(s) {
  return "'" + String(s).replace(/'/g, "'\\''") + "'";
}

let keyPath = null;
function ensureKeyFile() {
  if (keyPath) return keyPath;
  const raw = process.env.PUREPAK_CPANEL_SSH_KEY || '';
  if (!raw) throw new Error('PUREPAK_CPANEL_SSH_KEY not configured');
  // stored as single-line base64 (not raw PEM): the platform bakes every
  // declared env var into the Dockerfile as a build ARG, and a multi-line
  // value there breaks the Dockerfile's syntax — base64 keeps it one line.
  // A literal PEM value (starts with "-----BEGIN") is still accepted too,
  // for local/manual use outside that build pipeline.
  let normalized;
  if (raw.trimStart().startsWith('-----BEGIN')) {
    normalized = raw.includes('\\n') && !raw.includes('\n') ? raw.replace(/\\n/g, '\n') : raw;
  } else {
    normalized = Buffer.from(raw, 'base64').toString('utf8');
  }
  const p = path.join(os.tmpdir(), 'purepak-cpanel-key');
  fs.writeFileSync(p, normalized.endsWith('\n') ? normalized : normalized + '\n', { mode: 0o600 });
  keyPath = p;
  return p;
}

function cfg() {
  const host = process.env.PUREPAK_CPANEL_HOST || '';
  const port = process.env.PUREPAK_CPANEL_PORT || '22';
  const sshUser = process.env.PUREPAK_CPANEL_USER || '';
  const domain = process.env.PUREPAK_CPANEL_DOMAIN || 'purepak.com.pk';
  if (!host || !sshUser) throw new Error('cPanel SSH is not configured on this server');
  return { host, port, sshUser, domain };
}

// runs one `uapi Module function param=value ...` call over a fresh,
// short-lived SSH connection (mailbox admin actions are rare, so no
// connection pooling) and returns its parsed result.data
function runUapi(moduleName, fn, params) {
  const { host, port, sshUser } = cfg();
  const key = ensureKeyFile();
  const known = path.join(os.tmpdir(), 'purepak-cpanel-known-hosts');
  const paramStr = Object.entries(params || {}).map(([k, v]) => `${k}=${shQuote(v)}`).join(' ');
  const remoteCmd = `uapi --output=json ${moduleName} ${fn}` + (paramStr ? ' ' + paramStr : '');
  const r = spawnSync('ssh', [
    '-i', key,
    '-p', String(port),
    '-o', 'StrictHostKeyChecking=accept-new',
    '-o', 'UserKnownHostsFile=' + known,
    '-o', 'ConnectTimeout=10',
    '-o', 'BatchMode=yes',
    `${sshUser}@${host}`,
    remoteCmd,
  ], { timeout: 20000, encoding: 'utf8' });
  if (r.error) throw new Error('SSH failed: ' + r.error.message);
  if (r.status !== 0) throw new Error('SSH/uapi exited with ' + r.status + ': ' + String(r.stderr || '').slice(0, 300));
  let parsed;
  try { parsed = JSON.parse(r.stdout); } catch (e) { throw new Error('Unexpected uapi output'); }
  const result = parsed.result || {};
  if (result.errors && result.errors.length) throw new Error(result.errors.join('; '));
  return result.data;
}

// returns every @<domain> mailbox that actually exists on the mail server —
// list_pops ignores the domain= filter on this account, so it's applied here
async function listEmailAccounts() {
  const { domain } = cfg();
  const data = runUapi('Email', 'list_pops', { domain }) || [];
  const suffix = '@' + domain.toLowerCase();
  return data.map(r => r.email).filter(e => e && e.toLowerCase().endsWith(suffix));
}

async function createEmailAccount(localPart, password, quotaMb = 250) {
  const { domain } = cfg();
  runUapi('Email', 'add_pop', { email: localPart, domain, password, quota: quotaMb });
  return `${localPart}@${domain}`;
}

module.exports = { listEmailAccounts, createEmailAccount };
