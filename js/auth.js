import {
  clientes,
  salvarSessao,
  carrinho,
  salvarCarrinho,
  tentativasLogin,
  salvarTentativasLogin,
  limparTentativasLogin,
  estoqueLocal
} from './storage.js';
import { validarEmail, hashSenha } from './utils.js';
import { seedAdmin } from './ui.js';
import { produtos } from '../data/produtos.js';

const formulario = document.getElementById('form-login');
const mensagemLogin = document.getElementById('mensagem-login');
const mensagemBloqueio = document.getElementById('bloqueio-login');

mostrarAvisoDaPagina();

/** Mostra uma mensagem quando o login foi aberto por outra página. */
function mostrarAvisoDaPagina() {
  const avisos = {
    cadastrado: 'Conta criada. Faça login para continuar.',
    acesso: 'Entre com uma conta autorizada para acessar essa página.',
    expirada: 'Sua sessão expirou. Entre novamente para continuar.',
    'sessao-encerrada': 'Você saiu da sua conta.'
  };

  const codigoDoAviso = new URLSearchParams(location.search).get('aviso');
  if (avisos[codigoDoAviso]) {
    mensagemLogin.textContent = avisos[codigoDoAviso];
  }
}

/** Atualiza a contagem regressiva depois de muitas tentativas de login. */
function atualizarBloqueio() {
  const bloqueio = tentativasLogin();
  const segundosRestantes = Math.ceil((bloqueio.ate - Date.now()) / 1000);
  const botaoEntrar = formulario.querySelector('button[type="submit"]');

  if (segundosRestantes > 0) {
    botaoEntrar.disabled = true;
    mensagemBloqueio.textContent =
      'Tente novamente em ' + segundosRestantes + ' segundos.';
    setTimeout(atualizarBloqueio, 1000);
    return;
  }

  botaoEntrar.disabled = false;
  mensagemBloqueio.textContent = '';

  if (bloqueio.ate) {
    limparTentativasLogin();
  }
}

/** Registra uma tentativa que não deu certo. */
function registrarFalhaDeLogin() {
  const bloqueio = tentativasLogin();
  bloqueio.total += 1;

  if (bloqueio.total >= 3) {
    bloqueio.total = 0;
    bloqueio.ate = Date.now() + 60 * 1000;
  }

  salvarTentativasLogin(bloqueio);
  mensagemLogin.textContent = 'E-mail ou senha inválidos';
  atualizarBloqueio();
}

/** Junta o carrinho do visitante com o carrinho da conta. */
function juntarCarrinhos(idDoCliente) {
  const carrinhoDoVisitante = carrinho('visitante');
  const carrinhoDoCliente = carrinho(idDoCliente);

  carrinhoDoVisitante.forEach(itemVisitante => {
    const produto = produtos.find(item => item.id === itemVisitante.produtoId);
    if (!produto) return;

    const itemDoCliente = carrinhoDoCliente.find(
      item => item.produtoId === itemVisitante.produtoId
    );
    const quantidadeAntiga = itemDoCliente ? itemDoCliente.quantidade : 0;
    const quantidadeDisponivel = estoqueLocal(produto.id, produto.estoque);
    const quantidadeNova = Math.min(
      itemVisitante.quantidade + quantidadeAntiga,
      quantidadeDisponivel
    );

    if (itemDoCliente) {
      itemDoCliente.quantidade = quantidadeNova;
    } else if (quantidadeNova > 0) {
      carrinhoDoCliente.push({
        produtoId: produto.id,
        quantidade: quantidadeNova,
        estoque: quantidadeDisponivel
      });
    }
  });

  salvarCarrinho(carrinhoDoCliente, idDoCliente);
  salvarCarrinho([], 'visitante');
}

/** Verifica os dados e inicia uma sessão para o cliente. */
async function entrar(evento) {
  evento.preventDefault();
  atualizarBloqueio();

  if (tentativasLogin().ate > Date.now()) return;

  // Espera a conta de administrador ser criada na primeira visita.
  await seedAdmin;

  const email = formulario.elements.email.value.trim().toLowerCase();
  const senha = formulario.elements.senha.value;
  const listaDeClientes = clientes();
  let cliente = null;

  if (validarEmail(email)) {
    cliente = listaDeClientes.find(item =>
      typeof item.email === 'string' && item.email.toLowerCase() === email
    );
  }

  if (!cliente || cliente.bloqueado) {
    registrarFalhaDeLogin();
    return;
  }

  const senhaProtegida = await hashSenha(senha, cliente.salt);

  if (senhaProtegida.hash !== cliente.senhaHash) {
    registrarFalhaDeLogin();
    return;
  }

  limparTentativasLogin();
  juntarCarrinhos(cliente.id);

  const dadosDaSessao = {
    usuarioId: cliente.id,
    perfil: cliente.perfil || 'cliente',
    inicio: Date.now(),
    expira: Date.now() + 30 * 60 * 1000
  };
  salvarSessao(dadosDaSessao);

  const paginaDeRetorno = new URLSearchParams(location.search).get('retorno');
  const paginasPermitidas = /^(index|loja|perfil|relatorios)\.html(?:[?#].*)?$/;

  if (paginasPermitidas.test(paginaDeRetorno || '')) {
    location.href = paginaDeRetorno;
  } else {
    location.href = 'index.html';
  }
}

if (formulario) {
  atualizarBloqueio();
  formulario.addEventListener('submit', entrar);
}
