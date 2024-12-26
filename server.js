// npm install express socket.io http bcryptjs express-session @supabase/supabase-js

require('dotenv').config();

const express = require('express');
const http = require('http');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const server = http.createServer(app);

// Conexão com o bd
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

// Configuração da sessão
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));

app.get('/login', (req, res) => {
    res.render('login', { message: null });
});

app.get('/login-adm', (req, res) => {
    res.render('login-adm', { message: null });
});


app.post('/login-adm', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase
        .from('admns')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !data) {
        return res.render('login-adm', { message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, data.senha);
    if (!isMatch) {
        return res.render('login-adm', { message: 'Credenciais inválidas' });
    }

    req.session.user = data; // Armazena as informações do administrador na sessão
    res.redirect('/produtos');
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();
    
    if (error || !data) {
        return res.render('login', { message: 'Credenciais inválidas' });
    }

    const isMatch = await bcrypt.compare(password, data.senha);
    if (!isMatch) {
        return res.render('login', { message: 'Credenciais inválidas' });
    }

    req.session.user = data; // Armazena as informações do usuário na sessão
    res.redirect('/comprar');
});

app.get('/comprar', async (req, res) => {
    // Verifique se o usuário está logado na sessão
    if (!req.session.user) { // Verifica a sessão de usuário
        return res.redirect('/login'); // Redireciona se não houver sessão
    }

    const usuario = req.session.user; // Acessa o usuário da sessão

    // Buscar os itens disponíveis no banco de dados
    const { data: itens, error: itensError } = await supabase
        .from('itens')
        .select('numero_produto, titulo_produto, marca, modelo, valor, quantidade, descricao');

    if (itensError) {
        return res.status(500).send("Erro ao buscar itens disponíveis.");
    }

    // Buscar as reservas associadas ao usuário (supondo que seja por id)
    const { data: reservas, error: reservasError } = await supabase
        .from('reservas')
        .select('*')
        .eq('usuario_id', usuario.id);

    if (reservasError) {
        return res.status(500).send("Erro ao buscar as reservas.");
    }

    // Mapear as reservas para adicionar o nome do produto de "itens"
    const reservasComNomeProduto = reservas.map(reserva => {
        // Encontre o item correspondente à reserva
        const produto = itens.find(item => item.numero_produto === reserva.numero_produto);
        return {
            ...reserva,
            titulo_produto: produto ? produto.titulo_produto : 'Produto não encontrado'
        };
    });

    // Passando tanto os 'itens', 'usuario' quanto as 'reservas' para o template EJS
    res.render('comprar', { itens, usuario, reservas: reservasComNomeProduto });
});




// Rota para registro
app.get('/register', (req, res) => {
    res.render('register', { message: null });
});

