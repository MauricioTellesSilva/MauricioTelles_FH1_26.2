import {
  clientes,
  salvarClientes,
  proximoId,
  sessao,
  salvarSessao
} from './storage.js';
import {
  validarEmail,
  validarCPF,
  mascararCPF,
  validarTelefone,
  validarSenha,
  hashSenha,
  erroCampo
} from './utils.js';
import { toast, proteger } from './ui.js';

/** Mostra uma mensagem junto ao campo e devolve se ele está certo. */
function validarCampo(idDoCampo, mensagem) {
  const campo = document.getElementById(idDoCampo);
  erroCampo(campo, mensagem);
  return mensagem === '';
}

/** Valida nome, e-mail, telefone e CPF de um cliente. */
function validarDadosDoCliente(dados, idDoCliente = null) {
  const listaDeClientes = clientes();
  let dadosEstaoCertos = true;

  const partesDoNome = dados.nome.trim().split(/\s+/);
  const nomeEstaCerto = partesDoNome.length >= 2 && dados.nome.trim().length >= 3;
  dadosEstaoCertos = validarCampo(
    'nome', nomeEstaCerto ? '' : 'Informe nome e sobrenome.'
  ) && dadosEstaoCertos;

  const emailJaExiste = listaDeClientes.some(cliente =>
    cliente.id !== idDoCliente &&
    typeof cliente.email === 'string' &&
    cliente.email.toLowerCase() === dados.email.toLowerCase()
  );
  let erroEmail = '';
  if (!validarEmail(dados.email)) {
    erroEmail = 'Informe um e-mail válido.';
  } else if (emailJaExiste) {
    erroEmail = 'Este e-mail já está cadastrado.';
  }
  dadosEstaoCertos = validarCampo('email', erroEmail) && dadosEstaoCertos;

  const telefoneEstaCerto = validarTelefone(dados.telefone);
  dadosEstaoCertos = validarCampo(
    'telefone', telefoneEstaCerto ? '' : 'Digite de 10 a 13 números, sem símbolos.'
  ) && dadosEstaoCertos;

  const cpfJaExiste = listaDeClientes.some(cliente =>
    cliente.id !== idDoCliente && cliente.cpf === dados.cpf
  );
  let erroCpf = '';
  if (!validarCPF(dados.cpf)) {
    erroCpf = 'Informe um CPF válido.';
  } else if (cpfJaExiste) {
    erroCpf = 'Este CPF já está cadastrado.';
  }
  dadosEstaoCertos = validarCampo('cpf', erroCpf) && dadosEstaoCertos;

  return dadosEstaoCertos;
}

function lerDadosDoFormulario(formulario) {
  return {
    nome: formulario.elements.nome.value.trim(),
    email: formulario.elements.email.value.trim(),
    telefone: formulario.elements.telefone.value,
    cpf: formulario.elements.cpf.value
  };
}

function atualizarErroEnquantoDigita(formulario, idDoCliente = null) {
  formulario.addEventListener('input', evento => {
    const dados = lerDadosDoFormulario(formulario);
    const nomeDoCampo = evento.target.name;

    if (['nome', 'email', 'telefone', 'cpf'].includes(nomeDoCampo)) {
      validarCampoPessoaEnquantoDigita(dados, nomeDoCampo, idDoCliente);
    }

    if (nomeDoCampo === 'senha') {
      const senhaEstaCerta = validarSenha(evento.target.value);
      validarCampo(
        'senha',
        senhaEstaCerta ? '' : 'Use pelo menos 8 caracteres, letras e números.'
      );
    }

    if (nomeDoCampo === 'confirmar-senha') {
      const senha = formulario.elements.senha.value;
      validarCampo(
        'confirmar-senha',
        evento.target.value === senha ? '' : 'As senhas precisam ser iguais.'
      );
    }
  });
}

function validarCampoPessoaEnquantoDigita(dados, nomeDoCampo, idDoCliente) {
  // Usamos a mesma validação do formulário completo, mas só mostramos
  // a mensagem do campo que a pessoa está editando.
  if (nomeDoCampo === 'nome') {
    const nomeTemDuasPartes = dados.nome.trim().split(/\s+/).length >= 2;
    validarCampo('nome', nomeTemDuasPartes ? '' : 'Informe nome e sobrenome.');
  }

  if (nomeDoCampo === 'email') {
    const existe = clientes().some(cliente =>
      cliente.id !== idDoCliente &&
      typeof cliente.email === 'string' &&
      cliente.email.toLowerCase() === dados.email.toLowerCase()
    );
    const mensagem = !validarEmail(dados.email)
      ? 'Informe um e-mail válido.'
      : existe ? 'Este e-mail já está cadastrado.' : '';
    validarCampo('email', mensagem);
  }

  if (nomeDoCampo === 'telefone') {
    validarCampo(
      'telefone',
      validarTelefone(dados.telefone) ? '' : 'Digite de 10 a 13 números, sem símbolos.'
    );
  }

  if (nomeDoCampo === 'cpf') {
    const existe = clientes().some(cliente =>
      cliente.id !== idDoCliente && cliente.cpf === dados.cpf
    );
    const mensagem = !validarCPF(dados.cpf)
      ? 'Informe um CPF válido.'
      : existe ? 'Este CPF já está cadastrado.' : '';
    validarCampo('cpf', mensagem);
  }
}

