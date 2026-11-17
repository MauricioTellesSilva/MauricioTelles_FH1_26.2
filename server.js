import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const pastaProjeto = path.dirname(fileURLToPath(import.meta.url));
const tipos = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const servidor = createServer(async (pedido, resposta) => {
  try {
    const endereco = new URL(pedido.url || '/', 'http://localhost');
    const caminhoPedido = decodeURIComponent(endereco.pathname);
    const caminhoRelativo = caminhoPedido === '/' ? 'index.html' : caminhoPedido.slice(1);
    const caminhoArquivo = path.resolve(pastaProjeto, caminhoRelativo);

    if (caminhoArquivo !== pastaProjeto && !caminhoArquivo.startsWith(`${pastaProjeto}${path.sep}`)) {
      resposta.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      resposta.end('Acesso negado.');
      return;
    }

    const conteudo = await readFile(caminhoArquivo);
    const tipo = tipos[path.extname(caminhoArquivo).toLowerCase()] || 'application/octet-stream';
    resposta.writeHead(200, { 'Content-Type': tipo });
    resposta.end(conteudo);
  } catch {
    resposta.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    resposta.end('Arquivo não encontrado.');
  }
});

const porta = Number(process.env.PORT) || 5173;
servidor.listen(porta, '127.0.0.1', () => {
  console.log(`Pixel Arena disponível em http://localhost:${porta}`);
});
