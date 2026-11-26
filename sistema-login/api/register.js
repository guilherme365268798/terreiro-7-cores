const crypto = require('crypto');

const globalStore = globalThis.__i7cAuthStore || { users: [] };
globalThis.__i7cAuthStore = globalStore;

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
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
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (name.length < 2) {
      return res.status(400).json({ error: 'Informe seu nome.' });
    }
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const exists = globalStore.users.some((u) => u.email === email);
    if (exists) {
      return res.status(409).json({ error: 'Esse e-mail já tem cadastro.' });
    }

    const newUser = {
      id: Date.now(),
      name,
      email,
      passwordHash: hashPassword(password)
    };

    globalStore.users.push(newUser);

    const secret = process.env.JWT_SECRET || 'instituto-sete-cores-vercel-chave';
    const token = signToken(
      { id: newUser.id, email: newUser.email, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 },
      secret
    );

    return res.status(201).json({
      message: 'Acesso criado com sucesso.',
      token,
      user: { name: newUser.name, email: newUser.email }
    });
  } catch (_) {
    return res.status(500).json({ error: 'Erro ao criar o acesso.' });
  }
};