function prepararCadastro() {
  const formulario = document.getElementById('form-cadastro');
  if (!formulario) return;

  const campoCpf = formulario.elements.cpf;
  const campoSenha = formulario.elements.senha;
  const avisoDeForca = document.getElementById('forca-senha');

  campoCpf.addEventListener('input', () => {
    campoCpf.value = mascararCPF(campoCpf.value);
  });

  atualizarErroEnquantoDigita(formulario);

  campoSenha.addEventListener('input', () => {
    if (!campoSenha.value) {
      avisoDeForca.textContent = '';
    } else if (!validarSenha(campoSenha.value)) {
      avisoDeForca.textContent = 'Senha fraca: use letras, números e 8 caracteres.';
    } else if (campoSenha.value.length >= 12) {
      avisoDeForca.textContent = 'Senha forte.';
    } else {
      avisoDeForca.textContent = 'Senha média.';
    }
  });

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    const dados = lerDadosDoFormulario(formulario);
    const senha = campoSenha.value;
    const confirmacao = formulario.elements['confirmar-senha'].value;

    let formularioEstaCerto = validarDadosDoCliente(dados);
    formularioEstaCerto = validarCampo(
      'senha', validarSenha(senha) ? '' : 'Use pelo menos 8 caracteres, letras e números.'
    ) && formularioEstaCerto;
    formularioEstaCerto = validarCampo(
      'confirmar-senha', senha === confirmacao ? '' : 'As senhas precisam ser iguais.'
    ) && formularioEstaCerto;

    if (!formularioEstaCerto) {
      formulario.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    try {
      const senhaProtegida = await hashSenha(senha);
      const novoCliente = {
        id: proximoId('cliente', 'C'),
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        cpf: dados.cpf,
        salt: senhaProtegida.salt,
        senhaHash: senhaProtegida.hash,
        perfil: 'cliente',
        bloqueado: false,
        criadoEm: new Date().toISOString()
      };

      const listaDeClientes = clientes();
      listaDeClientes.push(novoCliente);

      if (!salvarClientes(listaDeClientes)) {
        throw new Error('Não foi possível salvar a conta.');
      }

      toast('Conta criada. Agora entre com seu e-mail e senha.');
      location.href = 'login.html?aviso=cadastrado';
    } catch (erro) {
      toast(erro.message, 'erro');
    }
  });
}

function prepararPerfil() {
  const formulario = document.getElementById('form-perfil');
  if (!formulario || !proteger()) return;

  const dadosDaSessao = sessao();
  const cliente = clientes().find(item => item.id === dadosDaSessao.usuarioId);
  if (!cliente) return;

  formulario.elements.id.value = cliente.id;
  formulario.elements.nome.value = cliente.nome;
  formulario.elements.email.value = cliente.email;
  formulario.elements.telefone.value = cliente.telefone;
  formulario.elements.cpf.value = cliente.cpf;

  formulario.elements.cpf.addEventListener('input', evento => {
    evento.target.value = mascararCPF(evento.target.value);
  });

  atualizarErroEnquantoDigita(formulario, cliente.id);

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();

    const dados = lerDadosDoFormulario(formulario);
    const senhaAtual = formulario.elements['senha-atual'].value;
    const senhaNova = formulario.elements.senha.value;
    const confirmacao = formulario.elements['confirmar-senha'].value;
    let formularioEstaCerto = validarDadosDoCliente(dados, cliente.id);

    if (senhaNova) {
      formularioEstaCerto = validarCampo(
        'senha', validarSenha(senhaNova) ? '' : 'Use pelo menos 8 caracteres, letras e números.'
      ) && formularioEstaCerto;
      formularioEstaCerto = validarCampo(
        'confirmar-senha', senhaNova === confirmacao ? '' : 'As senhas precisam ser iguais.'
      ) && formularioEstaCerto;

      if (!senhaAtual) {
        validarCampo('senha-atual', 'Digite sua senha atual para trocar a senha.');
        formularioEstaCerto = false;
      } else {
        const senhaAtualProtegida = await hashSenha(senhaAtual, cliente.salt);
        if (senhaAtualProtegida.hash !== cliente.senhaHash) {
          validarCampo('senha-atual', 'A senha atual não está certa.');
          formularioEstaCerto = false;
        }
      }
    }

    if (!formularioEstaCerto) {
      formulario.querySelector('[aria-invalid="true"]')?.focus();
      return;
    }

    const dadosMudaram = ['nome', 'email', 'telefone', 'cpf'].some(
      campo => cliente[campo] !== dados[campo]
    );

    if (!dadosMudaram && !senhaNova) {
      toast('Você não fez nenhuma alteração.', 'erro');
      return;
    }

    Object.assign(cliente, dados);

    if (senhaNova) {
      const senhaProtegida = await hashSenha(senhaNova);
      cliente.salt = senhaProtegida.salt;
      cliente.senhaHash = senhaProtegida.hash;
    }

    const listaAtualizada = clientes().map(item =>
      item.id === cliente.id ? cliente : item
    );

    if (salvarClientes(listaAtualizada)) {
      toast('Perfil atualizado com sucesso.');
    } else {
      toast('Não foi possível salvar as alterações.', 'erro');
    }
  });
}

function prepararExclusaoDaConta() {
  const botaoExcluir = document.getElementById('excluir-conta');
  const janela = document.getElementById('dialog-excluir');
  const botaoCancelar = document.getElementById('cancelar-exclusao');
  const botaoConfirmar = document.getElementById('confirmar-exclusao');

  if (!botaoExcluir || !proteger()) return;

  botaoExcluir.addEventListener('click', () => janela.showModal());
  botaoCancelar.addEventListener('click', () => janela.close());

  botaoConfirmar.addEventListener('click', () => {
    const dadosDaSessao = sessao();
    const listaAtualizada = clientes().filter(
      cliente => cliente.id !== dadosDaSessao.usuarioId
    );

    salvarClientes(listaAtualizada);
    salvarSessao(null);
    location.href = 'index.html?aviso=conta-excluida';
  });
}

prepararCadastro();
prepararPerfil();
prepararExclusaoDaConta();
