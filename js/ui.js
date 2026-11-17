import {
  clientes,
  sessao,
  salvarSessao,
  carrinho,
  salvarClientes,
  proximoId
} from './storage.js';
import { hashSenha } from './utils.js';

// Cria a conta administrativa na primeira vez que o site é aberto.
export const seedAdmin = criarContaAdministrativa();

async function criarContaAdministrativa() {
  const listaDeClientes = clientes();
  const administradorJaExiste = listaDeClientes.some(
    cliente => cliente.perfil === 'administrador'
  );

  if (administradorJaExiste) return;

  const senhaProtegida = await hashSenha('Admin123!');
  const administrador = {
    id: proximoId('cliente', 'C'),
    nome: 'Administrador Pixel Arena',
    email: 'admin@pixelarena.com.br',
    telefone: '11999999999',
    cpf: '529.982.247-25',
    salt: senhaProtegida.salt,
    senhaHash: senhaProtegida.hash,
    perfil: 'administrador',
    bloqueado: false,
    criadoEm: new Date().toISOString()
  };

  listaDeClientes.push(administrador);
  salvarClientes(listaDeClientes);
}

function adicionarLink(menu, texto, endereco, acao) {
  const item = document.createElement('li');
  const link = document.createElement('a');

  item.dataset.dinamico = 'true';
  link.textContent = texto;
  link.href = endereco;

  if (acao) {
    link.addEventListener('click', acao);
  }

  item.append(link);
  menu.append(item);
  return link;
}

/** Mostra opções diferentes no menu, dependendo da conta conectada. */
export function montarMenu() {
  const menu = document.querySelector('.menu-principal ul');
  if (!menu) return;

  // Apaga os links antigos para não mostrar opções repetidas.
  menu.querySelectorAll('[data-dinamico]').forEach(item => item.remove());

  menu.querySelectorAll('a').forEach(link => {
    const endereco = link.getAttribute('href') || '';
    const ehLinkDeConta = /^(cadastro|login|perfil|relatorios)\.html/.test(endereco);

    if (ehLinkDeConta) {
      link.closest('li')?.remove();
    }
  });

  const dadosDaSessao = sessao();
  let clienteAtual = null;

  if (dadosDaSessao && dadosDaSessao.expira > Date.now()) {
    clienteAtual = clientes().find(
      cliente => cliente.id === dadosDaSessao.usuarioId
    );
  }

  if (dadosDaSessao && !clienteAtual) {
    salvarSessao(null);
  }

  if (clienteAtual) {
    const primeiroNome = clienteAtual.nome.split(' ')[0];
    const saudacao = document.createElement('li');
    saudacao.dataset.dinamico = 'true';
    saudacao.textContent = 'Olá, ' + primeiroNome;
    menu.append(saudacao);

    adicionarLink(menu, 'Meu perfil', 'perfil.html');

    if (dadosDaSessao.perfil === 'administrador') {
      adicionarLink(menu, 'Relatórios', 'relatorios.html');
    }

    adicionarLink(menu, 'Sair', '#', evento => {
      evento.preventDefault();
      salvarSessao(null);
      location.href = 'index.html?aviso=sessao-encerrada';
    });
  } else {
    adicionarLink(menu, 'Entrar', 'login.html');
    adicionarLink(menu, 'Cadastrar', 'cadastro.html');
  }

  let linkCarrinho = [...menu.querySelectorAll('a')].find(link =>
    link.textContent.toLowerCase().includes('carrinho')
  );

  if (!linkCarrinho) {
    linkCarrinho = adicionarLink(menu, 'Carrinho (0)', 'loja.html#carrinho');
  }

  const idDoCliente = clienteAtual ? clienteAtual.id : 'visitante';
  const itens = carrinho(idDoCliente);
  let quantidadeTotal = 0;

  itens.forEach(item => {
    quantidadeTotal += item.quantidade;
  });

  linkCarrinho.textContent = 'Carrinho (' + quantidadeTotal + ')';
}

/** Mantém a sessão ativa enquanto a pessoa usa o site. */
export function iniciarSessao() {
  function atualizarTempoDaSessao() {
    const dadosDaSessao = sessao();
    if (!dadosDaSessao) return;

    if (dadosDaSessao.expira <= Date.now()) {
      salvarSessao(null);
      const paginaAtual = location.pathname.split('/').pop() + location.search;
      location.href = 'login.html?aviso=expirada&retorno=' + encodeURIComponent(paginaAtual);
      return;
    }

    dadosDaSessao.expira = Date.now() + 30 * 60 * 1000;
    salvarSessao(dadosDaSessao);
  }

  const eventosDeUso = ['click', 'keydown', 'input', 'pointerdown'];
  eventosDeUso.forEach(evento => {
    document.addEventListener(evento, atualizarTempoDaSessao, { passive: true });
  });

  setInterval(() => {
    const dadosDaSessao = sessao();

    if (dadosDaSessao && dadosDaSessao.expira <= Date.now()) {
      atualizarTempoDaSessao();
    }
  }, 15000);
}

/** Leva ao login quando a página exige uma conta ou perfil específico. */
export function proteger(perfilNecessario = 'cliente') {
  const dadosDaSessao = sessao();
  const clienteTemPermissao = dadosDaSessao &&
    dadosDaSessao.expira > Date.now() &&
    (perfilNecessario !== 'administrador' || dadosDaSessao.perfil === 'administrador');

  if (clienteTemPermissao) return true;

  const paginaAtual = location.pathname.split('/').pop() + location.search;
  const enderecoDeRetorno = encodeURIComponent(paginaAtual);
  location.replace('login.html?aviso=acesso&retorno=' + enderecoDeRetorno);
  return false;
}

/** Mostra uma mensagem na página sem abrir uma janela de alerta. */
export function toast(mensagem, tipo = 'sucesso') {
  let areaDeAvisos = document.getElementById('notificacoes');

  if (!areaDeAvisos) {
    areaDeAvisos = document.createElement('div');
    areaDeAvisos.id = 'notificacoes';
    areaDeAvisos.className = 'notificacoes';
    areaDeAvisos.setAttribute('aria-live', 'polite');
    document.body.append(areaDeAvisos);
  }

  const aviso = document.createElement('p');
  aviso.className = 'toast ' + tipo;
  aviso.textContent = mensagem;
  areaDeAvisos.append(aviso);

  setTimeout(() => aviso.remove(), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  montarMenu();
  iniciarSessao();
});
