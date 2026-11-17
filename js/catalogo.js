import { produtos } from '../data/produtos.js';
import { moeda, normalizar } from './utils.js';
import { carrinho, salvarCarrinho, sessao, estoqueLocal } from './storage.js';
import { toast, montarMenu } from './ui.js';

// Estes cupons são de exemplo e funcionam até a data indicada.
const cupons = {
  PIXEL10: {
    tipo: 'percentual', valor: 10, minimo: 100,
    inicio: '2026-01-01', fim: '2027-12-31'
  },
  BEMVINDO20: {
    tipo: 'fixo', valor: 20, minimo: 150,
    inicio: '2026-01-01', fim: '2027-12-31'
  },
  FRETEGRATIS: {
    tipo: 'frete', valor: 0, minimo: 150,
    inicio: '2026-01-01', fim: '2027-12-31'
  }
};

function consultarEstoque(produto) {
  return estoqueLocal(produto.id, produto.estoque);
}

function encontrarProduto(id) {
  return produtos.find(produto => produto.id === id);
}

function criarCartao(produto, abrirDetalhes, adicionarAoCarrinho) {
  const cartao = document.createElement('article');
  const figura = document.createElement('figure');
  const imagem = document.createElement('img');
  const categoria = document.createElement('figcaption');
  const nome = document.createElement('h3');
  const descricao = document.createElement('p');
  const preco = document.createElement('p');
  const botaoDetalhes = document.createElement('button');
  const botaoAdicionar = document.createElement('button');

  imagem.src = produto.imagem;
  imagem.alt = 'Capa do jogo ' + produto.nome;
  imagem.loading = 'lazy';
  categoria.textContent = produto.categoria;
  nome.textContent = produto.nome;
  descricao.textContent = produto.descricao;
  preco.textContent = moeda.format(produto.preco);

  botaoDetalhes.type = 'button';
  botaoDetalhes.textContent = 'Ver detalhes';
  botaoDetalhes.addEventListener('click', () => abrirDetalhes(produto));

  botaoAdicionar.type = 'button';
  botaoAdicionar.textContent = 'Adicionar ao carrinho';
  botaoAdicionar.disabled = consultarEstoque(produto) < 1;
  botaoAdicionar.addEventListener('click', () => adicionarAoCarrinho(produto));

  figura.append(imagem, categoria);
  cartao.append(
    figura,
    nome,
    descricao,
    preco,
    botaoDetalhes,
    botaoAdicionar
  );

  return cartao;
}

function criarJanelaDeDetalhes(janela, produto, adicionarAoCarrinho) {
  janela.replaceChildren();

  const titulo = document.createElement('h2');
  const imagem = document.createElement('img');
  const descricao = document.createElement('p');
  const estoque = document.createElement('p');
  const rotuloQuantidade = document.createElement('label');
  const quantidade = document.createElement('input');
  const botaoAdicionar = document.createElement('button');
  const botaoFechar = document.createElement('button');

  titulo.textContent = produto.nome;
  imagem.src = produto.imagem;
  imagem.alt = 'Capa do jogo ' + produto.nome;
  descricao.textContent = produto.descricao;
  estoque.textContent = 'Disponível: ' + consultarEstoque(produto) + ' unidades.';

  rotuloQuantidade.textContent = 'Quantidade ';
  quantidade.type = 'number';
  quantidade.min = '1';
  quantidade.max = String(consultarEstoque(produto));
  quantidade.value = '1';
  rotuloQuantidade.append(quantidade);

  botaoAdicionar.type = 'button';
  botaoAdicionar.textContent = 'Adicionar ao carrinho';
  botaoAdicionar.addEventListener('click', () => {
    const numero = Number(quantidade.value);

    if (!Number.isInteger(numero) || numero < 1) {
      quantidade.focus();
      return;
    }

    adicionarAoCarrinho(produto, numero);
    janela.close();
  });

  botaoFechar.type = 'button';
  botaoFechar.textContent = 'Fechar';
  botaoFechar.addEventListener('click', () => janela.close());

  janela.append(
    titulo,
    imagem,
    descricao,
    estoque,
    rotuloQuantidade,
    botaoAdicionar,
    botaoFechar
  );
  janela.showModal();
  botaoFechar.focus();
}

