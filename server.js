const express = require('express');
const MongoClient = require('mongodb').MongoClient
const app = express();
const path = require('path');
const session = require("express-session")
const port = 3005;
const bcrypt = require("bcrypt")

let runChat;
(async () => {
  const module = await import('./IA/index.js')
  runChat = module.runChat
})()


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
    secret: 'segredo-super-seguro',
    resave: false,
    saveUninitialized: true,
}));

const urlMongo = 'mongodb://localhost:27017';
const nomeBanco = 'EducaIA';


app.use(express.static
    ("assets")
)
app.get('/registrar', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/registrar.html');
});

app.post('/registrar', async (req, res) => {
    const cliente = new MongoClient(urlMongo);
    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const colecaoUsuarios = banco.collection('usuarios');

        const usuarioExistente = await colecaoUsuarios.findOne({ usuario: req.body.usuario });

        if (usuarioExistente) {
            res.send('Usuário já existe! Tente outro nome de usuário.');
        } else {
            const senhaCriptografada = await bcrypt.hash(req.body.senha, 10);
            await colecaoUsuarios.insertOne({
                usuario: req.body.usuario,
                senha: senhaCriptografada
            });
            res.redirect('/login');
        }
    } catch (erro) {
        console.error('Erro ao cadastrar usuário:', erro);
        res.send('Erro ao registrar o usuário.');
    } finally {
        await cliente.close();
    }
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/login.html');
});

app.post('/login', async (req, res) => {
    const cliente = new MongoClient(urlMongo, { useUnifiedTopology: true });
    try {
        await cliente.connect();
        const banco = cliente.db(nomeBanco);
        const colecaoUsuarios = banco.collection('usuarios');

        const usuario = await colecaoUsuarios.findOne({ usuario: req.body.usuario });

        if (usuario && await bcrypt.compare(req.body.senha, usuario.senha)) {
            req.session.usuario = req.body.usuario;
            res.redirect('/quiz');
        } else {
            res.redirect('/erro');
        }
    } catch (erro) {
        res.send('Erro ao realizar login.');
    } finally {
        cliente.close();
    }
});

function protegerRota(req, res, proximo) {
    if (req.session.usuario) {
        proximo();
    } else {
        res.redirect('/login');
    }
}

app.get('/bemvindo*', protegerRota, (req, res) => {
    res.sendFile(__dirname + '/assets/pages/bemvindo.html');
});

app.get('/erro', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/erro.html');
});

app.get('/sair', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send('Erro ao sair!');
        }
    });
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})

// CADASTRO USER

app.get('/cursos', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/cursos.html');
});

app.get('/bolinha', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/time/bolinha.html');
});
app.get('/jm', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/time/jm.html');
});
app.get('/koba', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/time/koba.html');
});
app.get('/pva', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/time/pva.html');
});

app.get('/quiz', (req, res) => {
    res.sendFile(__dirname + '/assets/pages/quiz.html');
});

app.post('/quiz', async (req, res) => {
    const { familiaridade, interesse, motivacao } = req.body;

        if (!familiaridade || !interesse || !motivacao) {
            res.send('Responda a todos os passos do formulario!');
            return;
        }

    const prompt = await runChat(`
        Esta e uma resposta pre setada, quero que me responda apenas oque eu mandar e em formato JSON.
        Voce basicamente vai ter que indicar um dos cursos da nossa plataforma para o usuario, os cursos sao:
        1. Fundamentos de Inteligencia Artificial
        2. Introducao ao Machine Learninge
        3. Processamento de Linguagem Natural
        4. Visao Computacional
        5. Etica e Responsabilidade em IA
        Segue o questionario respondido e como avaliar qual curso melhor se encaixa com o padrao do usuario:
        Pergunta 1: Qual é o seu nível de familiaridade com inteligência artificial?
        Opcao 1: Nenhuma (Curso recomendado: Fundamentos de Inteligência Artificial)
        Opcao 2: Já tenho conhecimento básico e gostaria de avançar (Cursos recomendados: Introdução ao Machine Learning ou Processamento de Linguagem Natural)
        Resposta do usuario: ${familiaridade}

        Pergunta 2: Qual área dentro de inteligência artificial desperta mais seu interesse?
        Opcao 1: Teoria e conceitos básicos (Curso recomendado: Fundamentos de Inteligência Artificial)
        Opcao 2: Criação de modelos de previsão e classificação (Curso recomendado: Introdução ao Machine Learning)
        Opcao 3: Interpretação e geração de linguagem humana (Curso recomendado: Processamento de Linguagem Natural)
        Opcao 4: Interpretação de imagens e reconhecimento visual (Curso recomendado: Visão Computacional)
        Resposta do usuario: ${interesse}

        Pergunta 3: Qual a sua motivação principal para aprender IA?
        Opcao 1: Aprender os fundamentos para entender melhor o tema (Curso recomendado: Fundamentos de Inteligência Artificial)
        Opcao 2: Aplicar IA de maneira ética e responsável em projetos futuros (Curso recomendado: Ética e Responsabilidade em IA)
        Opcao 3: Explorar áreas específicas com potencial prático (Respostas anteriores ajudam a definir entre Introdução ao Machine Learning, Processamento de Linguagem Natural ou Visão Computacional)
        Resposta do usuario: ${motivacao}

        Quero que responda apenas UM curso e apenas o NOME do curso em formato JSON e sem nenhum tipo de acento e pontuação, caso nao ache uma resposta ideal, indique o que mais se encaixa, mesmo que nao se pareca, nao quero respostas de erro.
      `);

      let response = prompt.split('"')[3]
      response = response.replace(/ /g, "-")
      res.redirect(`/bemvindo/${response}`)
})

app.listen(port, () => {
    console.log(`Servidor Node.js em execução em http://localhost:${port}`);
});

