-- ============================================================
-- Atividade 8 - Normalização de Dados e Arquitetura de Software
-- Schemas propostos após aplicação de 1FN, 2FN e 3FN
-- ============================================================


-- ============================================================
-- EXERCÍCIO 1 — Tabela de Matrículas (1FN)
-- Violação: colunas disciplinas e professores são multivaloradas
-- Um atributo é atômico quando não pode ser dividido em partes
-- menores com significado próprio. "Cálculo, Física, Programação"
-- são três valores distintos numa única célula — violação direta da 1FN.
-- ============================================================

CREATE TABLE matriculas (
    matricula_id  INT           NOT NULL,
    aluno_nome    VARCHAR(100)  NOT NULL,
    disciplina    VARCHAR(100)  NOT NULL,
    professor     VARCHAR(100)  NOT NULL,
    PRIMARY KEY (matricula_id, disciplina)
);

-- Ana Lima passa de 1 linha (com lista) para 3 linhas (uma por disciplina)
INSERT INTO matriculas VALUES
    (1, 'Ana Lima', 'Cálculo',      'Prof. João'),
    (1, 'Ana Lima', 'Física',       'Prof. Marta'),
    (1, 'Ana Lima', 'Programação',  'Prof. Carlos'),
    (2, 'Pedro Souza', 'Cálculo',   'Prof. João'),
    (2, 'Pedro Souza', 'Química',   'Prof. Sara');


-- ============================================================
-- EXERCÍCIO 2 — Tabela de Vendas (3FN)
-- Cadeia de dependências transitivas:
--   venda_id → vendedor_id → departamento → gerente_depto
-- O gerente_depto não depende da PK (venda_id), mas sim do
-- departamento — violação da 3FN.
-- Problema prático: trocar o gerente de Eletrônicos exigiria
-- atualizar todas as linhas de vendas daquele departamento,
-- gerando anomalia de atualização e risco de inconsistência.
-- ============================================================

CREATE TABLE departamentos (
    departamento_id  INT           NOT NULL PRIMARY KEY,
    nome             VARCHAR(100)  NOT NULL,
    gerente_nome     VARCHAR(100)  NOT NULL
);

CREATE TABLE vendedores (
    vendedor_id      INT           NOT NULL PRIMARY KEY,
    nome             VARCHAR(100)  NOT NULL,
    departamento_id  INT           NOT NULL REFERENCES departamentos(departamento_id)
);

CREATE TABLE vendas (
    venda_id     INT            NOT NULL PRIMARY KEY,
    vendedor_id  INT            NOT NULL REFERENCES vendedores(vendedor_id),
    valor_venda  DECIMAL(10,2)  NOT NULL
);

-- Trocar o gerente de Eletrônicos: 1 UPDATE em departamentos, zero risco
UPDATE departamentos SET gerente_nome = 'Roberto Lima' WHERE nome = 'Eletrônicos';


-- ============================================================
-- EXERCÍCIO 3 — Sistema de Restaurante (1FN → 2FN → 3FN)
-- 1FN: itens_pedidos é multivalorado — separar uma linha por item
-- 2FN: garcom_nome e garcom_turno dependem só de pedido_id,
--      não da PK composta (pedido_id, item) — dependência parcial
-- 3FN: garcom_turno depende do garçom, não do pedido — transitiva
-- ============================================================

CREATE TABLE garcons (
    garcom_id  INT           NOT NULL PRIMARY KEY,
    nome       VARCHAR(100)  NOT NULL,
    turno      VARCHAR(20)   NOT NULL
);

CREATE TABLE pedidos (
    pedido_id  INT      NOT NULL PRIMARY KEY,
    mesa       SMALLINT NOT NULL,
    garcom_id  INT      NOT NULL REFERENCES garcons(garcom_id)
);

CREATE TABLE cardapio (
    item_id    INT            NOT NULL PRIMARY KEY,
    nome       VARCHAR(100)   NOT NULL,
    preco_unit DECIMAL(8,2)   NOT NULL
);

-- total NÃO é armazenado — calculado via query para evitar inconsistência
CREATE TABLE itens_pedido (
    pedido_id  INT      NOT NULL REFERENCES pedidos(pedido_id),
    item_id    INT      NOT NULL REFERENCES cardapio(item_id),
    qtd        SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY (pedido_id, item_id)
);

