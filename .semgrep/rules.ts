// Examples for `semgrep --test .semgrep/`: each `ruleid:` line must be flagged by the rule named,
// each `ok:` line must not. Not real code: this file is never compiled or imported.
declare const pool: any, reply: any, request: any, root: any, api: any, email: string, token: string, storedHash: string;

// ruleid: sql-built-with-string-interpolation
pool.query(`SELECT * FROM users WHERE email = '${email}'`);
// ruleid: sql-built-with-string-interpolation
pool.query("SELECT * FROM users WHERE email = '" + email + "'");
// ok: sql-built-with-string-interpolation
pool.query('SELECT * FROM users WHERE email = $1', [email]);

// ruleid: insecure-random-on-server
const weakToken = Math.random().toString(36);

// ruleid: secret-compared-with-equality-operator
if (storedHash === token) {}
// ok: secret-compared-with-equality-operator
if (token === undefined) {}

// ruleid: hardcoded-database-url
const url = 'postgres://admin:hunter2@db.example.com:5432/app';
// ok: hardcoded-database-url
const local = 'postgres://localhost:5432/app';

// ruleid: sensitive-value-logged
console.log({ password: request.body.password });
// ok: sensitive-value-logged
console.log({ messageId: '1' });

// ruleid: cookie-without-httponly
reply.setCookie('session', token, { path: '/api' });
// ok: cookie-without-httponly
reply.setCookie('session', token, { httpOnly: true, path: '/api' });

// ruleid: open-redirect-from-request
reply.redirect(request.query.next);
// ok: open-redirect-from-request
reply.redirect('/login');

async function page(): Promise<void> {
  const user = await api.currentUser();
  // ruleid: untrusted-data-in-innerhtml
  root.innerHTML = `<p>${user.email}</p>`;
  // ruleid: untrusted-data-in-innerhtml
  root.innerHTML = `<p>${location.hash}</p>`;
  // ok: untrusted-data-in-innerhtml
  root.innerHTML = `<p>${'C4'}</p>`;
}
