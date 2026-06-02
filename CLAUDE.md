# Bíblia Kids — Guia do Projeto

## Stack

- **React 19** + **Vite** (bundler)
- **TypeScript** (strict, sem `any`)
- **Tailwind CSS v4** (via plugin `@tailwindcss/vite`)
- **Firebase** — Authentication (Google) + Firestore
- **Framer Motion** — animações de feedback e transições
- **React Router v6** — roteamento com layout routes
- **Fonte:** Nunito (Google Fonts)

## Estilo de código

- Código simples e direto — sem camadas de abstração desnecessárias
- Se uma função só é usada em um lugar, escreva ela naquele arquivo mesmo
- Nomes descritivos e em inglês para código, comentários explicativos em português
- Prefira `handleAnswerSelect` a `handleClick`, `fetchLessonById` a `getData`
- Só crie um arquivo utilitário se ele for usado em mais de 2 lugares
- Cada componente tem uma única responsabilidade clara
- Sem `any` — declare todos os tipos explicitamente
- Comentários explicam o "por quê", nunca o "o quê"
- Não invente bibliotecas que não estão na stack — se precisar de algo novo, pergunte antes

## Convenções de nomes

| Coisa             | Convenção                      | Exemplo                        |
|-------------------|--------------------------------|--------------------------------|
| Componentes       | PascalCase                     | `LessonCard.tsx`               |
| Hooks             | camelCase prefixado com `use`  | `useProgress.ts`               |
| Páginas           | PascalCase sufixado com `Page` | `DashboardPage.tsx`            |
| Tipos/Interfaces  | PascalCase                     | `AppUser`, `Lesson`            |
| Funções utilitárias | camelCase                    | `calculateLevel`, `isAvailable` |
| Arquivos de dados | kebab-case                     | `mock.ts`, `firestore.ts`      |
| Constantes        | UPPER_SNAKE_CASE               | `MAX_XP_PER_LESSON`            |

## Estrutura de pastas

```
src/
├── assets/            # Ícones SVG, imagens estáticas
├── components/
│   ├── ui/            # Botões, cards, badges — componentes reutilizáveis puros
│   ├── game/          # FeedbackOverlay, XPBar, StreakBadge — componentes do jogo
│   └── layout/        # StudentLayout, AdminLayout — shells de página
├── data/
│   └── mock.ts        # ⚠️ DADOS MOCKADOS — substituir por Firestore na Fase 5
├── features/
│   ├── auth/          # useAuth (contexto de autenticação)
│   ├── student/       # Componentes específicos da área do aluno
│   └── admin/         # Componentes específicos da área do admin
├── hooks/             # Hooks reutilizáveis (useProgress, useLesson)
├── lib/
│   ├── firebase.ts    # Inicialização do Firebase
│   └── firestore.ts   # Funções de leitura/escrita no Firestore
├── pages/
│   ├── student/       # DashboardPage, LessonIntroPage, etc.
│   └── admin/         # AdminPlansPage, AdminLessonFormPage, etc.
├── routes/            # AppRouter, AuthGuard, AdminGuard
├── types/             # index.ts com todas as interfaces TypeScript
└── utils/             # xp.ts, dates.ts — funções puras sem dependências
```

## Arquivos com dados mockados

Os arquivos abaixo contêm dados fixos para desenvolvimento. **Substituir por chamadas ao Firestore na Fase 5.**

- `src/data/mock.ts` — plano de estudo, lições e questões mockados
- `src/features/auth/useAuth.tsx` — usuários fixos `MOCK_STUDENT` e `MOCK_ADMIN`

## Design system (Tailwind)

Cores definidas em `src/index.css` via `@theme`:

| Token                 | Valor     | Uso                         |
|-----------------------|-----------|-----------------------------|
| `brand-green`         | `#58CC02` | Acerto, progresso, CTA      |
| `brand-green-dark`    | `#46A302` | Hover do botão verde        |
| `brand-blue`          | `#1CB0F6` | Destaque, links, streak     |
| `brand-purple`        | `#CE82FF` | Admin, badges especiais     |
| `brand-red`           | `#FF4B4B` | Erro, alerta                |
| `brand-yellow`        | `#FFD900` | XP, moedas, conquistas      |
| `brand-orange`        | `#FF9600` | Avisos, vida                |
| `brand-bg`            | `#F7F7F7` | Fundo padrão                |

Padrões visuais:
- Botões: `rounded-2xl`, `font-bold`, `shadow-md`, `py-4 px-6`
- Cards: `rounded-2xl`, `bg-white`, `shadow-sm`, `border border-gray-100`
- Tipografia: `font-nunito`, títulos `font-black` ou `font-extrabold`
- Feedback acerto: fundo `brand-green` + ícone check animado
- Feedback erro: fundo `brand-red` + ícone X animado

## Fases de implementação

| Fase | Conteúdo                                      | Status      |
|------|-----------------------------------------------|-------------|
| 1    | Fundação: Vite, tipos, rotas, mock auth       | ✅ Concluída |
| 2    | Admin: CRUD de planos, lições e questões      | 🔲 Próxima  |
| 3    | Aluno: dashboard, fluxo de questões, progresso| 🔲          |
| 4    | Gamificação: animações, XP bar, confete       | 🔲          |
| 5    | Firebase real: auth Google, Firestore, PWA    | 🔲          |
