# Bíblia Kids

Plataforma web gamificada de ensino bíblico para crianças, inspirada na experiência do Duolingo. Alunos completam lições semanais com questões interativas, acumulam XP e mantêm sequências de estudo. Professores gerenciam todo o conteúdo por um painel administrativo completo.

---

## Funcionalidades

### Área do Aluno
- **Dashboard personalizado** com saudação, lição da semana em destaque e lista completa de lições com estados: bloqueada, disponível e concluída
- **Sistema de XP e níveis** — 10 níveis progressivos de *Novato* a *Sumo Sacerdote* com barra de progresso animada
- **Sequência semanal** — visualização dos últimos 7 dias de atividade
- **Fluxo de lição em três fases:** introdução com versículo → questões interativas → tela de resultado com XP animado e estrelas
- **Dois tipos de questão:** múltipla escolha e preencher a lacuna
- **Bônus de XP** para pontuação perfeita (100%)

### Área Administrativa
- **Planos de estudo** — criar, editar e excluir planos anuais
- **Lições** — criar com título, semana, versículo e data de disponibilização; publicar ou manter como rascunho; visualizar preview
- **Questões** — adicionar questões de múltipla escolha e preenchimento de lacuna por lição
- **Controle de publicação** — lições em rascunho são invisíveis aos alunos até serem publicadas

### Autenticação
- Login com Google via Firebase Auth
- Controle de acesso baseado em papel (`student` / `admin`)
- Rotas protegidas com guards dedicados

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Linguagem | TypeScript 6 (strict) |
| Estilização | Tailwind CSS v4 |
| Animações | Framer Motion 12 |
| Roteamento | React Router v7 |
| Backend / Auth | Firebase 12 (Firestore + Auth) |
| Fonte | Nunito (Google Fonts) |

---

## Estrutura do projeto

```
src/
├── components/
│   ├── games/         # MultipleChoiceGame, FillBlankGame
│   ├── layout/        # StudentLayout, AdminLayout
│   └── ui/            # Componentes reutilizáveis
├── features/
│   └── auth/          # useAuth — contexto de autenticação
├── lib/
│   ├── firebase.ts    # Inicialização do Firebase
│   └── firestore.ts   # Funções de leitura/escrita no Firestore
├── pages/
│   ├── admin/         # AdminPlansPage, AdminPlanDetailPage, forms…
│   └── student/       # DashboardPage, LessonPage
├── routes/            # AppRouter, AuthGuard, AdminGuard
├── types/             # Interfaces TypeScript globais
└── utils/             # xp.ts — cálculo de nível e progresso
```

---

## Instalação

**Pré-requisitos:** Node.js 18+ e um projeto Firebase com Firestore e Authentication (Google) habilitados.

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/biblia-kids.git
cd biblia-kids

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Preencha com as credenciais do seu projeto Firebase

# Inicie o servidor de desenvolvimento
npm run dev
```

### Variáveis de ambiente

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### Scripts

```bash
npm run dev       # Servidor de desenvolvimento
npm run build     # Build de produção (tsc + vite build)
npm run preview   # Preview do build local
npm run lint      # ESLint
```

---

## Modelo de dados (Firestore)

```
users/{uid}
  displayName, email, photoURL, role, xp, streak, lastLoginAt, createdAt

studyPlans/{planId}
  title, year, description, createdBy, createdAt

lessons/{lessonId}
  planId, title, weekNumber, baseVerse, verseText, availableFrom,
  xpReward, order, published, createdBy

questions/{questionId}
  lessonId, type, order, prompt
  // múltipla escolha → options[], correctOption
  // lacuna          → sentence, correctAnswer, hint, wordOptions[]

progress/{userId}_{lessonId}
  userId, lessonId, score, xpEarned, answers[], completedAt
```

---

## Roadmap

| Fase | Conteúdo | Status |
|---|---|---|
| 1 | Fundação: Vite, tipos, rotas, autenticação | ✅ Concluída |
| 2 | Admin: CRUD de planos, lições e questões | ✅ Concluída |
| 3 | Aluno: dashboard, fluxo de questões, progresso | ✅ Concluída |
| 4 | Gamificação: XP, níveis, sequência, animações | ✅ Concluída |
| 5 | Firebase real: auth Google, Firestore, PWA | 🔲 Próxima |

---

## Design System

Cores definidas via `@theme` no Tailwind CSS:

| Token | Valor | Uso |
|---|---|---|
| `brand-green` | `#58CC02` | Acerto, progresso, CTA principal |
| `brand-blue` | `#1CB0F6` | Destaque, links, streak |
| `brand-purple` | `#CE82FF` | Admin, badges |
| `brand-red` | `#FF4B4B` | Erro, alerta |
| `brand-yellow` | `#FFD900` | XP, moedas, conquistas |
| `brand-orange` | `#FF9600` | Avisos, vidas |

---

## Licença

MIT
