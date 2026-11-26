const authScreen = document.getElementById('auth-screen');
const terreiroScreen = document.getElementById('terreiro-screen');
const form = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const formSubtitle = document.getElementById('form-subtitle');
const nameGroup = document.getElementById('name-group');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordHint = document.getElementById('password-hint');
const keepLoggedCheckbox = document.getElementById('keep-logged');
const togglePasswordBtn = document.getElementById('toggle-password');
const forgotPasswordBtn = document.getElementById('forgot-password-btn');
const submitBtn = document.getElementById('submit-btn');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-link');
const feedback = document.getElementById('feedback');

const headerUserPill = document.getElementById('header-user-pill');
const terreiroGreeting = document.getElementById('terreiro-greeting');
const terreiroLogoutBtn = document.getElementById('terreiro-logout-btn');

const navTabs = Array.from(document.querySelectorAll('.nav-tab'));
const sections = {
  inicio: document.getElementById('sec-inicio'),
  giras: document.getElementById('sec-giras'),
  recados: document.getElementById('sec-recados')
};
const goGirasBtn = document.getElementById('go-giras-btn');
const goRecadosBtn = document.getElementById('go-recados-btn');

const agendaForm = document.getElementById('agenda-form');
const agendaDayInput = document.getElementById('agenda-day');
const agendaTitleInput = document.getElementById('agenda-title');
const agendaList = document.getElementById('agenda-list');

const noticeForm = document.getElementById('notice-form');
const noticeInput = document.getElementById('notice-input');
const noticeList = document.getElementById('notice-list');

const SESSION_USER_KEY = 'i7c_saved_user';
const TOKEN_KEY = 'auth_token';
const LAST_EMAIL_KEY = 'i7c_last_email';
const NOTICES_KEY = 'i7c_terreiro_notices';
const AGENDA_KEY = 'i7c_terreiro_agenda';

let isLogin = true;

function getSavedSession() {
  const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  let user = null;
  try {
    user = JSON.parse(
      localStorage.getItem(SESSION_USER_KEY) || sessionStorage.getItem(SESSION_USER_KEY) || 'null'
    );
  } catch (_) {}

  if (token && user && user.email) {
    return { token, user };
  }
  return null;
}

function saveSession(token, user, persistLocally = true) {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);

  const storage = persistLocally ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(SESSION_USER_KEY, JSON.stringify(user));

  if (user && user.email) {
    try {
      localStorage.setItem(LAST_EMAIL_KEY, user.email);
    } catch (_) {}
  }
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(SESSION_USER_KEY);
}

function getLastEmail() {
  try {
    return localStorage.getItem(LAST_EMAIL_KEY) || '';
  } catch (_) {
    return '';
  }
}

function readJsonList(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
}

function writeJsonList(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (_) {}
}

function switchSection(sectionName) {
  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    el.classList.toggle('hidden', key !== sectionName);
  });
  navTabs.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });
}

function renderAgenda() {
  const items = readJsonList(AGENDA_KEY);
  agendaList.innerHTML = '';

  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'notice-item';
    li.textContent = 'Nenhuma gira ou atividade cadastrada ainda.';
    agendaList.appendChild(li);
    return;
  }

  items.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'notice-item';

    const span = document.createElement('span');
    const dayStrong = document.createElement('strong');
    dayStrong.className = 'agenda-meta';
    dayStrong.textContent = `${item.day}:`;
    span.appendChild(dayStrong);
    span.appendChild(document.createTextNode(` ${item.title}`));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'remove-btn';
    delBtn.textContent = 'Remover';
    delBtn.addEventListener('click', () => {
      const updated = readJsonList(AGENDA_KEY).filter((_, idx) => idx !== index);
      writeJsonList(AGENDA_KEY, updated);
      renderAgenda();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    agendaList.appendChild(li);
  });
}

