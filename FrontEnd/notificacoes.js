const sessaoPromocoes = PrazoAPI.exigirSessao();
const chavePacotesRecusados = `prazo_pacotes_recusados_${sessaoPromocoes.id_loja}`;

let pacotesPromocionais = [];

function obterPacotesRecusados() {
  try {
    const recusados = JSON.parse(localStorage.getItem(chavePacotesRecusados));
    return Array.isArray(recusados) ? recusados : [];
  } catch (_) {
    return [];
  }
}

function salvarPacotesRecusados(recusados) {
  localStorage.setItem(chavePacotesRecusados, JSON.stringify(recusados));
}

function assinaturaPacote(pacote) {
  const ids = Array.isArray(pacote.produtos)
    ? pacote.produtos.map(produto => produto.id_produto).filter(Boolean)
    : [];

  if (ids.length) {
    return ids.map(String).sort().join("-");
  }

  return [pacote.nome, pacote.validade_mais_proxima, pacote.desconto_sugerido]
    .map(valor => String(valor ?? ""))
    .join("|");
}

function mostrarStatus(mensagem) {
  const status = document.getElementById("statusPacotes");
  status.textContent = mensagem;
  status.hidden = !mensagem;
}

function criarPacote(pacote) {
  const artigo = document.createElement("article");
  artigo.className = "pacote";

  const conteudo = document.createElement("div");
  conteudo.className = "pacote-conteudo";

  const titulo = document.createElement("h2");
  titulo.textContent = pacote.nome;

  const vencimento = document.createElement("p");
  vencimento.textContent = `Vencimento mais próximo: ${PrazoAPI.dataBR(pacote.validade_mais_proxima)}`;

  const desconto = document.createElement("strong");
  desconto.textContent = `${pacote.desconto_sugerido}% de desconto sugerido`;

  const botaoRecusar = document.createElement("button");
  botaoRecusar.type = "button";
  botaoRecusar.className = "btn-recusar-pacote";
  botaoRecusar.innerHTML = '<i class="bi bi-x-circle"></i> Recusar pacote';
  botaoRecusar.addEventListener("click", () => recusarPacote(pacote));

  conteudo.append(titulo, vencimento, desconto);
  artigo.append(conteudo, botaoRecusar);
  return artigo;
}

function renderizarPromocoes() {
  const lista = document.getElementById("listaPacotes");
  const recusados = obterPacotesRecusados();
  const pacotesVisiveis = pacotesPromocionais.filter(
    pacote => !recusados.includes(assinaturaPacote(pacote))
  );
  const botaoRestaurar = document.getElementById("restaurarPacotes");

  lista.replaceChildren();
  botaoRestaurar.hidden = recusados.length === 0;

  if (!pacotesVisiveis.length) {
    const vazio = document.createElement("p");
    vazio.className = "pacotes-vazios";
    vazio.textContent = pacotesPromocionais.length
      ? "Todos os pacotes sugeridos foram recusados."
      : "Não há produtos próximos do vencimento para montar pacotes.";
    lista.append(vazio);
    return;
  }

  pacotesVisiveis.forEach(pacote => lista.append(criarPacote(pacote)));
}

function recusarPacote(pacote) {
  const recusados = obterPacotesRecusados();
  const assinatura = assinaturaPacote(pacote);

  if (!recusados.includes(assinatura)) {
    recusados.push(assinatura);
    salvarPacotesRecusados(recusados);
  }

  mostrarStatus(`O pacote "${pacote.nome}" foi recusado.`);
  renderizarPromocoes();
}

function restaurarPacotes() {
  localStorage.removeItem(chavePacotesRecusados);
  mostrarStatus("Os pacotes recusados foram restaurados.");
  renderizarPromocoes();
}

async function carregarPromocoes() {
  const lista = document.getElementById("listaPacotes");

  try {
    pacotesPromocionais = await PrazoAPI.request("/promocoes/sugestoes");
    renderizarPromocoes();
  } catch (erro) {
    lista.replaceChildren();
    const mensagem = document.createElement("p");
    mensagem.className = "pacotes-vazios pacotes-erro";
    mensagem.textContent = erro.message;
    lista.append(mensagem);
  }
}

document.getElementById("restaurarPacotes").addEventListener("click", restaurarPacotes);
carregarPromocoes();
