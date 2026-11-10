const PrazoAPI = {
  baseUrl: localStorage.getItem("prazo_api") || "http://127.0.0.1:5000/api",

  sessao() {
    try { return JSON.parse(localStorage.getItem("prazo_sessao")) || {}; }
    catch (_) { return {}; }
  },

  salvarSessao(dados) {
    localStorage.setItem("prazo_sessao", JSON.stringify(dados));
  },

  exigirSessao() {
    const sessao = this.sessao();
    if (!sessao.id_usuario || !sessao.id_loja) {
      window.location.href = "index.html";
      throw new Error("Sessão não encontrada.");
    }
    return sessao;
  },

  async request(caminho, opcoes = {}) {
    const sessao = this.sessao();
    const headers = { ...(opcoes.body ? { "Content-Type": "application/json" } : {}), ...(opcoes.headers || {}) };
    if (sessao.id_usuario) headers["X-Usuario-Id"] = sessao.id_usuario;
    if (sessao.id_loja) headers["X-Loja-Id"] = sessao.id_loja;
    let resposta;
    try {
      resposta = await fetch(this.baseUrl + caminho, { ...opcoes, headers });
    } catch (_) {
      throw new Error("Não foi possível acessar a API. Confirme se o Flask está ativo em http://127.0.0.1:5000 e abra o frontend por http://127.0.0.1:5500.");
    }
    const texto = await resposta.text();
    let dados = null;
    if (texto) {
      try { dados = JSON.parse(texto); } catch (_) { dados = { erro: texto }; }
    }
    if (!resposta.ok) throw new Error(dados?.erro || dados?.mensagem || "Não foi possível concluir a operação.");
    return dados;
  },

  dataBR(valor) {
    if (!valor) return "—";

    const texto = String(valor).trim();
    const dataIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
    let data;

    if (dataIso) {
      data = new Date(
        Number(dataIso[1]),
        Number(dataIso[2]) - 1,
        Number(dataIso[3]),
        12
      );
    } else {
      data = new Date(texto);
    }

    return Number.isNaN(data.getTime())
      ? "—"
      : data.toLocaleDateString("pt-BR", { timeZone: "UTC" });
  },

  moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  },

  sair() {
    localStorage.removeItem("prazo_sessao");
    window.location.href = "index.html";
  }
};

window.PrazoAPI = PrazoAPI;

document.addEventListener("DOMContentLoaded", () => {
  const nome = PrazoAPI.sessao().nome || "Usuário";
  document.querySelectorAll(".usuario span").forEach(elemento => { elemento.textContent = nome; });
});