function iniciarCatalogo() {
  const grade = document.getElementById('catalogo-produtos');
  if (!grade) return;

  const janela = document.getElementById('dialog-produto');
  const ehPaginaInicial = grade.dataset.destaques === 'true';

  function adicionarAoCarrinho(produto, quantidade = 1) {
    const dadosDaSessao = sessao();
    const idDoCliente = dadosDaSessao ? dadosDaSessao.usuarioId : 'visitante';
    const itens = carrinho(idDoCliente);
    const itemNoCarrinho = itens.find(item => item.produtoId === produto.id);
    const quantidadeAtual = itemNoCarrinho ? itemNoCarrinho.quantidade : 0;
    const quantidadeDisponivel = consultarEstoque(produto);

    if (quantidadeAtual + quantidade > quantidadeDisponivel) {
      toast('Não há unidades suficientes em estoque.', 'erro');
      return;
    }

    if (itemNoCarrinho) {
      itemNoCarrinho.quantidade += quantidade;
    } else {
      itens.push({
        produtoId: produto.id,
        quantidade: quantidade,
        estoque: quantidadeDisponivel
      });
    }

    salvarCarrinho(itens, idDoCliente);
    montarMenu();
    toast(produto.nome + ' foi adicionado ao carrinho.');

    if (document.getElementById('linhas-carrinho')) {
      desenharCarrinho();
    }
  }

  function abrirDetalhes(produto) {
    criarJanelaDeDetalhes(janela, produto, adicionarAoCarrinho);
  }

  function mostrarProdutos(lista) {
    grade.replaceChildren();

    lista.forEach(produto => {
      const cartao = criarCartao(produto, abrirDetalhes, adicionarAoCarrinho);
      grade.append(cartao);
    });

    const mensagemVazia = document.getElementById('catalogo-vazio');
    if (mensagemVazia) {
      mensagemVazia.hidden = lista.length > 0;
    }
  }

  const jogosParaMostrar = ehPaginaInicial ? produtos.slice(0, 4) : produtos;
  mostrarProdutos(jogosParaMostrar);
  iniciarFiltros(mostrarProdutos);
  iniciarCarrinho();

  function iniciarFiltros(atualizarCatalogo) {
    const formulario = document.getElementById('form-busca-jogos');
    if (!formulario) return;

    const campoCategoria = formulario.elements.categoria;
    const categorias = [...new Set(produtos.map(produto => produto.categoria))];

    categorias.forEach(categoria => {
      const opcao = document.createElement('option');
      opcao.value = categoria;
      opcao.textContent = categoria;
      campoCategoria.append(opcao);
    });

    function filtrarProdutos() {
      const busca = normalizar(formulario.elements.busca.value);
      const categoria = campoCategoria.value;
      const faixaDePreco = formulario.elements.preco.value;
      const ordem = formulario.elements.ordem.value;

      let resultado = produtos.filter(produto => {
        const textoDoProduto = normalizar(
          produto.nome + ' ' + produto.categoria + ' ' + produto.descricao
        );
        const combinaComBusca = textoDoProduto.includes(busca);
        const combinaComCategoria = !categoria || produto.categoria === categoria;
        const combinaComPreco = precoEstaNaFaixa(produto.preco, faixaDePreco);

        return combinaComBusca && combinaComCategoria && combinaComPreco;
      });

      if (ordem === 'menor') {
        resultado.sort((a, b) => a.preco - b.preco);
      } else if (ordem === 'maior') {
        resultado.sort((a, b) => b.preco - a.preco);
      } else if (ordem === 'nome') {
        resultado.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
      }

      atualizarCatalogo(resultado);
    }

    let tempoDeEspera;
    formulario.elements.busca.addEventListener('input', () => {
      clearTimeout(tempoDeEspera);
      tempoDeEspera = setTimeout(filtrarProdutos, 250);
    });

    ['categoria', 'preco', 'ordem'].forEach(nomeDoCampo => {
      formulario.elements[nomeDoCampo].addEventListener('change', filtrarProdutos);
    });

    formulario.addEventListener('submit', evento => {
      evento.preventDefault();
      filtrarProdutos();
    });
  }

  function precoEstaNaFaixa(preco, faixa) {
    if (!faixa) return true;
    if (faixa === '150') return preco <= 150;
    if (faixa === '150-200') return preco > 150 && preco <= 200;
    if (faixa === '200-250') return preco > 200 && preco <= 250;
    if (faixa === '250') return preco > 250;
    return true;
  }

  function iniciarCarrinho() {
    const linhas = document.getElementById('linhas-carrinho');
    if (!linhas) return;

    const dadosDaSessao = sessao();
    const idDoCliente = dadosDaSessao ? dadosDaSessao.usuarioId : 'visitante';
    const campoCep = document.getElementById('cep');
    let cupomAtivo = null;

    function alterarQuantidade(idDoProduto, diferenca) {
      const itens = carrinho(idDoCliente);
      const item = itens.find(produto => produto.produtoId === idDoProduto);
      const produto = encontrarProduto(idDoProduto);
      if (!item || !produto) return;

      item.quantidade += diferenca;
      item.quantidade = Math.max(
        0,
        Math.min(item.quantidade, consultarEstoque(produto))
      );

      const itensAtualizados = itens.filter(produto => produto.quantidade > 0);
      salvarCarrinho(itensAtualizados, idDoCliente);
      desenharCarrinho();
      montarMenu();
    }

    function calcularFrete(subtotal) {
      const mensagemFrete = document.getElementById('mensagem-frete');
      const cep = campoCep.value.replace(/\D/g, '');

      if (subtotal >= 400) {
        mensagemFrete.textContent = 'Frete grátis para compras acima de R$ 400,00.';
        return 0;
      }

      if (cep.length !== 8) {
        mensagemFrete.textContent = 'Digite um CEP válido para calcular o frete.';
        return 0;
      }

      const numeroDoCep = Number(cep);
      let regiao = 'Norte ou Sul';
      let valor = 30;

      if (numeroDoCep <= 19999999) {
        regiao = 'Sudeste';
        valor = 15;
      } else if (numeroDoCep <= 59999999) {
        regiao = 'Nordeste';
        valor = 25;
      } else if (numeroDoCep <= 79999999) {
        regiao = 'Centro-Oeste';
        valor = 22;
      }

      mensagemFrete.textContent = 'Entrega para a região ' + regiao + '.';

      if (cupomAtivo && cupomAtivo.tipo === 'frete') {
        return 0;
      }

      return valor;
    }

    function mostrarCupom() {
      const codigo = document.getElementById('cupom').value.trim().toUpperCase();
      const mensagem = document.getElementById('mensagem-cupom');
      const cupom = cupons[codigo];
      const hoje = new Date().toISOString().slice(0, 10);
      const subtotal = calcularSubtotal();

      if (!cupom) {
        cupomAtivo = null;
        mensagem.textContent = 'Não encontrei esse cupom.';
        mensagem.className = 'erro-campo';
      } else if (hoje < cupom.inicio || hoje > cupom.fim) {
        cupomAtivo = null;
        mensagem.textContent = 'Esse cupom não está dentro da validade.';
        mensagem.className = 'erro-campo';
      } else if (subtotal < cupom.minimo) {
        cupomAtivo = null;
        mensagem.textContent = 'A compra mínima é ' + moeda.format(cupom.minimo) + '.';
        mensagem.className = 'erro-campo';
      } else {
        cupomAtivo = cupom;
        mensagem.textContent = 'Cupom aplicado.';
        mensagem.className = '';
      }

      desenharCarrinho();
    }

    function calcularSubtotal() {
      let subtotal = 0;

      carrinho(idDoCliente).forEach(item => {
        const produto = encontrarProduto(item.produtoId);
        if (produto) subtotal += produto.preco * item.quantidade;
      });

      return subtotal;
    }

    function adicionarLinha(item, produto) {
      const linha = document.createElement('tr');
      const nome = document.createElement('th');
      const quantidade = document.createElement('td');
      const preco = document.createElement('td');
      const subtotal = document.createElement('td');
      const acao = document.createElement('td');
      const botaoMenos = document.createElement('button');
      const botaoMais = document.createElement('button');
      const botaoRemover = document.createElement('button');

      nome.scope = 'row';
      nome.textContent = produto.nome;
      botaoMenos.type = 'button';
      botaoMais.type = 'button';
      botaoRemover.type = 'button';
      botaoMenos.textContent = '−';
      botaoMais.textContent = '+';
      botaoRemover.textContent = 'Remover';
      botaoMenos.setAttribute('aria-label', 'Diminuir ' + produto.nome);
      botaoMais.setAttribute('aria-label', 'Aumentar ' + produto.nome);

      quantidade.append(
        botaoMenos,
        document.createTextNode(' ' + item.quantidade + ' '),
        botaoMais
      );
      preco.textContent = moeda.format(produto.preco);
      subtotal.textContent = moeda.format(produto.preco * item.quantidade);
      acao.append(botaoRemover);
      linha.append(nome, quantidade, preco, subtotal, acao);

      botaoMenos.addEventListener('click', () => alterarQuantidade(produto.id, -1));
      botaoMais.addEventListener('click', () => alterarQuantidade(produto.id, 1));
      botaoRemover.addEventListener('click', () => {
        alterarQuantidade(produto.id, -item.quantidade);
      });

      linhas.append(linha);
    }

    function desenharCarrinho() {
      const itens = carrinho(idDoCliente);
      const total = calcularSubtotal();
      linhas.replaceChildren();

      itens.forEach(item => {
        const produto = encontrarProduto(item.produtoId);
        if (produto) adicionarLinha(item, produto);
      });

      if (cupomAtivo && total < cupomAtivo.minimo) {
        cupomAtivo = null;
        const mensagem = document.getElementById('mensagem-cupom');
        mensagem.textContent = 'O carrinho ficou abaixo do mínimo. O cupom foi retirado.';
        mensagem.className = 'erro-campo';
      }

      let desconto = 0;
      if (cupomAtivo && cupomAtivo.tipo === 'percentual') {
        desconto = total * cupomAtivo.valor / 100;
      } else if (cupomAtivo && cupomAtivo.tipo === 'fixo') {
        desconto = Math.min(total, cupomAtivo.valor);
      }

      const frete = calcularFrete(total);
      document.getElementById('desconto-carrinho').textContent = moeda.format(desconto);
      document.getElementById('frete-carrinho').textContent = moeda.format(frete);
      document.getElementById('total-carrinho').textContent = moeda.format(total - desconto + frete);
      document.getElementById('carrinho-vazio').hidden = itens.length > 0;
    }

    campoCep.addEventListener('input', desenharCarrinho);
    document.getElementById('aplicar-cupom').addEventListener('click', mostrarCupom);
    desenharCarrinho();
  }
}

iniciarCatalogo();
