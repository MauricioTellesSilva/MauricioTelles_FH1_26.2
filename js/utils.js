// Formatação usada nas páginas.
export const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

export const dataHora = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short'
});

/** Deixa o texto sem acentos e em letras minúsculas para facilitar a busca. */
export function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function digitos(valor) {
  return String(valor || '').replace(/\D/g, '');
}

/** Confere os dois números finais do CPF usando a regra dos dígitos verificadores. */
export function validarCPF(valor) {
  const cpf = digitos(valor);

  if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) {
    return false;
  }

  let somaPrimeiroNumero = 0;
  for (let i = 0; i < 9; i += 1) {
    somaPrimeiroNumero += Number(cpf[i]) * (10 - i);
  }

  let primeiroNumero = (somaPrimeiroNumero * 10) % 11;
  if (primeiroNumero === 10) primeiroNumero = 0;

  let somaSegundoNumero = 0;
  for (let i = 0; i < 10; i += 1) {
    somaSegundoNumero += Number(cpf[i]) * (11 - i);
  }

  let segundoNumero = (somaSegundoNumero * 10) % 11;
  if (segundoNumero === 10) segundoNumero = 0;

  return primeiroNumero === Number(cpf[9]) && segundoNumero === Number(cpf[10]);
}

/** Coloca pontos e hífen no CPF enquanto a pessoa digita. */
export function mascararCPF(valor) {
  const numeros = digitos(valor).slice(0, 11);
  let cpf = numeros;

  if (numeros.length > 3) {
    cpf = numeros.slice(0, 3) + '.' + numeros.slice(3);
  }
  if (numeros.length > 6) {
    cpf = numeros.slice(0, 3) + '.' + numeros.slice(3, 6) + '.' + numeros.slice(6);
  }
  if (numeros.length > 9) {
    cpf = numeros.slice(0, 3) + '.' + numeros.slice(3, 6) + '.' + numeros.slice(6, 9) + '-' + numeros.slice(9);
  }

  return cpf;
}

export function validarTelefone(telefone) {
  const numeros = digitos(telefone);
  return numeros.length >= 10 && numeros.length <= 13 && numeros.length === telefone.length;
}

export function validarSenha(senha) {
  const temOitoCaracteres = senha.length >= 8;
  const temLetra = /[A-Za-zÀ-ÿ]/.test(senha);
  const temNumero = /\d/.test(senha);

  return temOitoCaracteres && temLetra && temNumero;
}

/** Cria um hash da senha. O salt é diferente para cada conta. */
export async function hashSenha(senha, saltExistente = null) {
  if (!globalThis.crypto || !globalThis.crypto.subtle) {
    throw new Error('Abra o site pelo comando npm run dev para proteger a senha.');
  }

  let salt = saltExistente;

  if (!salt) {
    const numerosAleatorios = globalThis.crypto.getRandomValues(new Uint8Array(16));
    salt = btoa(String.fromCharCode(...numerosAleatorios));
  }

  const textoParaHash = salt + ':' + senha;
  const bytes = new TextEncoder().encode(textoParaHash);
  const resultado = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const numerosDoHash = Array.from(new Uint8Array(resultado));
  const hash = numerosDoHash
    .map(numero => numero.toString(16).padStart(2, '0'))
    .join('');

  return { salt: salt, hash: hash };
}

/** Mostra ou apaga a mensagem de erro que pertence a um campo. */
export function erroCampo(campo, mensagem) {
  const mensagemDeErro = document.getElementById(campo.id + '-erro');

  if (mensagemDeErro) {
    mensagemDeErro.textContent = mensagem;
  }

  campo.setAttribute('aria-invalid', mensagem ? 'true' : 'false');
}
