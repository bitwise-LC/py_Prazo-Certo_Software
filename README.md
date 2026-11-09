# Prazo Certo

Sistema web para controle de estoque por lote e validade. A aplicação registra entradas e saídas, destaca produtos próximos do vencimento e consolida perdas e vendas no dashboard.

## Funcionalidades implementadas

1. Cadastrar empresa, loja, funcionário e usuário em uma única transação.
2. Autenticar usuário com senha protegida por hash.
3. Consultar o perfil completo do usuário.
4. Atualizar dados da empresa e da loja.
5. Atualizar dados do funcionário.
6. Alterar senha após validar a senha atual.
7. Cadastrar categoria.
8. Listar categorias.
9. Atualizar categoria.
10. Excluir categoria sem produtos vinculados.
11. Registrar entrada de produto, lote e quantidade.
12. Listar produtos da loja.
13. Pesquisar produto por nome, código ou descrição.
14. Filtrar produtos por categoria.
15. Ordenar estoque por validade próxima ou distante.
16. Atualizar produto, lote e quantidade.
17. Excluir produto sem histórico de saída.
18. Consultar vencimentos por mês no calendário.
19. Listar alertas de vencimento por período.
20. Consultar indicadores consolidados no dashboard.
21. Registrar saída como venda.
22. Registrar saída como perda e baixar o estoque.
23. Listar o histórico de saídas.
24. Gerar sugestões de pacotes com produtos próximos do vencimento.

A integração com IA e o envio de e-mails ficaram fora desta fase.

## Banco de dados MySQL

Pré-requisitos: MySQL 8+, Python 3.11+ e navegador moderno.

```bash
mysql -u root -p < backend/database/create_database.sql
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

## Versão Wamp Server 

```powershell 
Get-Content backend/database/create_database.sql | &(Get-Item C:\wamp64\bin\mysql\mysql*\bin\mysql.exe).FullName -u root -p
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Edite `backend/.env` com a senha do MySQL. Depois execute, em terminais separados:

> Não deixe `sua_senha` no arquivo `.env`: esse texto é apenas um marcador. Antes de iniciar a API, confirme que o serviço MySQL/MariaDB está ativo e importe o script SQL.

##

```bash
cd backend
python app.py
```

```bash
cd FrontEnd
python3 -m http.server 5500
```

Acesse `http://127.0.0.1:5500`. O backend responde em `http://127.0.0.1:5000/api`.

Para conferir somente a conexão com o banco, acesse `http://127.0.0.1:5000/api/health/database`. Se retornar 503, revise `DATABASE_URL`; se indicar estrutura ausente, importe novamente `backend/database/create_database.sql`.

## Testes

```bash
source .venv/bin/activate
pytest -q backend/tests
```

Os testes usam SQLite em memória e não alteram o banco MySQL. Também é possível verificar a sintaxe sem dependências:

```bash
python3 -m compileall -q backend
for arquivo in FrontEnd/*.js; do node --check "$arquivo"; done
```

##Video 

https://github.com/user-attachments/assets/807bedb9-ce83-43a2-9b0b-4b460fc319dd

