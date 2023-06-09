/* eslint-disable eqeqeq */
/* eslint-disable no-lonely-if */
/* eslint-disable linebreak-style */
/* eslint-disable radix */
/* eslint-disable no-console */
/* eslint-disable max-len */
import { json } from 'express';
import jsonServer from 'json-server';
import jwt from 'jsonwebtoken';

const { create, defaults } = jsonServer;
const router = jsonServer.router('./json-db.json');

const server = create();
const middlewares = defaults();

server.use(middlewares);
server.use(json());

server.post('/usuarios', (req, res) => {
  const { cpf, senha, tipo } = req.body;
  const usuarios = router.db.get('usuarios').value();
  const apartamentos = router.db.get('apartamentos').value();
  function obterNomeInquilino(numerocpf) {
    const inquilinos = usuarios.find(
      (inquilino) => inquilino.cpf === numerocpf,
    );
    if (inquilinos) {
      return inquilinos.nome;
    }
    return null;
  }
  if (tipo === 'inquilino') {
    const apartamentosAutenticada = apartamentos.find(
      (encomenda) => encomenda.cpf === cpf && encomenda.identificacao === senha,
    );
    if (apartamentosAutenticada) {
      const nomeInquilino = obterNomeInquilino(apartamentosAutenticada.cpf);
      const token = jwt.sign(
        {
          cpf: apartamentosAutenticada.cpf,
          identificacao: apartamentosAutenticada.identificacao,
          tipoUsuario: tipo,
          usuario: nomeInquilino,
          exp: Math.floor(Date.now() / 1000) + 10 * 60,
        },
        'encomendaDirecionadaAvaliacaoOficial2',
      );
      res.json({
        token,
        mensagem: 'Autenticação bem-sucedida',
        mensagemTeste: 'Autenticação bem-sucedida',
      });
    } else {
      res.json({ mensagem: 'Autenticação não efetuada' });
      console.log(req);
    }
  } else {
    const usuarioAutenticado = usuarios.find(
      (usuario) => usuario.cpf === cpf && usuario.senha === senha,
    );
    if (usuarioAutenticado) {
      const token = jwt.sign(
        {
          id: usuarioAutenticado.id,
          cpf: usuarioAutenticado.cpf,
          tipoUsuario: usuarioAutenticado.tipo,
          usuario: usuarioAutenticado.nome,
          exp: Math.floor(Date.now() / 1000) + 10 * 60,
        },
        'encomendaDirecionadaAvaliacaoOficial2',
      );
      res.json({
        token,
        mensagem: 'Autenticação bem-sucedida',
      });
    } else {
      res.json({ mensagem: 'Autenticação não efetuada' });
      console.log(req);
    }
  }
});

server.get('/usuarios/:id', (req, res) => {
  const { id } = req.params;
  const usuarios = router.db.get('usuarios').value();
  const usuarioAutenticado = usuarios.find(
    (usuario) => usuario.id === parseInt(id),
  );

  if (usuarioAutenticado) {
    const {
      cpf, nome, tipo, senha,
    } = usuarioAutenticado;
    const usuario = {
      cpf,
      nome,
      tipo,
      id,
      senha,
    };

    res.json({
      usuario,
      mensagem: 'Usuário encontrado',
    });
    console.log('ENCONTRADO');
  } else {
    res.json({ mensagem: 'Nenhum usuário encontrado' });
    console.log('Nenhum usuário encontrado');
  }
});

server.get('/usuarios/cpf/:cpf', (req, res) => {
  const { cpf } = req.params;
  console.log(cpf);
  const usuarios = router.db.get('usuarios').value();
  const usuarioAutenticado = usuarios.find((usuario) => usuario.cpf == cpf);

  if (usuarioAutenticado) {
    const {
      nome, tipo, senha, id,
    } = usuarioAutenticado;
    const usuario = {
      cpf,
      nome,
      tipo,
      id,
      senha,
    };

    res.json({
      usuario,
      mensagem: 'Usuário encontrado',
    });
    console.log('ENCONTRADO');
  } else {
    res.json({ mensagem: 'Nenhum usuário encontrado' });
    console.log('Nenhum usuário encontrado');
  }
});

server.post('/usuarios/list', (req, res) => {
  const usuarios = router.db.get('usuarios').value();

  // Mapear os usuários para retornar apenas as propriedades desejadas
  const usuariosFiltrados = usuarios.map((usuario) => ({
    id: usuario.id,
    nome: usuario.nome,
    cpf: usuario.cpf,
    tipo: usuario.tipo,
  }));

  // Enviar os usuários filtrados como resposta
  res.json({
    usuarios: usuariosFiltrados,
  });
});