app.post('/register', async (req, res) => {
    const { email, password, confirmPassword, nome, dp } = req.body;

    if (password !== confirmPassword) {
        return res.render('register', { message: 'As senhas não coincidem' });
    }

    const { data: existingUser, error: emailError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        return res.render('register', { message: 'Este e-mail já está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const is_admin = false;
    const departamento = dp
    const senha = password
    // Tente logar o erro do supabase aqui
    const { data, error } = await supabase
        .from('usuarios')
        .insert([{ nome, departamento, email, senha: hashedPassword }]);

    if (error) {
        console.error("Erro ao inserir no Supabase:", error);
        return res.render('register', { message: 'Erro ao criar conta, tente novamente' });
    }

    res.redirect('/login');
});

app.get('/register-adm', (req, res) => {
    res.render('register-adm', { message: null });
});

app.post('/register-adm', async (req, res) => {
    const { email, password, nome, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.render('register-adm', { message: 'As senhas não coincidem' });
    }

    const { data: existingUser, error: emailError } = await supabase
        .from('admns')
        .select('*')
        .eq('email', email)
        .single();

    if (existingUser) {
        return res.render('register-adm', { message: 'Este e-mail já está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const senha = password
    // Tente logar o erro do supabase aqui
    const { data, error } = await supabase
        .from('admns')
        .insert([{ nome, email, senha: hashedPassword }]);

    if (error) {
        console.error("Erro ao inserir no Supabase:", error);
        return res.render('register-adm', { message: 'Erro ao criar conta, tente novamente' });
    }

    res.redirect('/login-adm');
});

// Rota para exibir e gerenciar os produtos
app.get('/produtos', async (req, res) => {
    // Verifica se o usuário está logado e é administrador
    if (!req.session.user || req.session.user.is_admin === false) {
        return res.redirect('/login-adm');
    }

    // Busca as reservas com status 'pendente', incluindo o nome do usuário e o número do produto
    const { data: reservasPendentes, error: reservasPendentesError } = await supabase
        .from('reservas')
        .select('*, usuario_id ( nome ), numero_produto') // Inclui o nome do usuário e o número do produto
        .eq('status', 'pendente');

    if (reservasPendentesError) {
        console.error("Erro ao buscar reservas pendentes:", reservasPendentesError.message);
        return res.status(500).send(`Erro ao buscar reservas pendentes: ${reservasPendentesError.message}`);
    }

    // Busca as reservas com status 'aprovado' ou 'rejeitado', incluindo o nome do usuário e o número do produto
    const { data: reservasAprovadasRejeitadas, error: reservasAprovadasRejeitadasError } = await supabase
        .from('reservas')
        .select('*, usuario_id ( nome ), numero_produto') // Inclui o nome do usuário e o número do produto
        .in('status', ['aprovado', 'rejeitado']);

    if (reservasAprovadasRejeitadasError) {
        console.error("Erro ao buscar reservas aprovadas ou rejeitadas:", reservasAprovadasRejeitadasError.message);
        return res.status(500).send(`Erro ao buscar reservas aprovadas ou rejeitadas: ${reservasAprovadasRejeitadasError.message}`);
    }

    // Busca os itens no banco para obter os detalhes dos produtos
    const { data: itens, error: produtosError } = await supabase
        .from('itens')
        .select('numero_produto, titulo_produto, marca, modelo, valor, quantidade, descricao');

    if (produtosError) {
        console.error("Erro ao buscar produtos:", produtosError.message);
        return res.status(500).send(`Erro ao buscar produtos: ${produtosError.message}`);
    }

    // Associar o nome do produto às reservas pendentes e aprovadas/rejeitadas
    const reservasComNomeProduto = reservasPendentes.map(reserva => {
        // Encontre o produto correspondente
        const produto = itens.find(item => item.numero_produto === reserva.numero_produto);
        return {
            ...reserva,
            titulo_produto: produto ? produto.titulo_produto : 'Produto não encontrado'
        };
    });

    // Replicar o mesmo para as reservas aprovadas ou rejeitadas
    const reservasAprovadasRejeitadasComNomeProduto = reservasAprovadasRejeitadas.map(reserva => {
        const produto = itens.find(item => item.numero_produto === reserva.numero_produto);
        return {
            ...reserva,
            titulo_produto: produto ? produto.titulo_produto : 'Produto não encontrado'
        };
    });

    // Renderiza a página com os itens, reservas pendentes, aprovadas e rejeitadas
    res.render('produtos', {
        itens,
        reservasPendentes: reservasComNomeProduto,  // Passando as reservas com o nome do produto
        reservasAprovadasRejeitadas: reservasAprovadasRejeitadasComNomeProduto  // Passando as reservas aprovadas e rejeitadas
    });
});

app.post('/produtos/alterar-reserva/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Pode ser 'aprovado' ou 'rejeitado'

    if (!status || (status !== 'aprovado' && status !== 'rejeitado')) {
        return res.status(400).send("Status inválido.");
    }

    // Atualiza o status da reserva
    const { data, error } = await supabase
        .from('reservas')
        .update({ status })
        .eq('id', id);

    if (error) {
        console.error("Erro ao atualizar status da reserva:", error);
        return res.status(500).send("Erro ao atualizar a reserva.");
    }

    res.redirect('/produtos');
});


// Rota para adicionar um novo produto
app.post('/produtos/adicionar', async (req, res) => {
    const { titulo_produto, marca, modelo, valor, quantidade, descricao } = req.body;

    // Verifica se todos os campos obrigatórios foram preenchidos
    if (!titulo_produto || !valor || !quantidade) {
        return res.status(400).send("Por favor, preencha todos os campos obrigatórios.");
    }

    // Insere o novo produto no banco
    const { data, error } = await supabase
        .from('itens')
        .insert([{ titulo_produto, marca, modelo, valor, quantidade, descricao }]);

    if (error) {
        console.error("Erro ao adicionar produto:", error);
        return res.status(500).send("Erro ao adicionar produto.");
    }

    res.redirect('/produtos');
});

// Rota para editar um produto existente
app.post('/produtos/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { titulo_produto, marca, modelo, valor, quantidade, descricao } = req.body;

    // Verifica se o ID do produto é válido
    if (!id) {
        return res.status(400).send("Produto não encontrado.");
    }

    // Atualiza o produto no banco
    const { data, error } = await supabase
        .from('itens')
        .update({ titulo_produto, marca, modelo, valor, quantidade, descricao })
        .eq('numero_produto', id);

    if (error) {
        console.error("Erro ao editar produto:", error);
        return res.status(500).send("Erro ao editar produto.");
    }

    res.redirect('/produtos');
});

// Rota para excluir um produto
app.post('/produtos/deletar/:id', async (req, res) => {
    const { id } = req.params;

    // Verifica se o ID do produto é válido
    if (!id) {
        return res.status(400).send("Produto não encontrado.");
    }

    // Deleta o produto no banco
    const { error } = await supabase
        .from('itens')
        .delete()
        .eq('numero_produto', id);

    if (error) {
        console.error("Erro ao excluir produto:", error);
        return res.status(500).send("Erro ao excluir produto.");
    }

    res.redirect('/produtos');
});


app.post('/reservar', async (req, res) => {
    const { produto, quantidade, data_retirada, data_devolucao, usuario_id } = req.body;

    // Verificar se todos os campos obrigatórios foram fornecidos
    if (!produto || !quantidade || !data_retirada || !data_devolucao || quantidade <= 0) {
        return res.status(400).send("Produto, quantidade, data de retirada e data de devolução são obrigatórios.");
    }

    // Registrar a reserva na tabela de reservas
    const { data: reservaData, error: reservaError } = await supabase
        .from('reservas')
        .insert([
            {
                numero_produto: produto,
                usuario_id: usuario_id,
                quantidade: quantidade,
                data_retirada: data_retirada,
                data_devolucao: data_devolucao,
            }
        ]);

    if (reservaError) {
        console.error("Erro ao registrar a reserva:", reservaError.message);
        return res.status(500).send("Erro ao registrar a reserva.");
    }

    // Sucesso: Reserva confirmada
    res.send(`Reserva confirmada com sucesso! Produto: ${produto}, Quantidade: ${quantidade}`);
});



app.post('/confirmar-compra', async (req, res) => {
    const itensComprados = req.body.itens;

    if (!itensComprados) {
        return res.redirect('/comprar');
    }

    for (const numero_produto in itensComprados) {
        const quantidadeDesejada = parseInt(itensComprados[numero_produto]);

        // Consultando o item no banco para verificar a quantidade disponível
        const { data: item, error } = await supabase
            .from('itens')
            .select('quantidade')
            .eq('numero_produto', numero_produto)
            .single();

        if (error) {
            console.log("Erro ao consultar item:", error);
            return res.status(500).send("Erro ao processar a compra.");
        }

        if (quantidadeDesejada > item.quantidade) {
            return res.redirect('/comprar'); // Ou exiba um erro caso a quantidade seja maior do que a disponível
        }

        // Atualize a quantidade no banco
        const { error: updateError } = await supabase
            .from('itens')
            .update({ quantidade: item.quantidade - quantidadeDesejada })
            .eq('numero_produto', numero_produto);

        if (updateError) {
            console.log("Erro ao atualizar a quantidade:", updateError);
            return res.status(500).send("Erro ao processar a compra.");
        }
    }

    res.send("Compra confirmada com sucesso!");
});
app.get('/reservar-produto', async (req, res) => {
    const usuarioId = req.session.usuarioId; // Supondo que o ID do usuário logado esteja na sessão

    // Buscar o usuário logado
    const { data: usuario, error: usuarioError } = await supabase
        .from('usuarios')
        .select('nome')
        .eq('id', usuarioId)
        .single();

    if (usuarioError) {
        return res.status(500).send("Erro ao buscar usuário.");
    }

    // Buscar as reservas do usuário
    const { data: usuarioReservas, error: reservasError } = await supabase
        .from('reservas')
        .select('titulo_produto, quantidade, data_retirada, data_devolucao, status')
        .eq('usuario_id', usuarioId);

    if (reservasError) {
        return res.status(500).send("Erro ao buscar as reservas.");
    }

    // Buscar os produtos disponíveis
    const { data: produtos, error: produtosError } = await supabase
        .from('produtos')
        .select('numero_produto, titulo_produto, marca, modelo, valor, quantidade');

    if (produtosError) {
        return res.status(500).send("Erro ao buscar produtos.");
    }

    // Renderizar a página com os dados do usuário, reservas e produtos
    res.render('comprar', {
        usuario,
        usuarioReservas,
        itens: produtos,
    });
});

// Rota para reservar um produto
app.post('/reservar', async (req, res) => {
    const { produto, quantidade, data_retirada, data_devolucao } = req.body;

    // Verifica se todos os dados necessários estão presentes
    if (!produto || !quantidade || !data_retirada || !data_devolucao) {
        return res.status(400).send("Por favor, preencha todos os campos obrigatórios.");
    }

    // Verifica se o usuário está logado
    if (!req.session.user) {
        return res.status(401).send("Você precisa estar logado para fazer uma reserva.");
    }

    // Consultar o item no banco de dados
    const { data: item, error } = await supabase
        .from('itens')
        .select('quantidade')
        .eq('numero_produto', produto)
        .single();

    if (error || !item) {
        return res.status(500).send("Erro ao processar a reserva.");
    }

    // Verifica se há estoque suficiente para a reserva
    if (quantidade > item.quantidade) {
        return res.status(400).send("Quantidade solicitada excede o disponível.");
    }

    // Inserir a reserva no banco de dados
    const { data, error: insertError } = await supabase
        .from('reservas')
        .insert([{
            numero_produto: produto,
            usuario_id: req.session.user.id,  // Associa a reserva ao usuário logado
            quantidade,
            data_retirada,
            data_devolucao,
            status: 'pendente'  // Inicializa a reserva com status "pendente"
        }]);

    if (insertError) {
        console.error("Erro ao registrar a reserva:", insertError);
        return res.status(500).send("Erro ao registrar a reserva.");
    }

    // Atualizar a quantidade no estoque
    const updatedQuantidade = item.quantidade - quantidade;

    const { error: updateError } = await supabase
        .from('itens')
        .update({ quantidade: updatedQuantidade })
        .eq('numero_produto', produto);

    if (updateError) {
        console.error("Erro ao atualizar o estoque:", updateError);
        return res.status(500).send("Erro ao atualizar o estoque.");
    }

    res.send("Reserva confirmada com sucesso!");
});


// Rota para logout
app.get('/logout', (req, res) => {
    // Destroi a sessão do usuário
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Erro ao fazer logout.");
        }

        // Redireciona para a página de login após o logout
        res.redirect('/login');
    });
});

// Rota de logout para administradores
app.get('/logout-adm', (req, res) => {
    // Destroi a sessão do administrador
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send("Erro ao fazer logout.");
        }

        // Redireciona para a página de login do administrador
        res.redirect('/login-adm');
    });
});


app.listen(3000, ()=> {
    console.log("Servidor Rodando.")
})