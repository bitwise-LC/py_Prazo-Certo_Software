let mesExibido = new Date();

function faixaVencimento(dataVencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  dataVencimento.setHours(0, 0, 0, 0);

  const diferencaEmDias = Math.ceil((dataVencimento - hoje) / 86400000);

  // Produtos já vencidos ou que vencem nos próximos 7 dias.
  if (diferencaEmDias <= 7) return "urgente";
  // Produtos que vencem entre 8 e 14 dias.
  if (diferencaEmDias <= 14) return "atencao";
  // Produtos com vencimento posterior a duas semanas.
  return "seguro";
}

async function montarCalendario() {
  PrazoAPI.exigirSessao();
  const ano = mesExibido.getFullYear(), mes = mesExibido.getMonth();
  const produtos = await PrazoAPI.request("/calendario?ano=" + ano + "&mes=" + (mes + 1));
  const porDia = produtos.reduce((mapa, p) => { const d = Number(p.validade.slice(8, 10)); (mapa[d] ||= []).push(p); return mapa; }, {});
  document.getElementById("tituloMes").textContent = mesExibido.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  const primeiro = new Date(ano, mes, 1).getDay();
  const total = new Date(ano, mes + 1, 0).getDate();
  let html = Array.from({ length: primeiro }, () => '<div class="dia outro"></div>').join("");
  for (let dia = 1; dia <= total; dia++) {
    const itens = porDia[dia] || [];
    const dataDoDia = new Date(ano, mes, dia);
    const hoje = new Date().toDateString() === dataDoDia.toDateString();
    const faixa = itens.length ? faixaVencimento(dataDoDia) : "";
    const descricao = itens.map(p => p.nome + ' (' + p.quantidade_estoque + ')').join(', ');
    const marcadores = itens.slice(0, 5).map(p =>
      '<i class="marcador ' + faixa + '" title="' + p.nome + '"></i>'
    ).join('');

    html += '<div class="dia' + (hoje ? ' hoje' : '') + (faixa ? ' com-vencimento ' + faixa : '') +
      '" title="' + descricao + '"><span>' + dia + '</span><div class="marcadores">' +
      marcadores + '</div></div>';
  }
  document.getElementById("dias").innerHTML = html;
}

document.getElementById("anterior")?.addEventListener("click", () => { mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() - 1, 1); montarCalendario(); });
document.getElementById("proximo")?.addEventListener("click", () => { mesExibido = new Date(mesExibido.getFullYear(), mesExibido.getMonth() + 1, 1); montarCalendario(); });
montarCalendario().catch(erro => alert(erro.message));
