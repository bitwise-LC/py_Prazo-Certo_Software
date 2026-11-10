(function () {
  const DIAS_DA_SEMANA = [
    { nome: "domingo", preposicao: "no" },
    { nome: "segunda-feira", preposicao: "na" },
    { nome: "terça-feira", preposicao: "na" },
    { nome: "quarta-feira", preposicao: "na" },
    { nome: "quinta-feira", preposicao: "na" },
    { nome: "sexta-feira", preposicao: "na" },
    { nome: "sábado", preposicao: "no" }
  ];

  function dataLocal(valor) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(valor || "")) {
      const [ano, mes, dia] = valor.split("-").map(Number);
      return new Date(ano, mes - 1, dia);
    }
    return new Date(valor);
  }

  function diferencaEmDias(data) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    data.setHours(0, 0, 0, 0);
    return Math.round((data - hoje) / 86400000);
  }

  function formatarData(data) {
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric"
    });
  }

  function mensagemDoProduto(produto) {
    const validade = dataLocal(produto.validade);
    const dias = diferencaEmDias(validade);

    if (dias === 0) return `${produto.nome} vence hoje`;
    if (dias === 1) return `${produto.nome} vencerá amanhã`;

    const diaDaSemana = DIAS_DA_SEMANA[validade.getDay()];
    return `${produto.nome} vencerá ${diaDaSemana.preposicao} ${diaDaSemana.nome}`;
  }

  function criarComponente() {
    const central = document.createElement("div");
    central.className = "central-notificacoes";
    central.innerHTML = `
      <button class="botao-notificacoes" type="button" aria-label="Abrir notificações"
              aria-expanded="false" aria-controls="painelNotificacoes">
        <i class="bi bi-bell" aria-hidden="true"></i>
        <span class="contador-notificacoes" hidden>0</span>
      </button>
      <section id="painelNotificacoes" class="menu-notificacoes" hidden
               aria-label="Produtos próximos do vencimento">
        <header>
          <div>
            <h2>Notificações</h2>
            <p>Vencimentos nos próximos 15 dias</p>
          </div>
          <button class="fechar-notificacoes" type="button" aria-label="Fechar notificações">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
          </button>
        </header>
        <div class="lista-notificacoes" role="list" aria-live="polite">
          <p class="estado-notificacoes">Carregando avisos...</p>
        </div>
        <a class="ver-calendario" href="calendario.html">Ver calendário completo</a>
      </section>`;
    document.body.appendChild(central);
    return central;
  }

  function montarAvisos(lista, produtos) {
    lista.replaceChildren();

    if (!produtos.length) {
      const vazio = document.createElement("p");
      vazio.className = "estado-notificacoes sem-avisos";
      vazio.textContent = "Nenhum produto vence nos próximos 15 dias.";
      lista.appendChild(vazio);
      return;
    }

    produtos.forEach(produto => {
      const validade = dataLocal(produto.validade);
      const dias = diferencaEmDias(validade);
      const item = document.createElement("article");
      item.className = `aviso-vencimento ${dias <= 7 ? "urgente" : "atencao"}`;
      item.setAttribute("role", "listitem");

      const icone = document.createElement("i");
      icone.className = "bi bi-exclamation-circle";
      icone.setAttribute("aria-hidden", "true");

      const conteudo = document.createElement("div");
      const titulo = document.createElement("strong");
      titulo.textContent = mensagemDoProduto(produto);
      const detalhe = document.createElement("span");
      detalhe.textContent = `${formatarData(validade)} · ${produto.quantidade_estoque} un. em estoque`;

      conteudo.append(titulo, detalhe);
      item.append(icone, conteudo);
      lista.appendChild(item);
    });
  }

  async function carregarAvisos(central) {
    const lista = central.querySelector(".lista-notificacoes");
    const contador = central.querySelector(".contador-notificacoes");

    try {
      const produtos = await PrazoAPI.request("/alertas?dias=15");
      contador.textContent = produtos.length > 99 ? "99+" : String(produtos.length);
      contador.hidden = produtos.length === 0;
      montarAvisos(lista, produtos);
    } catch (erro) {
      contador.hidden = true;
      lista.replaceChildren();
      const mensagem = document.createElement("p");
      mensagem.className = "estado-notificacoes erro-notificacoes";
      mensagem.textContent = "Não foi possível carregar os avisos.";
      lista.appendChild(mensagem);
      console.error("Falha ao carregar notificações:", erro);
    }
  }

  function iniciarNotificacoes() {
    if (!window.PrazoAPI || !PrazoAPI.sessao().id_loja || document.querySelector(".central-notificacoes")) return;

    const central = criarComponente();
    const botao = central.querySelector(".botao-notificacoes");
    const painel = central.querySelector(".menu-notificacoes");
    const fechar = central.querySelector(".fechar-notificacoes");

    function alternarPainel(aberto) {
      painel.hidden = !aberto;
      botao.setAttribute("aria-expanded", String(aberto));
      central.classList.toggle("aberta", aberto);
    }

    botao.addEventListener("click", () => alternarPainel(painel.hidden));
    fechar.addEventListener("click", () => alternarPainel(false));
    document.addEventListener("click", evento => {
      if (!painel.hidden && !central.contains(evento.target)) alternarPainel(false);
    });
    document.addEventListener("keydown", evento => {
      if (evento.key === "Escape" && !painel.hidden) {
        alternarPainel(false);
        botao.focus();
      }
    });
    window.addEventListener("focus", () => carregarAvisos(central));

    carregarAvisos(central);
    window.setInterval(() => carregarAvisos(central), 300000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciarNotificacoes);
  } else {
    iniciarNotificacoes();
  }
})();
