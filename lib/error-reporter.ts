import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'SignupSmartly <onboarding@resend.dev>';

const PII_KEYS = [
  'password',
  'token',
  'cancel_token',
  'cancelToken',
  'email',
  'name',
  'authorization',
  'cookie',
];

function sanitize(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const keyLower = k.toLowerCase();
    const isPII = PII_KEYS.some((p) => keyLower.includes(p.toLowerCase()));
    out[k] = isPII ? '[REDACTED]' : sanitize(v);
  }
  return out;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + '...';
}

function getStack(err: unknown): string {
  if (err instanceof Error && err.stack) return err.stack;
  return String(err);
}

function getErrorName(err: unknown): string {
  if (err instanceof Error) return err.name;
  return 'Error';
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

async function getRequestBody(request: Request): Promise<string> {
  try {
    const cloned = request.clone();
    const body = await cloned.json();
    return JSON.stringify(sanitize(body), null, 2);
  } catch {
    return '(unavailable - body may already be consumed)';
  }
}

function getRequestPath(request: Request): string {
  try {
    const url = new URL(request.url);
    return url.pathname + (url.search ? '?' + url.search.split('&').map((p) => p.split('=')[0] + '=...').join('&') : '');
  } catch {
    return '(unknown)';
  }
}

function buildSubject(params: {
  error: unknown;
  request?: Request;
  status?: number;
}): string {
  const { error, request, status = 500 } = params;
  const errType = getErrorName(error);
  const msg = truncate(getErrorMessage(error), 35);

  if (request) {
    const method = request.method || '?';
    const path = getRequestPath(request);
    const routePart = `${method} ${path}`.slice(0, 35);
    return `SUS ERROR: ${status} ${routePart} - ${errType}`;
  }
  return `SUS ERROR: ${errType} - ${msg}`;
}

function buildHtmlBody(params: {
  error: unknown;
  request?: Request;
  status?: number;
  extra?: Record<string, unknown>;
  bodyJson?: string;
}): string {
  const { error, request, status = 500, extra, bodyJson } = params;
  const timestamp = new Date().toISOString();
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';
  const errType = getErrorName(error);
  const errMsg = getErrorMessage(error);
  const stack = getStack(error);
  const method = request?.method ?? '(none)';
  const path = request ? getRequestPath(request) : '(none)';
  const body = bodyJson ?? (request ? 'awaiting...' : '(none)');

  const quickScan = `
    <table style="border-collapse: collapse; margin-bottom: 20px; font-family: monospace;">
      <tr><td style="padding: 4px 8px;"><strong>When:</strong></td><td>${timestamp}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>Where:</strong></td><td>${method} ${path}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>Status:</strong></td><td>${status}</td></tr>
      <tr><td style="padding: 4px 8px;"><strong>Error:</strong></td><td>${errType}: ${errMsg}</td></tr>
    </table>
  `;

  const pasteBlock = `
## SignupSmartly Error Report
Timestamp: ${timestamp}
Environment: ${env}

### Request
Method: ${method}
Path: ${path}

### Error
Type: ${errType}
Message: ${errMsg}

### Stack trace
${stack}

### Request body (sanitized)
${body}
${extra && Object.keys(extra).length > 0 ? `\n### Additional context\n${JSON.stringify(extra, null, 2)}` : ''}
`.trim();

  const escaped = pasteBlock
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; margin: 20px; color: #333;">
  <h2 style="color: #c44;">SignupSmartly Production Error</h2>
  ${quickScan}
  <h3>Debug payload — paste into Cursor to fix</h3>
  <pre style="background: #f5f5f5; padding: 16px; border-radius: 8px; overflow-x: auto; font-size: 12px; white-space: pre-wrap;">${escaped}</pre>
</body>
</html>
  `.trim();
}

export type ReportErrorParams = {
  error: unknown;
  request?: Request;
  status?: number;
  extra?: Record<string, unknown>;
};

export async function reportProductionError(params: ReportErrorParams): Promise<void> {
  const isProd =
    process.env.VERCEL_ENV === 'production' ||
    (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV !== 'preview');

  if (!isProd) return;

  if (!ADMIN_EMAIL || !process.env.RESEND_API_KEY) {
    console.warn('reportProductionError: ADMIN_EMAIL or RESEND_API_KEY not set, skipping');
    return;
  }

  const { error, request, status = 500, extra } = params;
  let bodyJson: string | undefined;
  if (request) {
    bodyJson = await getRequestBody(request);
  }

  const subject = buildSubject({ error, request, status });
  const html = buildHtmlBody({
    error,
    request,
    status,
    extra,
    bodyJson,
  });

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject,
      html,
    });
  } catch (emailErr) {
    console.error('reportProductionError: failed to send alert email:', emailErr);
  }
}
