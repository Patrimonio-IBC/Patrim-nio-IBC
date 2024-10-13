import express from "express";
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const supabaseUrl ='https://cyxoqixvhkcoyfynshcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5eG9xaXh2aGtjb3lmeW5zaGN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjg4Mzk3MDQsImV4cCI6MjA0NDQxNTcwNH0.RiUeKf13JdvPdbUbtxOMdCtS7sXFX7w6pxkiOWu3QLk';
const supabase = createClient(supabaseUrl, supabaseKey);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // This will work now

async function criarUsuario(titulo_produto, marca, modelo, valor, quantidade, data_compra, data_venda, descricao) {
    const { data, error } = await supabase
        .from('itens')
        .insert([{ 
            titulo_produto, 
            marca, 
            modelo, 
            valor,          // pode ser null
            quantidade,     // pode ser null
            data_compra, 
            data_venda, 
            descricao 
        }]);

    if (error) {
        console.error('Erro ao inserir o produto:', error);
    } else {
        console.log('Produto inserido:', titulo_produto);
    }
}




async function lerUsuarios() {
    const { data, error } = await supabase
        .from('itens')
        .select('*')
        .order('numero_produto', { ascending: true});


    if (error) {
        console.error('Erro ao ler produto:', error);
        return [];
    }
    return data;
}

app.get('/', async (req, res) => {
    const usuarios = await lerUsuarios();
    res.render('index', { usuarios });
});

app.post('/criar-produto', async (req, res) => {
    const { titulo_produto, marca, modelo, valor, quantidade, data_compra, data_venda, descricao } = req.body;

    // Verifique se valor e quantidade estão vazios e ajuste conforme necessário
    const valorProduto = valor ? parseFloat(valor) : null;  // Converte para float ou null
    const quantidadeProduto = quantidade ? parseInt(quantidade) : null;  // Converte para inteiro ou null

    // Verifique se as datas estão vazias e ajuste conforme necessário
    const dataCompra = data_compra ? data_compra : null;
    const dataVenda = data_venda ? data_venda : null;

    await criarUsuario(titulo_produto, marca, modelo, valorProduto, quantidadeProduto, dataCompra, dataVenda, descricao);
    const usuarios = await lerUsuarios();
    res.render('index', { usuarios });
});



app.post('/editar-produto', async (req, res) => {
    const { numero_produto, titulo_produto, marca, modelo, valor, quantidade, data_compra, data_venda, descricao } = req.body;

    // Verifique se as datas estão vazias e ajuste conforme necessário
    const dataCompra = data_compra ? data_compra : null; // pode ser null
    const dataVenda = data_venda ? data_venda : null;   // pode ser null

    // Verifique se valor e quantidade estão vazios e ajuste conforme necessário
    const valorProduto = valor ? parseFloat(valor) : null;  // Converte para float ou null
    const quantidadeProduto = quantidade ? parseInt(quantidade) : null;  // Converte para inteiro ou null

    await editarUsuario(numero_produto, titulo_produto, marca, modelo, valorProduto, quantidadeProduto, dataCompra, dataVenda, descricao);
    const usuarios = await lerUsuarios();
    res.render('index', { usuarios });
});

app.get('/deletar-produto/:numero_produto', async (req, res) => {
    const { numero_produto } = req.params;
    await deletarUsuario(numero_produto);
    const usuarios = await lerUsuarios();
    res.render('index', { usuarios });
});

async function editarUsuario(numero_produto, titulo_produto, marca, modelo, valor, quantidade, data_compra, data_venda, descricao) {
    const { data, error } = await supabase
        .from('itens')
        .update({ 
            titulo_produto, 
            marca, 
            modelo, 
            valor,          // pode ser null
            quantidade,     // pode ser null
            data_compra, 
            data_venda, 
            descricao 
        })
        .eq('numero_produto', numero_produto);

    if (error) {
        console.error('Erro ao editar produto:', error);
    } else {
        console.log('Produto editado:', titulo_produto);
    }
}


async function deletarUsuario(numero_produto) {
    const { data, error } = await supabase
        .from('itens')
        .delete()
        .eq('numero_produto', numero_produto);

    if (error) {
        console.error('Erro ao deletar produto:', error);
    } else {
        console.log('Produto deletado:', numero_produto);
    }
}

app.listen(3000, async () => {
    console.log("Servidor rodando na porta 3000...");
});