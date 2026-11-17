# Pixel Arena

Este é um projeto de loja de jogos que fiz usando HTML, CSS e JavaScript.

## Como iniciar o site

rode:

```bash
npm run dev
```

Depois, abra <http://localhost:5173>.

## Conta de administrador

O site cria uma conta de administrador quando é aberto pela primeira vez:

- E-mail: `admin@pixelarena.com.br`
- Senha: `Admin123!`

Essa conta é só para apresentação do projeto.

## Catálogo, cupons e frete

Deixei os jogos juntos no arquivo `data/produtos.js`. Os cupons disponíveis são:

| Cupom | Desconto | Compra mínima | Validade |
| --- | --- | ---: | --- |
| `PIXEL10` | 10% | R$ 100,00 | Até 31/12/2027 |
| `BEMVINDO20` | R$ 20,00 | R$ 150,00 | Até 31/12/2027 |
| `FRETEGRATIS` | Frete grátis | R$ 150,00 | Até 31/12/2027 |

O frete é calculado pelo CEP: região Sudeste, R$ 15; Nordeste, R$ 25; Centro-Oeste, R$ 22; outros CEPs, R$ 30. Para compras a partir de R$ 400, o frete é grátis.

## Dados salvos no navegador

O projeto salva os dados no `localStorage` do navegador. O arquivo `js/storage.js` é usado para guardar e ler esses dados.

| Chave | O que fica salvo |
| --- | --- |
| `loja:clientes` | Dados das contas e senhas protegidas |
| `loja:contadores` | Contadores usados para criar os IDs |
| `loja:sessao` | Conta que está conectada e tempo da sessão |
| `loja:carrinho:visitante` | Carrinho antes de entrar na conta |
| `loja:carrinho:Cxxx` | Carrinho de cada cliente |
| `loja:login-bloqueio` | Tentativas de login e tempo de bloqueio |
| `loja:estoque` | Ajustes de estoque, se forem feitos |

As senhas são transformadas em hash com salt usando `crypto.subtle`. Como este trabalho não tem servidor de banco de dados, os dados ficam apenas no navegador usado.

## Como organizei os arquivos

- `data/produtos.js`: informações dos jogos.
- `js/storage.js`: leitura e gravação dos dados.
- `js/utils.js`: validações e formatação.
- `js/clientes.js`: cadastro, edição e exclusão de conta.
- `js/auth.js`: login e carrinho ligado à conta.
- `js/catalogo.js`: catálogo, filtros, detalhes e carrinho.
- `js/ui.js`: menu, sessão e mensagens na tela.
- `server.js`: servidor local iniciado pelo comando `npm run dev`.
