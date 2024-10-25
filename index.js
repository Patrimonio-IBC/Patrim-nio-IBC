<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadastro de Produtos</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            min-height: 100vh;
            margin: 0;
        }

        h1, h2 {
            text-align: center;
        }

        table, th, td {
            border: 2px solid #000000;
            border-radius: 10px;
            border-collapse: collapse;
        }
        td, th {
            padding: 20px;
            text-align: center;
        }

        form {
            width: 300px;
            margin: 20px auto;
            padding: 20px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background-color: #f9f9f9;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        form label, form input {
            display: block;
            width: 100%;
            margin-bottom: 10px;
        }

        form input[type="text"], form input[type="date"], form input[type="number"] {
            padding: 10px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 5px;
            width: 100%;
            height: 40px;
            box-sizing: border-box;
        }

        form button {
            width: 100%;
            padding: 10px;
            background-color: #4CAF50;
            color: white;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
        }

        form button:hover {
            background-color: #45a049;
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.6);
        }

        .modal-content {
            background-color: white;
            margin: auto;
            padding: 20px;
            border: 1px solid #888;
            width: 400px;
            max-width: 90%;
            position: relative;
            top: 50%;
            transform: translateY(-50%);
            border-radius: 10px;
        }

        .close {
            color: red;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
        }

        .close:hover,
        .close:focus {
            color: darkred;
        }

        #search-bar {
            width: 300px;
            padding: 10px;
            margin-bottom: 20px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 5px;
            text-align: center;
        }
    </style>
</head>
<body>
    <h1>Cadastrar Produto</h1>

    <form action="/criar-produto" method="POST">
        
        <label for="numero_produto">Número do Produto:</label>
        <input type="text" id="numero_produto" name="numero_produto" placeholder="Digite o número do produto" required>
        
        <label for="titulo_produto">Título do Produto:</label>
        <input type="text" id="titulo_produto" name="titulo_produto" placeholder="Digite o nome" required>

        <label for="marca">Marca:</label>
        <input type="text" id="marca" name="marca">

        <label for="modelo">Modelo:</label>
        <input type="text" id="modelo" name="modelo">

        <label for="valor">Valor:</label>
        <input type="number" id="valor" name="valor">

        <label for="quantidade">Quantidade:</label>
        <input type="number" id="quantidade" name="quantidade">

        <label for="data_compra">Data da Compra:</label>
        <input type="date" id="data_compra" name="data_compra">

        <label for="data_venda">Data da Venda:</label>
        <input type="date" id="data_venda" name="data_venda">

        <label for="descricao">Descrição:</label>
        <input type="text" id="descricao" name="descricao">

        <button type="submit">Cadastrar</button>
    </form>

    <input type="text" id="search-bar" placeholder="Pesquisar produto por numero do produto..." onkeyup="searchUser()">

    <h2>Produtos Cadastrados</h2>
    <table id="userTable">
        <tr>
            <th>Número do Produto</th>
            <th>Título do Produto</th>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Valor</th>
            <th>Quantidade</th>
            <th>Data de Compra</th>
            <th>Data de Venda</th>
            <th>Descrição</th>
            <th>Atualizar</th>
            <th>Deletar</th>
        </tr>
        <% usuarios.forEach(usuario => { %>
            <tr>
                <td><%= usuario.numero_produto %></td>
                <td><%= usuario.titulo_produto %></td>
                <td><%= usuario.marca %></td>
                <td><%= usuario.modelo %></td>
                <td><%= usuario.valor %></td>
                <td><%= usuario.quantidade %></td>
                <td><%= usuario.data_compra %></td>
                <td><%= usuario.data_venda %></td>
                <td><%= usuario.descricao %></td>
                <td><a href="#" onclick="openModal('<%= usuario.numero_produto %>', '<%= usuario.titulo_produto %>', '<%= usuario.marca %>', '<%= usuario.modelo %>', '<%= usuario.valor %>', '<%= usuario.quantidade %>', '<%= usuario.data_compra %>', '<%= usuario.data_venda %>', '<%= usuario.descricao %>')">Editar</a></td>
                <td><a href="/deletar-produto/<%= usuario.numero_produto %>">Deletar</a></td>
            </tr>
        <% }) %>
    </table>

    <div id="modal" class="modal">
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>Editar Produto</h2>
            <form id="editForm" action="/editar-produto" method="POST">
                <input type="hidden" id="editId" name="numero_produto">

                <label for="modal_titulo_produto">Título do Produto:</label>
                <input type="text" id="modal_titulo_produto" name="titulo_produto" placeholder="Digite o nome" required>
        
                <label for="modal_marca">Marca:</label>
                <input type="text" id="modal_marca" name="marca">
        
                <label for="modal_modelo">Modelo:</label>
                <input type="text" id="modal_modelo" name="modelo">
        
                <label for="modal_valor">Valor:</label>
                <input type="number" id="modal_valor" name="valor">
        
                <label for="modal_quantidade">Quantidade:</label>
                <input type="number" id="modal_quantidade" name="quantidade">
        
                <label for="modal_data_compra">Data da Compra:</label>
                <input type="date" id="modal_data_compra" name="data_compra">
        
                <label for="modal_data_venda">Data da Venda:</label>
                <input type="date" id="modal_data_venda" name="data_venda">
        
                <label for="modal_descricao">Descrição:</label>
                <input type="text" id="modal_descricao" name="descricao">

                <button type="submit">Salvar</button>
            </form>
        </div>
    </div>

    <script>
        function openModal(numero_produto, titulo_produto, marca, modelo, valor, quantidade, data_compra, data_venda, descricao) {
            document.getElementById('editId').value = numero_produto; // Usando numero_produto
            document.getElementById('modal_titulo_produto').value = titulo_produto;
            document.getElementById('modal_marca').value = marca;
            document.getElementById('modal_modelo').value = modelo;
            document.getElementById('modal_valor').value = valor;
            document.getElementById('modal_quantidade').value = quantidade;
            document.getElementById('modal_data_compra').value = data_compra;
            document.getElementById('modal_data_venda').value = data_venda;
            document.getElementById('modal_descricao').value = descricao;
            document.getElementById('modal').style.display = 'block';
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }

        window.onclick = function(event) {
            if (event.target == document.getElementById('modal')) {
                closeModal();
            }
        }

        function searchUser() {
            let input = document.getElementById('search-bar').value.toLowerCase();
            let rows = document.querySelectorAll('#userTable tr:not(:first-child)');
            rows.forEach(row => {
                let nome = row.cells[0].textContent.toLowerCase();
                row.style.display = nome.includes(input) ? '' : 'none';
            });
        }
    </script>

</body>
</html>
