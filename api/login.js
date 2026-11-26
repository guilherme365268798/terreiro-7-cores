const crypto = require('crypto');

const globalStore = globalThis.__i7cAuthStore || { users: [] };
globalThis.__i7cAuthStore = globalStore;

function verifyPassword(password, storedHash) {
  const parts = String(storedHash || '').split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !password) {
      return res.status(400).json({ error: 'Preencha e-mail e senha.' });
    }

    const user = globalStore.users.find((u) => u.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
    }

    const secret = process.env.JWT_SECRET || 'instituto-sete-cores-vercel-chave';
    const token = signToken(
      { id: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
      secret
    );

    return res.json({
      message: 'Acesso liberado.',
      token,
      user: { name: user.name, email: user.email }
    });
  } catch (_) {
    return res.status(500).json({ error: 'Erro ao entrar.' });
  }
};