-- Query que calcula o total sempre consistente:
-- SELECT p.pedido_id, g.nome AS garcom, SUM(i.qtd * c.preco_unit) AS total
-- FROM pedidos p
-- JOIN garcons g      ON g.garcom_id = p.garcom_id
-- JOIN itens_pedido i ON i.pedido_id = p.pedido_id
-- JOIN cardapio c     ON c.item_id   = i.item_id
-- GROUP BY p.pedido_id, g.nome;


-- ============================================================
-- EXERCÍCIO 4 — Gestão de Biblioteca (2FN)
-- titulo_livro depende apenas de livro_id
-- usuario_email depende apenas de usuario_id
-- Nenhum depende da PK composta (livro_id, usuario_id) — 2FN violada
-- Anomalia de inserção: sem normalização, um livro só existiria
-- no sistema após ser emprestado pela primeira vez.
-- ============================================================

CREATE TABLE livros (
    livro_id      INT           NOT NULL PRIMARY KEY,
    titulo_livro  VARCHAR(200)  NOT NULL
);

CREATE TABLE usuarios (
    usuario_id     INT           NOT NULL PRIMARY KEY,
    usuario_email  VARCHAR(150)  NOT NULL UNIQUE
);

-- Livro pode ser cadastrado antes do primeiro empréstimo
CREATE TABLE emprestimos (
    livro_id         INT   NOT NULL REFERENCES livros(livro_id),
    usuario_id       INT   NOT NULL REFERENCES usuarios(usuario_id),
    data_emprestimo  DATE  NOT NULL,
    PRIMARY KEY (livro_id, usuario_id)
);


-- ============================================================
-- EXERCÍCIO 5 — Sistema de Clínica (3FN do zero)
-- Violações encontradas:
--   1FN: procedimentos é multivalorado
--   2FN: paciente_nome/cpf dependem só do paciente, não da consulta
--   2FN: medico_nome/crm/especialidade dependem só do médico
--   3FN: plano_cobertura depende de plano_saude (transitiva)
--   3FN: sala_andar depende de sala_numero (transitiva)
-- ============================================================

CREATE TABLE pacientes (
    paciente_id    INT          NOT NULL PRIMARY KEY,
    paciente_cpf   CHAR(11)     NOT NULL UNIQUE,
    paciente_nome  VARCHAR(100) NOT NULL
);

CREATE TABLE planos_saude (
    plano_id        INT          NOT NULL PRIMARY KEY,
    plano_nome      VARCHAR(100) NOT NULL UNIQUE,
    plano_cobertura SMALLINT     NOT NULL  -- percentual ex: 80
);

CREATE TABLE medicos (
    medico_id     INT          NOT NULL PRIMARY KEY,
    medico_crm    VARCHAR(20)  NOT NULL UNIQUE,
    medico_nome   VARCHAR(100) NOT NULL,
    especialidade VARCHAR(100) NOT NULL
);

CREATE TABLE salas (
    sala_id      INT      NOT NULL PRIMARY KEY,
    sala_numero  SMALLINT NOT NULL UNIQUE,
    sala_andar   SMALLINT NOT NULL
);

CREATE TABLE consultas (
    consulta_id  INT       NOT NULL PRIMARY KEY,
    paciente_id  INT       NOT NULL REFERENCES pacientes(paciente_id),
    plano_id     INT       NOT NULL REFERENCES planos_saude(plano_id),
    medico_id    INT       NOT NULL REFERENCES medicos(medico_id),
    sala_id      INT       NOT NULL REFERENCES salas(sala_id),
    data_hora    TIMESTAMP NOT NULL
);

-- Resolve o atributo multivalorado (1FN)
CREATE TABLE consulta_procedimentos (
    id            INT          NOT NULL PRIMARY KEY,
    consulta_id   INT          NOT NULL REFERENCES consultas(consulta_id),
    procedimento  VARCHAR(150) NOT NULL
);

-- Reflexão: alterar cobertura da Unimed de 80% para 70%
-- Modelo normalizado → 1 UPDATE, 1 tabela, 0 risco de inconsistência:
UPDATE planos_saude SET plano_cobertura = 70 WHERE plano_nome = 'Unimed';

-- Modelo flat → N UPDATEs em toda a tabela de consultas:
-- UPDATE consultas SET plano_cobertura = 70 WHERE plano_saude = 'Unimed'; ← O(n)