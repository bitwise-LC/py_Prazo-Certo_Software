from datetime import date, timedelta


def cadastrar_produto(client, organizacao, codigo="LEI-001", dias_validade=5, quantidade=10, categoria=None):
    hoje = date.today()
    payload = {
        "codigo_produto": codigo, "nome": "Leite integral", "descricao": "Caixa 1 litro",
        "data_fabricacao": (hoje - timedelta(days=2)).isoformat(),
        "validade": (hoje + timedelta(days=dias_validade)).isoformat(),
        "valor_unitario": 6.5, "quantidade": quantidade,
        "categorias": [categoria] if categoria else [],
    }
    return client.post("/api/produtos", json=payload, headers=organizacao["headers"])


def test_health(client):
    resposta = client.get("/api/health")
    assert resposta.status_code == 200
    assert resposta.get_json()["status"] == "ok"


def test_cadastro_login_e_perfil(client, organizacao):
    login = client.post("/api/auth/login", json={"email": "ana@example.com", "senha": "segredo123"})
    assert login.status_code == 200
    assert login.get_json()["id_loja"] == organizacao["loja"]["id_loja"]
    perfil = client.get("/api/perfil", headers=organizacao["headers"])
    assert perfil.status_code == 200
    assert perfil.get_json()["empresa"]["nome"] == "Mercado Escola"


def test_cadastro_sem_cnpj_gera_identificador_compativel(client):
    resposta = client.post("/api/organizacoes", json={
        "empresa": "Mercado sem CNPJ", "nome": "Bruno Lima", "cpf": "987.654.321-00",
        "telefone": "(11) 98888-0000", "email": "bruno@example.com", "senha": "segredo123",
    })
    assert resposta.status_code == 201
    assert resposta.get_json()["empresa"]["cnpj"] == "PEND-98765432100"
    assert len(resposta.get_json()["empresa"]["cnpj"]) <= 18


def test_login_invalido(client, organizacao):
    resposta = client.post("/api/auth/login", json={"email": "ana@example.com", "senha": "incorreta"})
    assert resposta.status_code == 400


def test_atualiza_perfil_empresa_e_senha(client, organizacao):
    headers = organizacao["headers"]
    assert client.put("/api/perfil/empresa", headers=headers, json={"nome": "Mercado Novo", "telefone": "11900001111"}).status_code == 200
    assert client.put("/api/perfil/funcionario", headers=headers, json={"nome_completo": "Ana Souza", "cargo": "Gerente"}).status_code == 200
    senha = client.put("/api/perfil/senha", headers=headers, json={"senha_atual": "segredo123", "senha_nova": "nova1234"})
    assert senha.status_code == 200
    assert client.post("/api/auth/login", json={"email": "ana@example.com", "senha": "nova1234"}).status_code == 200


def test_crud_categoria(client, organizacao):
    categoria = client.post("/api/categorias", json={"nome": "Laticínios", "descricao": "Geladeira"}).get_json()
    assert client.get("/api/categorias").get_json()[0]["nome"] == "Laticínios"
    alterada = client.put(f"/api/categorias/{categoria['id_categoria']}", json={"nome": "Frios"})
    assert alterada.get_json()["nome"] == "Frios"
    assert client.delete(f"/api/categorias/{categoria['id_categoria']}").status_code == 204


def test_entrada_busca_filtro_atualizacao_e_exclusao(client, organizacao):
    categoria = client.post("/api/categorias", json={"nome": "Bebidas"}).get_json()
    entrada = cadastrar_produto(client, organizacao, categoria=categoria["id_categoria"])
    assert entrada.status_code == 201
    produto = entrada.get_json()
    headers = organizacao["headers"]
    assert len(client.get("/api/produtos?q=leite", headers=headers).get_json()) == 1
    assert len(client.get(f"/api/produtos?categoria={categoria['id_categoria']}&ordem=distante", headers=headers).get_json()) == 1
    atualizado = client.put(f"/api/produtos/{produto['id_produto']}", headers=headers, json={"nome": "Leite semidesnatado", "quantidade": 8})
    assert atualizado.get_json()["quantidade_estoque"] == 8
    assert client.delete(f"/api/produtos/{produto['id_produto']}", headers=headers).status_code == 204


def test_calendario_alertas_dashboard_e_promocoes(client, organizacao):
    cadastrar_produto(client, organizacao, dias_validade=3)
    headers = organizacao["headers"]
    hoje = date.today()
    calendario = client.get(f"/api/calendario?ano={hoje.year}&mes={hoje.month}", headers=headers)
    assert calendario.status_code == 200
    assert len(client.get("/api/alertas?dias=7", headers=headers).get_json()) == 1
    assert client.get("/api/dashboard", headers=headers).get_json()["total_produtos"] == 10
    assert len(client.get("/api/promocoes/sugestoes", headers=headers).get_json()) == 1


def test_notificacoes_consideram_produtos_ate_quinze_dias(client, organizacao):
    cadastrar_produto(client, organizacao, codigo="NOT-015", dias_validade=12)
    headers = organizacao["headers"]

    assert client.get("/api/alertas?dias=7", headers=headers).get_json() == []
    alertas = client.get("/api/alertas?dias=15", headers=headers).get_json()
    assert len(alertas) == 1
    assert alertas[0]["codigo_produto"] == "NOT-015"


def test_registrar_e_listar_saida_atualiza_estoque(client, organizacao):
    produto = cadastrar_produto(client, organizacao).get_json()
    headers = organizacao["headers"]
    saida = client.post("/api/saidas", headers=headers, json={"id_produto": produto["id_produto"], "quantidade": 3, "tipo_saida": "vendido"})
    assert saida.status_code == 201
    assert saida.get_json()["qnt_itens"] == 3
    assert len(client.get("/api/saidas", headers=headers).get_json()) == 1
    assert client.get("/api/produtos", headers=headers).get_json()[0]["quantidade_estoque"] == 7
    resumo = client.get("/api/dashboard", headers=headers).get_json()
    assert resumo["produtos_salvos"] == 3
    assert resumo["valor_salvo"] == 19.5


def test_regras_de_integridade_e_validacao(client, organizacao):
    produto = cadastrar_produto(client, organizacao).get_json()
    headers = organizacao["headers"]
    excesso = client.post("/api/saidas", headers=headers, json={"id_produto": produto["id_produto"], "quantidade": 99, "tipo_saida": "vendido"})
    assert excesso.status_code == 400
    assert client.post("/api/saidas", headers=headers, json={"id_produto": produto["id_produto"], "quantidade": 1, "tipo_saida": "outro"}).status_code == 400
    duplicado = cadastrar_produto(client, organizacao)
    assert duplicado.status_code == 400
