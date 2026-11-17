// Neste arquivo ficam as funções que acessam o localStorage.
const PREFIXO = 'loja:';
const VERSAO_DOS_DADOS = 1;

/** Lê um dado salvo. Se ele não existir ou estiver com erro, usa o valor padrão. */
export function ler(chave, valorPadrao) {
  try {
    const textoSalvo = localStorage.getItem(PREFIXO + chave);

    if (textoSalvo === null) {
      return valorPadrao;
    }

    const dadoSalvo = JSON.parse(textoSalvo);

    if (dadoSalvo.versao !== VERSAO_DOS_DADOS) {
      return valorPadrao;
    }

    return dadoSalvo.valor;
  } catch (erro) {
    console.error(`Não foi possível ler ${chave}.`, erro);
    return valorPadrao;
  }
}

/** Salva um dado em formato JSON e avisa se houve algum problema. */
export function gravar(chave, valor) {
  try {
    const dadoComVersao = {
      versao: VERSAO_DOS_DADOS,
      valor: valor
    };

    localStorage.setItem(PREFIXO + chave, JSON.stringify(dadoComVersao));
    return true;
  } catch (erro) {
    console.error(`Não foi possível salvar ${chave}.`, erro);
    return false;
  }
}

/** Apaga uma chave salva no navegador. */
export function remover(chave) {
  try {
    localStorage.removeItem(PREFIXO + chave);
    return true;
  } catch (erro) {
    console.error(`Não foi possível apagar ${chave}.`, erro);
    return false;
  }
}

/** Cria o próximo código de cliente sem repetir um código antigo. */
export function proximoId(tipo, prefixo) {
  const contadoresSalvos = ler('contadores', {});
  let contadores = contadoresSalvos;

  if (!contadores || typeof contadores !== 'object' || Array.isArray(contadores)) {
    contadores = {};
  }

  contadores[tipo] = Number(contadores[tipo] || 0) + 1;

  if (!gravar('contadores', contadores)) {
    throw new Error('Não foi possível criar o código da conta.');
  }

  return prefixo + String(contadores[tipo]).padStart(3, '0');
}

export function clientes() {
  const lista = ler('clientes', []);
  return Array.isArray(lista)
    ? lista.filter(cliente => cliente && typeof cliente === 'object')
    : [];
}

export function salvarClientes(lista) {
  return gravar('clientes', lista);
}

export function sessao() {
  const dadosDaSessao = ler('sessao', null);

  if (!dadosDaSessao || typeof dadosDaSessao.usuarioId !== 'string') {
    return null;
  }

  return dadosDaSessao;
}

export function salvarSessao(dadosDaSessao) {
  return gravar('sessao', dadosDaSessao);
}

export function carrinho(idDoCliente = 'visitante') {
  const itens = ler(`carrinho:${idDoCliente}`, []);
  return Array.isArray(itens)
    ? itens.filter(item => item && typeof item.produtoId === 'string' && Number.isInteger(item.quantidade) && item.quantidade > 0)
    : [];
}

export function salvarCarrinho(itens, idDoCliente = 'visitante') {
  return gravar(`carrinho:${idDoCliente}`, itens);
}

export function tentativasLogin() {
  let tentativas = ler('login-bloqueio', {});

  if (!tentativas || typeof tentativas !== 'object') {
    tentativas = {};
  }

  return {
    total: Number.isFinite(Number(tentativas.total)) ? Number(tentativas.total) : 0,
    ate: Number.isFinite(Number(tentativas.ate)) ? Number(tentativas.ate) : 0
  };
}

export function salvarTentativasLogin(tentativas) {
  return gravar('login-bloqueio', tentativas);
}

export function limparTentativasLogin() {
  return remover('login-bloqueio');
}

export function estoqueLocal(idDoProduto, estoquePadrao) {
  let estoqueSalvo = ler('estoque', {});

  if (!estoqueSalvo || typeof estoqueSalvo !== 'object') {
    estoqueSalvo = {};
  }
  const quantidade = Number(estoqueSalvo[idDoProduto]);

  if (Number.isFinite(quantidade) && quantidade >= 0) {
    return quantidade;
  }

  return estoquePadrao;
}
