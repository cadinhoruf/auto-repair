# CLAUDE.md

## Visão Geral do Projeto

Sistema web de gestão para oficina mecânica, desenvolvido como aplicação **fullstack** utilizando **Next.js**, com foco em simplicidade operacional, usabilidade e clareza funcional. O sistema cobre cadastro de clientes, ordens de serviço, fluxo de caixa simples e geração de orçamentos em PDF personalizados com identidade visual da empresa.

Este documento serve como **fonte única de verdade funcional e técnica** para orientar o desenvolvimento e decisões do projeto.

---

## Stack Tecnológica

* **Framework**: Next.js (App Router)
* **Arquitetura**: Fullstack (frontend + backend no mesmo projeto)
* **Starter**: T3 Stack
* **Runtime / Package Manager**: Bun
* **Banco de Dados**: PostgreSQL
* **ORM**: Prisma
* **API**: tRPC
* **Autenticação**: better-auth (boilerplate do T3)
* **Estilização**: Tailwind CSS
* **Qualidade de Código**: Biome
* **Infra local**: dbContainer

---

## Princípios do Projeto

* Simplicidade acima de tudo
* Foco funcional (evitar complexidade desnecessária)
* Interface intuitiva para usuários não técnicos
* Fluxos claros e poucos cliques
* Evolutivo, mas com escopo inicial bem controlado

---

## Perfis de Usuário

### Usuário Único (inicial)

* Dono da oficina ou atendente
* Acesso total às funcionalidades
* Sem controle de permissões na primeira versão

---

## Módulos do Sistema

### 1. Cadastro de Clientes

**Objetivo**: Manter um registro simples de clientes da oficina.

**Funcionalidades**:

* Criar cliente
* Editar cliente
* Visualizar cliente
* Listar clientes

**Campos**:

* Nome
* Telefone
* Email (opcional)
* Documento (CPF/CNPJ – opcional)
* Observações

---

### 2. Ordens de Serviço (OS)

**Objetivo**: Registrar, acompanhar e finalizar serviços realizados para clientes.

**Funcionalidades**:

* Criar ordem de serviço vinculada a um cliente
* Editar ordem de serviço
* Alterar status da OS
* Listar ordens de serviço
* Visualizar histórico

**Status possíveis**:

* Aberta
* Em andamento
* Finalizada

**Campos**:

* Cliente (relacional)
* Descrição do problema
* Serviços realizados
* Peças utilizadas (texto livre)
* Valor estimado
* Valor final
* Status
* Data de abertura
* Data de finalização (opcional)

---

### 3. Fluxo de Caixa Simples

**Objetivo**: Registrar entradas e saídas financeiras básicas da oficina.

**Funcionalidades**:

* Registrar entrada
* Registrar saída
* Listar movimentações

**Campos**:

* Tipo (Entrada | Saída)
* Descrição
* Valor
* Data
* Referência opcional à Ordem de Serviço

**Observações**:

* Não há relatórios contábeis avançados
* Não há categorização complexa
* Não há fechamento mensal automatizado

---

### 4. Orçamentos em PDF

**Objetivo**: Gerar orçamentos profissionais e personalizados para clientes.

**Funcionalidades**:

* Criar orçamento manual ou a partir de uma OS
* Gerar PDF
* Visualizar antes de gerar

**Conteúdo do PDF**:

* Logo da empresa
* Nome e dados da empresa
* Dados do cliente
* Lista de serviços/itens
* Valores individuais
* Valor total
* Número/identificador do orçamento
* Data de emissão

**Observações**:

* Foco apenas em layout e campos
* Sem impostos, descontos ou regras fiscais

---

## Fluxo Geral do Sistema

1. Usuário acessa o sistema (autenticado)
2. Cadastra clientes
3. Cria ordens de serviço vinculadas a clientes
4. Atualiza status da OS conforme andamento
5. Registra entradas/saídas no fluxo de caixa
6. Gera orçamentos em PDF quando necessário

---

## Modelagem de Dados (Visão Conceitual)

Entidades principais:

* User
* Client
* ServiceOrder
* CashFlow
* Budget

Relacionamentos:

* Client 1:N ServiceOrder
* ServiceOrder 1:N CashFlow (opcional)
* Client 1:N Budget

---

## Regras de Negócio

* Uma OS sempre pertence a um cliente
* Uma OS pode existir sem orçamento
* Um orçamento pode existir sem OS
* Fluxo de caixa pode ou não estar vinculado a uma OS
* Exclusões devem ser lógicas (soft delete), se possível

---

## Fora de Escopo (Versão Inicial)

* Controle de estoque
* Múltiplos usuários com permissões
* Relatórios financeiros avançados
* Emissão de nota fiscal
* Integrações externas

---

## Possíveis Evoluções Futuras

* Controle de estoque
* Perfis de usuário e permissões
* Dashboard financeiro
* Envio de orçamento por WhatsApp/Email
* Histórico detalhado por cliente

---

## Observações para IA / Claude

* Priorize clareza e simplicidade
* Não introduza complexidade sem justificativa
* Sempre respeite o escopo definido neste documento
* Em caso de dúvida, assuma a solução mais simples