server.post('/usuarios/create', (req, res) => {
  const {
    nome, cpf, senha, tipo,
  } = req.body;
  console.log(nome, cpf, senha, tipo);
  const usuarios = router.db.get('usuarios').value();
  const usuarioExistente = usuarios.find((usuario) => usuario.cpf === cpf);
  if (usuarioExistente) {
    res.status(400).json({ mensagem: 'CPF já existe na base de dados' });
  } else {
    let novoUsuario;
    const ids = usuarios.map((usuario) => usuario.id); // Obter todos os IDs existentes
    const novoId = Math.max(...ids) + 1; // Gerar um novo ID incrementando 1 ao máximo encontrado
    if (tipo === 'inquilino') {
      // Código para criar o novo usuário
      novoUsuario = {
        id: novoId,
        cpf,
        nome,
        tipo,
      };
    } else {
      novoUsuario = {
        id: novoId,
        cpf,
        nome,
        senha,
        tipo,
      };
    }

    // Adicionar o novo usuário à base de dados
    router.db.get('usuarios').push(novoUsuario).write();

    // Responder com sucesso
    res.json({ mensagem: 'Usuário criado com sucesso' });
  }
});

server.put('/usuarios/update/:id', (req, res) => {
  const { id } = req.params;
  const {
    cpf, nome, tipo, senha,
  } = req.body;

  // Atualizar o usuário com o ID fornecido
  const usuario = router.db
    .get('usuarios')
    .find({ id: parseInt(id) })
    .value();

  if (usuario) {
    if (tipo === 'inquilino') {
      router.db
        .get('usuarios')
        .find({ id: parseInt(id) })
        .assign({
          cpf,
          nome,
          tipo,
        })
        .write();
    } else {
      if (senha) {
        router.db
          .get('usuarios')
          .find({ id: parseInt(id) })
          .assign({
            cpf,
            nome,
            tipo,
            senha,
          })
          .write();
      } else {
        router.db
          .get('usuarios')
          .find({ id: parseInt(id) })
          .assign({
            cpf,
            nome,
            tipo,
            senha: usuario.senha,
          })
          .write();
      }
    }

    res.json({ mensagem: 'Usuário atualizado com sucesso' });
  } else {
    res.status(404).json({ mensagem: 'Usuário não encontrado' });
  }
});

server.delete('/usuarios/delete/:id', (req, res) => {
  const { id } = req.params;

  // Excluir o usuário com o ID fornecido
  router.db
    .get('usuarios')
    .remove({ id: parseInt(id) })
    .write();

  res.json({ mensagem: 'Usuário excluído com sucesso' });
});

server.post('/encomendas', (req, res) => {
  const {
    recebedor,
    coletor,
    destinatario,
    dataRecebimento,
    dataRetirada,
    identificacao,
    id,
  } = req.body;
  const encomendas = router.db.get('encomendas').value();
  const encomendasAutenticado = encomendas.find(
    (encomenda) => encomenda.id === id
      && encomenda.recebedor === recebedor
      && encomenda.coletor === coletor
      && encomenda.destinatario === destinatario
      && encomenda.dataRecebimento === dataRecebimento
      && encomenda.dataRetirada === dataRetirada
      && encomenda.identificacao === identificacao,
  );

  if (encomendasAutenticado) {
    // Criar o token de acesso com expiração de 1 hora
    const token = jwt.sign(
      {
        recebedor: encomendasAutenticado.recebedor,
        coletor: encomendasAutenticado.coletor,
        destinatario: encomendasAutenticado.destinatario,
        dataRecebimento: encomendasAutenticado.dataRecebimento,
        dataRetirada: encomendasAutenticado.dataRetirada,
        identificacao: encomendasAutenticado.identificacao,
        exp: Math.floor(Date.now() / 1000) + 10 * 60,
      },
      'encomendaDirecionadaAvaliacaoOficial2',
    );

    // Enviar o usuário autenticado juntamente com o token
    res.json({
      token,
      mensagem: 'Autenticação bem-sucedida',
    });
  } else {
    res.json({ mensagem: 'Autenticação não efetuada' });
    console.log(req);
  }
});

server.post('/encomendas/list', (req, res) => {
  const usuarios = router.db.get('encomendas').value();

  // Enviar o usuário autenticado juntamente com o token
  res.json({
    usuarios,
  });
});

