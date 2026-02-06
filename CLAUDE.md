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
* Adicionar itens/serviços com tabela dinâmica
* Gerar PDF
* Visualizar antes de gerar

**Tabela de Itens/Serviços** (BudgetItem):

Cada orçamento contém uma lista de itens detalhados:

* Descrição (texto, obrigatório)
* Quantidade (inteiro, mínimo 1)
* Preço unitário (decimal, >= 0)
* Preço total (calculado automaticamente: quantidade × preço unitário)
* Ordem (posição do item na lista)

O **valor total do orçamento** é calculado automaticamente como a soma dos preços totais dos itens.

Na interface, o usuário pode:

* Selecionar itens do catálogo (preenche descrição e preço automaticamente)
* Adicionar itens manuais (sem vínculo com catálogo)
* Adicionar novas linhas de itens
* Remover linhas (mínimo 1 item obrigatório)
* Editar descrição, quantidade e preço unitário em tempo real
* Visualizar o total parcial de cada linha e o total geral

**Campos do Orçamento**:

* Cliente (relacional, obrigatório)
* Itens/Serviços (lista de BudgetItem, mínimo 1)
* Observações (texto livre, opcional)
* Referência a Ordem de Serviço (opcional)
* Número/identificador (gerado automaticamente: ORC-YYYYMMDD-XXXX)
* Data de emissão (automática)

**Conteúdo do PDF**:

* Logo da empresa
* Nome e dados da empresa
* Dados do cliente
* Tabela de itens/serviços com valores individuais
* Valor total
* Número/identificador do orçamento
* Data de emissão

**Observações**:

* Foco apenas em layout e campos
* Sem impostos, descontos ou regras fiscais

---

### 5. Catálogo de Itens / Serviços

**Objetivo**: Manter um cadastro pré-definido de itens e serviços oferecidos pela oficina, facilitando a criação de orçamentos.

**Funcionalidades**:

* Criar item/serviço
* Editar item/serviço
* Ativar/desativar item (controle de visibilidade no orçamento)
* Excluir item (soft delete)
* Listar itens

**Campos** (ServiceItem):

* Nome (obrigatório)
* Descrição (opcional)
* Preço padrão (decimal, >= 0)
* Ativo (boolean, padrão true)

**Integração com Orçamentos**:

* Na criação de orçamento, cada linha pode ser preenchida a partir do catálogo
* Ao selecionar um item do catálogo, a descrição e o preço unitário são preenchidos automaticamente
* O usuário pode ainda editar os valores manualmente após a seleção
* Também é possível adicionar itens manuais (sem vínculo com catálogo)
* O BudgetItem possui um campo opcional `serviceItemId` que referencia o item do catálogo

---

## Fluxo Geral do Sistema

1. Usuário acessa o sistema (autenticado)
2. Cadastra itens/serviços no catálogo
3. Cadastra clientes
4. Cria ordens de serviço vinculadas a clientes
5. Atualiza status da OS conforme andamento
6. Registra entradas/saídas no fluxo de caixa
7. Gera orçamentos em PDF (selecionando itens do catálogo ou manualmente)

---

## Modelagem de Dados (Visão Conceitual)

Entidades principais:

* User
* Client
* ServiceOrder
* CashFlow
* Budget
* BudgetItem
* ServiceItem

Relacionamentos:

* Client 1:N ServiceOrder
* ServiceOrder 1:N CashFlow (opcional)
* Client 1:N Budget
* Budget 1:N BudgetItem (cascade delete)
* ServiceItem 1:N BudgetItem (opcional, set null on delete)

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