function renderNotices() {
  const items = readJsonList(NOTICES_KEY);
  noticeList.innerHTML = '';

  if (items.length === 0) {
    const li = document.createElement('li');
    li.className = 'notice-item';
    li.textContent = 'Nenhum recado salvo ainda.';
    noticeList.appendChild(li);
    return;
  }

  items.forEach((text, index) => {
    const li = document.createElement('li');
    li.className = 'notice-item';

    const span = document.createElement('span');
    span.textContent = text;

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'remove-btn';
    delBtn.textContent = 'Remover';
    delBtn.addEventListener('click', () => {
      const updated = readJsonList(NOTICES_KEY).filter((_, idx) => idx !== index);
      writeJsonList(NOTICES_KEY, updated);
      renderNotices();
    });

    li.appendChild(span);
    li.appendChild(delBtn);
    noticeList.appendChild(li);
  });
}

function setFeedback(message = '', type = '') {
  feedback.textContent = message;
  feedback.className = type ? `feedback ${type}` : 'feedback';
}

function updatePasswordHint() {
  const len = passwordInput.value.length;
  if (len === 0) {
    passwordHint.textContent = 'Mínimo de 6 caracteres.';
    passwordHint.className = 'input-hint';
    return;
  }
  if (len < 6) {
    passwordHint.textContent = `Faltam ${6 - len} caractere(s).`;
    passwordHint.className = 'input-hint';
  } else {
    passwordHint.textContent = 'Tudo certo com a senha.';
    passwordHint.className = 'input-hint ok';
  }
}

function openTerreiroSite(user) {
  const displayName = user?.name || user?.email?.split('@')[0] || 'Visitante';
  headerUserPill.textContent = displayName;
  terreiroGreeting.textContent = `Olá, ${displayName}`;
  renderAgenda();
  renderNotices();
  switchSection('inicio');

  document.body.classList.remove('mode-auth');
  authScreen.classList.add('hidden');
  terreiroScreen.classList.remove('hidden');
}

function showLoginScreen(prefillEmail = '') {
  document.body.classList.add('mode-auth');
  terreiroScreen.classList.add('hidden');
  authScreen.classList.remove('hidden');
  if (prefillEmail) {
    emailInput.value = prefillEmail;
  }
  updateModeUI();
}

function updateModeUI() {
  setFeedback('');
  emailInput.classList.remove('invalid');
  passwordInput.classList.remove('invalid');
  nameInput.classList.remove('invalid');

  if (isLogin) {
    formTitle.textContent = 'Que bom te ver por aqui';
    formSubtitle.textContent = 'Informe seu e-mail e senha para continuar.';
    nameGroup.classList.add('hidden');
    nameInput.required = false;
    passwordInput.autocomplete = 'current-password';
    forgotPasswordBtn.classList.remove('hidden');
    submitBtn.textContent = 'Continuar';
    toggleText.textContent = 'Primeiro acesso por aqui?';
    toggleLink.textContent = 'Criar acesso';
  } else {
    formTitle.textContent = 'Criar seu acesso';
    formSubtitle.textContent = 'Preencha os dados abaixo para começar.';
    nameGroup.classList.remove('hidden');
    nameInput.required = true;
    passwordInput.autocomplete = 'new-password';
    forgotPasswordBtn.classList.add('hidden');
    submitBtn.textContent = 'Concluir cadastro';
    toggleText.textContent = 'Já tem acesso?';
    toggleLink.textContent = 'Entrar';
  }
}

navTabs.forEach((btn) => {
  btn.addEventListener('click', () => switchSection(btn.dataset.section));
});

goGirasBtn.addEventListener('click', () => switchSection('giras'));
goRecadosBtn.addEventListener('click', () => switchSection('recados'));

toggleLink.addEventListener('click', (e) => {
  e.preventDefault();
  isLogin = !isLogin;
  updateModeUI();
});

