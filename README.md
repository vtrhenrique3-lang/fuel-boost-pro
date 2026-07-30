# ⛽ FuelRewards — Plataforma White-Label de Fidelidade para Postos

O **FuelRewards** é uma solução completa (SaaS White-Label) de fidelidade para postos de combustíveis. Diferente de modelos tradicionais baseados em cashback, a plataforma oferece **desconto direto na bomba com gamificação por volume abastecido**, aumentando o LTV (Lifetime Value) e reduzindo a perda de clientes na pista.

---

## ⚡ Diferenciais Comerciais & Funcionalidades

### 📱 App do Motorista (Mobile-First)
- **Gamificação por Níveis**: Níveis Bronze, Prata, Ouro e Diamante com barras de progresso dinâmicas por litros acumulados no mês.
- **Token Único & Antifraude (6 dígitos)**: Geração de código dinâmico com expiração regressiva de 2 minutos para apresentação na bomba.
- **Gestão de Perfil & CPF**: Cadastro e atualização de CPF e telefone para identificação segura na validação do desconto.
- **Histórico Transparente**: Registro detalhado dos litros abastecidos e valor economizado em R$.

### 💻 Painel do Gestor & Terminal da Pista (Desktop Web)
- **Terminal POS / Validador de Pista**: Validação instantânea do token de 6 dígitos ou CPF do motorista pelo frentista, com cálculo automático de subtotal, desconto aplicado e valor final líquido.
- **Painel de Regras & Tiers**: Ajuste dinâmico de faixas de volume (L) e desconto concedido por litro (R$/L) valendo em tempo real.
- **Inteligência de Vendas e Churn**: Indicadores de galonagem mensal, descontos totais concedidos, novos clientes cadastrados e percentual de risco de churn.
- **Exportação de Relatórios (CSV)**: Exportação de relatório completo de clientes e transações para integração contábil e auditoria.
- **Modo Gestor Demo Integrado**: Botão de alternância instantânea para demonstração comercial em apresentações de vendas.

---

## 🛠️ Tecnologias Utilizadas

- **Core**: React 19 + TypeScript
- **Roteamento & Server Functions**: TanStack Router + TanStack Start + TanStack Query
- **Estilização**: Tailwind CSS v4 + Design System responsivo
- **Notificações**: Sonner (Toast notifications)
- **Backend & Banco de Dados**: Supabase (Auth, Postgres RLS e Triggers)

---

## 🚀 Como Executar Localmente

1. Clone o repositório:
   ```bash
   git clone https://github.com/vtrhenrique3-lang/fuel-boost-pro.git
   cd fuel-boost-pro
   ```
2. Instale as dependências:
   ```bash
   npm install
   # ou
   bun install
   ```
3. Execute o ambiente de desenvolvimento:
   ```bash
   npm run dev
   # ou
   bun dev
   ```