server.post('/encomendas/create', (req, res) => {
  const {
    recebedor,
    coletor,
    destinatario,
    dataRecebimento,
    dataRetirada,
    identificacao,
  } = req.body;
  const encomendas = router.db.get('encomendas').value();

  // Código para criar o novo usuário
  const novoUsuario = {
    id: encomendas.length + 1, // Gera um novo ID baseado no tamanho atual da lista de usuários
    recebedor,
    coletor,
    destinatario,
    dataRecebimento,
    dataRetirada,
    identificacao,
  };

  // Adicionar o novo usuário à base de dados
  router.db.get('encomendas').push(novoUsuario).write();

  // Responder com sucesso
  res.json({ mensagem: 'Encomenda criada com sucesso' });
});

server.put('/encomendas/update/:id', (req, res) => {
  const { id } = req.params;
  const {
    recebedor,
    coletor,
    destinatario,
    dataRecebimento,
    dataRetirada,
    identificacao,
  } = req.body;

  // Atualizar a encomenda com o ID fornecido
  router.db
    .get('encomendas')
    .find({ id: parseInt(id) })
    .assign({
      recebedor,
      coletor,
      destinatario,
      dataRecebimento,
      dataRetirada,
      identificacao,
    })
    .write();

  res.json({ mensagem: 'Encomenda atualizada com sucesso' });
});

server.delete('/encomendas/delete/:id', (req, res) => {
  const { id } = req.params;

  // Excluir a encomenda com o ID fornecido
  router.db
    .get('encomendas')
    .remove({ id: parseInt(id) })
    .write();

  res.json({ mensagem: 'Encomenda excluída com sucesso' });
});

server.post('/apartamentos', (req, res) => {
  const { cpf, identificacao } = req.body;
  const apartamentos = router.db.get('apartamentos').value();
  const apartamentosAutenticado = apartamentos.find(
    (apartamento) => apartamento.cpf === cpf && apartamento.identificacao === identificacao,
  );

  if (apartamentosAutenticado) {
    // Criar o token de acesso com expiração de 1 hora
    const token = jwt.sign(
      {
        cpf: apartamentosAutenticado.cpf,
        identificacao: apartamentosAutenticado.identificacao,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      'encomendaDirecionadaAvaliacaoOficial2',
    );

    // Enviar o usuário autenticado juntamente com o token
    res.json({
      token,
      mensagem: 'Autenticação bem-sucedida',
    });
    console.log('AUTENTICADO');
  } else {
    res.json({ mensagem: 'Autenticação não efetuada', deuger: identificacao });
    console.log(req);
  }
});

server.get('/apartamentos/list', (req, res) => {
  const apartamentos = router.db.get('apartamentos').value();

  // Enviar o usuário autenticado juntamente com o token
  res.json({
    apartamentos,
  });
});

server.post('/apartamentos/create', (req, res) => {
  const { identificacao, cpf } = req.body;
  const apartamentos = router.db.get('apartamentos').value();
  const apartamentosExistente = apartamentos.find(
    (usuario) => usuario.identificacao === identificacao,
  );

  if (apartamentosExistente) {
    res
      .status(400)
      .json({ mensagem: 'Identificacao já existe na base de dados' });
  } else {
    const novoApartamento = {
      id: apartamentos.length + 1, // Gera um novo ID baseado no tamanho atual da lista de apartamentos
      cpf,
      identificacao,
    };

    // Adicionar o novo usuário à base de dados
    router.db.get('apartamentos').push(novoApartamento).write();

    // Responder com sucesso
    res.json({ mensagem: 'Apartamento criado com sucesso' });
  }
});

server.put('/apartamentos/update/:id', (req, res) => {
  const { id } = req.params;
  const { cpf, identificacao } = req.body;
  // const apartamentos = router.db.get('apartamentos').value();
  router.db
    .get('apartamentos')
    .find({ id: parseInt(id) })
    .assign({ cpf, identificacao })
    .write();

  res.json({ mensagem: 'Apartamento atualizado com sucesso' });
  // const apartamentosExistente = apartamentos.find(
  //   (usuario) => usuario.identificacao === identificacao,
  // );
  // if (apartamentosExistente) {
  //   res
  //     .status(400)
  //     .json({ mensagem: 'Identificacao já existe na base de dados' });
  // } else {
  // Atualizar o apartamento com o ID fornecido
  // }
});

server.delete('/apartamentos/delete/:id', (req, res) => {
  const { id } = req.params;

  // Excluir o apartamento com o ID fornecido
  router.db
    .get('apartamentos')
    .remove({ id: parseInt(id) })
    .write();

  res.json({ mensagem: 'Apartamento excluído com sucesso' });
});

server.use(router);
server.listen(3000, () => {
  console.log('Servidor JSON Server está rodando em http://localhost:3000');
});