togglePasswordBtn.addEventListener('click', () => {
  const isPass = passwordInput.type === 'password';
  passwordInput.type = isPass ? 'text' : 'password';
  togglePasswordBtn.textContent = isPass ? '🙈' : '👁️';
});

passwordInput.addEventListener('input', () => {
  passwordInput.classList.remove('invalid');
  updatePasswordHint();
});

emailInput.addEventListener('input', () => emailInput.classList.remove('invalid'));
nameInput.addEventListener('input', () => nameInput.classList.remove('invalid'));

forgotPasswordBtn.addEventListener('click', () => {
  const email = emailInput.value.trim();
  if (email) {
    setFeedback(`Esqueceu a senha de ${email}? Fale com quem cuida do acesso na casa.`, 'info');
  } else {
    setFeedback('Esqueceu sua senha? Peça para quem cuida do acesso redefinir.', 'info');
  }
});

terreiroLogoutBtn.addEventListener('click', () => {
  const previousEmail = getSavedSession()?.user?.email || getLastEmail();
  clearSession();
  isLogin = true;
  passwordInput.value = '';
  updatePasswordHint();
  showLoginScreen(previousEmail);
  setFeedback('Você saiu desta conta neste aparelho.', 'info');
});

agendaForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const day = agendaDayInput.value.trim();
  const title = agendaTitleInput.value.trim();
  if (!day || !title) return;

  const items = readJsonList(AGENDA_KEY);
  items.unshift({ day, title });
  writeJsonList(AGENDA_KEY, items);
  agendaDayInput.value = '';
  agendaTitleInput.value = '';
  renderAgenda();
});

noticeForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = noticeInput.value.trim();
  if (!text) return;

  const items = readJsonList(NOTICES_KEY);
  items.unshift(text);
  writeJsonList(NOTICES_KEY, items);
  noticeInput.value = '';
  renderNotices();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setFeedback('');

  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const persistLocally = keepLoggedCheckbox.checked;

  if (!isLogin && name.length < 2) {
    nameInput.classList.add('invalid');
    setFeedback('Digite seu nome para criar o acesso.', 'error');
    nameInput.focus();
    return;
  }

  if (!email || !email.includes('@')) {
    emailInput.classList.add('invalid');
    setFeedback('Digite um e-mail válido.', 'error');
    emailInput.focus();
    return;
  }

  if (password.length < 6) {
    passwordInput.classList.add('invalid');
    setFeedback('A senha precisa ter pelo menos 6 caracteres.', 'error');
    passwordInput.focus();
    return;
  }

  const endpoint = isLogin ? '/api/login' : '/api/register';
  const payload = isLogin ? { email, password } : { name, email, password };

  submitBtn.disabled = true;
  const defaultLabel = isLogin ? 'Continuar' : 'Concluir cadastro';
  submitBtn.textContent = isLogin ? 'Entrando...' : 'Salvando...';
  setFeedback('Conferindo seus dados...', 'info');

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      setFeedback(data.error || 'Não foi possível entrar agora.', 'error');
      return;
    }

    const userInfo = {
      name: data.user?.name || name || email.split('@')[0],
      email: data.user?.email || email
    };

    if (data.token) {
      saveSession(data.token, userInfo, persistLocally);
      openTerreiroSite(userInfo);
    } else if (!isLogin) {
      isLogin = true;
      updateModeUI();
      emailInput.value = email;
      passwordInput.value = '';
      updatePasswordHint();
      setFeedback('Acesso criado! Agora é só entrar com sua senha.', 'success');
    }
  } catch (_) {
    setFeedback('Não consegui falar com o servidor de login. Verifique as rotas /api na Vercel.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = defaultLabel;
  }
});

const activeSession = getSavedSession();
if (activeSession) {
  openTerreiroSite(activeSession.user);
} else {
  const lastEmail = getLastEmail();
  if (lastEmail) {
    emailInput.value = lastEmail;
  }
  showLoginScreen(lastEmail);
  updatePasswordHint();
}
