# New Design System Sep

Guia extraído do frontend `demoteaagenda` para replicar o visual do dashboard, menus, páginas, botões, gráficos e animações em outro projeto.

Base analisada:

- `tailwind.config.ts`
- `src/index.css`
- `components.json`
- `src/components/ui/*`
- `src/components/Layout.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/AdminDashboard.tsx`
- `src/pages/ProfessionalDashboard.tsx`
- `src/components/dashboard/*`
- `src/components/GuidedTour.tsx`

Observação importante: o projeto não usa SCSS. O design system real está em Tailwind CSS, CSS variables HSL e componentes React/shadcn. Para ser fiel, copie os tokens CSS, a configuração Tailwind e os padrões JSX/classes abaixo.

## Identidade Visual

O produto usa uma linguagem clínica, administrativa e leve: fundo frio claro, superfícies brancas, azul como cor de comando, verde como cor de suporte/sucesso e estados semânticos bem marcados.

Nome/marca exibida no dashboard: `SimpliClin`.

Assinatura no header: `Sua clínica em harmonia`.

Logo principal: componente SVG `SimpliClinIcon`, com linhas/nós em azul, verde e cinza.

Assets relevantes:

- `src/assets/simpliclin-logo.png`
- `src/assets/tea-agenda-logo.png`
- `src/assets/tea-agenda-logo-sidebar.png`
- `src/assets/tea-agenda-text-logo.png`
- `src/assets/mockup-dashboard.png`
- `src/assets/mockup-patients.png`
- `src/assets/mockup-schedule.png`

## Stack de Interface

Use esta base para reproduzir o design:

```
Vite + React + TypeScript
Tailwind CSS
shadcn/ui default style
Radix UI primitives
lucide-react
recharts
framer-motion
next-themes
tailwindcss-animate
class-variance-authority
clsx / tailwind-merge
```

Configuração shadcn original:

```json
{
  "style": "default",
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

## Tokens CSS

Copie estes tokens para o CSS global do novo projeto. Todas as cores do sistema usam HSL.

```css
@layer base {
  :root {
    --background: 207 44% 97%;
    --foreground: 216 28% 24%;

    --card: 0 0% 100%;
    --card-foreground: 216 28% 24%;

    --popover: 0 0% 100%;
    --popover-foreground: 216 28% 24%;

    --primary: 213 58% 43%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 213 58% 36%;

    --secondary: 145 50% 50%;
    --secondary-foreground: 0 0% 100%;
    --secondary-hover: 145 50% 43%;

    --muted: 210 20% 94%;
    --muted-foreground: 214 16% 65%;

    --accent: 145 40% 92%;
    --accent-foreground: 216 28% 24%;

    --destructive: 0 72% 51%;
    --destructive-foreground: 0 0% 100%;

    --warning: 38 92% 50%;
    --warning-foreground: 0 0% 100%;

    --success: 145 50% 50%;
    --success-foreground: 0 0% 100%;

    --devolutiva: 145 40% 47%;
    --devolutiva-foreground: 0 0% 100%;

    --border: 214 20% 88%;
    --input: 214 20% 88%;
    --ring: 213 58% 43%;

    --radius: 0.75rem;

    --gradient-primary: linear-gradient(135deg, hsl(213 58% 43%), hsl(145 50% 50%));
    --gradient-secondary: linear-gradient(135deg, hsl(145 50% 50%), hsl(213 58% 43%));
    --gradient-background: linear-gradient(180deg, hsl(207 44% 97%), hsl(210 20% 94%));
    --gradient-hero: linear-gradient(135deg, hsl(213 58% 43% / 0.1), hsl(145 50% 50% / 0.1));

    --shadow-sm: 0 2px 8px -2px hsl(213 58% 43% / 0.1);
    --shadow-md: 0 4px 16px -4px hsl(213 58% 43% / 0.15);
    --shadow-lg: 0 8px 32px -8px hsl(213 58% 43% / 0.2);
    --shadow-card: 0 4px 20px -4px hsl(213 58% 43% / 0.1);
    --shadow-elegant: 0 10px 30px -10px hsl(213 58% 43% / 0.2);
    --shadow-glow: 0 0 40px hsl(213 58% 43% / 0.15);

    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    --sidebar-background: 207 44% 97%;
    --sidebar-foreground: 216 28% 24%;
    --sidebar-primary: 213 58% 43%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 210 20% 94%;
    --sidebar-accent-foreground: 216 28% 24%;
    --sidebar-border: 214 20% 88%;
    --sidebar-ring: 213 58% 43%;
  }
}
```

Dark mode:

```css
.dark {
  --background: 220 20% 10%;
  --foreground: 210 40% 98%;
  --card: 220 20% 13%;
  --card-foreground: 210 40% 98%;
  --popover: 220 20% 13%;
  --popover-foreground: 210 40% 98%;
  --primary: 213 58% 52%;
  --primary-foreground: 220 20% 10%;
  --primary-hover: 213 58% 58%;
  --secondary: 145 50% 55%;
  --secondary-foreground: 220 20% 10%;
  --secondary-hover: 145 50% 60%;
  --muted: 220 15% 18%;
  --muted-foreground: 214 16% 65%;
  --accent: 145 30% 20%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 72% 55%;
  --destructive-foreground: 210 40% 98%;
  --warning: 38 92% 55%;
  --warning-foreground: 220 20% 10%;
  --success: 145 50% 55%;
  --success-foreground: 220 20% 10%;
  --devolutiva: 145 40% 50%;
  --devolutiva-foreground: 220 20% 10%;
  --border: 220 15% 20%;
  --input: 220 15% 20%;
  --ring: 213 58% 52%;
  --sidebar-background: 220 20% 10%;
  --sidebar-foreground: 210 40% 98%;
  --sidebar-primary: 213 58% 52%;
  --sidebar-primary-foreground: 220 20% 10%;
  --sidebar-accent: 220 15% 18%;
  --sidebar-accent-foreground: 210 40% 98%;
  --sidebar-border: 220 15% 20%;
  --sidebar-ring: 213 58% 52%;
}
```

## Tailwind

Configuração essencial:

```tsx
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      gridTemplateColumns: {
        "15": "repeat(15, minmax(0, 1fr))",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        devolutiva: {
          DEFAULT: "hsl(var(--devolutiva))",
          foreground: "hsl(var(--devolutiva-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
```

## Regras Globais de CSS

O projeto aplica transições globais para troca de tema e superfícies.

```css
@layer base {
  * {
    @apply border-border;
  }

  html {
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  body {
    @apply bg-background text-foreground;
    transition: background-color 0.3s ease, color 0.3s ease;
  }

  .theme-transition,
  [class*="bg-"],
  [class*="text-"],
  [class*="border-"] {
    transition: background-color 0.3s ease,
      color 0.3s ease,
      border-color 0.3s ease,
      box-shadow 0.3s ease,
      fill 0.3s ease,
      stroke 0.3s ease;
  }

  .card,
  [data-slot="card"],
  [role="dialog"] {
    transition: background-color 0.3s ease,
      color 0.3s ease,
      border-color 0.3s ease,
      box-shadow 0.3s ease;
  }

  svg {
    transition: color 0.3s ease, fill 0.3s ease, stroke 0.3s ease;
  }

  input,
  textarea,
  select,
  button {
    transition: background-color 0.3s ease,
      color 0.3s ease,
      border-color 0.3s ease,
      box-shadow 0.2s ease;
  }
}
```

## Tipografia

Não há fonte customizada configurada. O projeto usa a pilha padrão do Tailwind.

Padrões:

- Títulos de página: `text-2xl font-bold text-foreground`
- Títulos de cards compactos: `text-lg font-semibold`
- CardTitle shadcn: `text-2xl font-semibold leading-none tracking-tight`
- Descrições: `text-sm text-muted-foreground`
- Labels laterais/menu: `text-xs uppercase tracking-wider text-sidebar-foreground/60`
- Indicadores pequenos: `text-xs font-medium`
- Números principais do dashboard: `text-5xl font-bold`

## Layout Administrativo

Shell principal:

```tsx
<SidebarProvider>
  <div className="min-h-screen flex w-full bg-accent/5">
    <AppSidebar activeTab={activeTab} onTabChange={onTabChange} />
    <SidebarInset className="flex-1">
      <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="flex items-center gap-3">
          <SimpliClinIcon size={28} />
          <div>
            <span className="text-sm font-bold text-primary">SimpliClin</span>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Sua clínica em harmonia
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 lg:p-6">
        <div className="bg-card rounded-lg shadow-sm border p-6">
          {children}
        </div>
      </main>
    </SidebarInset>
  </div>
</SidebarProvider>
```

Características:

- Fundo geral: `bg-accent/5`
- Header: altura `h-14`, borda inferior, `bg-background`
- Conteúdo: padding `p-4 lg:p-6`
- Painel de página: `bg-card rounded-lg shadow-sm border p-6`
- Navegação entre páginas via `Tabs` controlado por `activeTab`, mas sem `TabsList` no admin; o sidebar controla a troca.

## Sidebar e Menus

Sidebar:

```tsx
<Sidebar collapsible="icon" className="border-r border-sidebar-border">
```

Header do sidebar:

```tsx
<SidebarHeader className="h-14 justify-center border-b border-sidebar-border p-0 px-2">
```

Botão de menu ativo:

```tsx
<SidebarMenuButton
  isActive={activeTab === "home"}
  tooltip="Início"
  className={cn(
    "transition-colors",
    activeTab === "home" &&
      "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
  )}
>
  <Home className="size-4" />
  <span>Início</span>
</SidebarMenuButton>
```

Grupos usados:

- Principal: `Início`
- Cadastros: `Profissionais`, `Pacientes`, `Novo Horário`, `Especialidades`, `Anamnese`
- Agenda: `Agenda`, `Visão Geral`, `Simulação`
- Acompanhamento: `Faltas Prof.`, `Faltas Pac.`, `Alterações`, `Anotações`, `Links`
- Relatórios: `Atesto`, `Análise`, `PDI`, `Auditoria de Laudo`
- Configurações: `Importar`, `Vincular`, `Papéis`, `Valores`, `Responsáveis`, `Config. Empresa`, `LGPD / DPO`, `Instalar App`

Footer do sidebar:

- Avatar quadrado arredondado `h-8 w-8 rounded-lg`
- AvatarFallback `rounded-lg bg-primary text-primary-foreground text-xs`
- Dropdown com dados do usuário, tema, notificações, refazer tour, trocar visão e sair.

## Dashboard Home

Container principal:

```tsx
<div className="space-y-6 bg-gradient-to-br from-card to-accent/10 -m-6 p-6 rounded-lg min-h-full">
```

Header sticky:

```tsx
<div className="sticky top-0 z-20 bg-gradient-to-r from-card/95 to-accent/20 backdrop-blur-sm pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 pt-2 -mt-2 rounded-b-lg shadow-sm border-b border-accent/20">
```

Estrutura do dashboard:

1. Header sticky com título, período, filtro, relógio, exportação PDF e tema.
2. Acesso rápido com grade responsiva.
3. Cards de métricas em `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`.
4. Gráfico de evolução mensal.
5. Rankings em `grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6`.
6. Ranking de terapias + atividades recentes em `grid grid-cols-1 lg:grid-cols-2 gap-6`.

## Acesso Rápido

Grade:

```tsx
<div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-3">
```

Botão:

```tsx
<button className="flex flex-col items-center justify-center p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-all duration-200 group">
  <div className="text-primary group-hover:scale-110 transition-transform duration-200">
    <Users className="h-6 w-6" />
  </div>
  <span className="text-xs font-medium text-foreground mt-2 text-center">
    Pacientes
  </span>
</button>
```

Cores por item:

- Pacientes: `text-primary`, `bg-primary/10 hover:bg-primary/20`
- Profissionais: `text-secondary`, `bg-secondary/10 hover:bg-secondary/20`
- Agenda: `text-success`, `bg-success/10 hover:bg-success/20`
- Faltas Prof.: `text-destructive`, `bg-destructive/10 hover:bg-destructive/20`
- Faltas Pac.: `text-warning`, `bg-warning/10 hover:bg-warning/20`
- Devolutivas: `text-devolutiva`, `bg-devolutiva/10 hover:bg-devolutiva/20`

## Cards

Card base shadcn:

```tsx
<div className="rounded-lg border bg-card text-card-foreground shadow-sm" />
```

Header:

```tsx
<div className="flex flex-col space-y-1.5 p-6" />
```

Content:

```tsx
<div className="p-6 pt-0" />
```

Card de métrica simples:

```tsx
<Card className="border-0 shadow-md hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 transition-all duration-300 cursor-pointer group">
  <CardContent className="p-6">
    <div className="flex items-center justify-between mb-4">
      <span className="text-sm font-medium text-muted-foreground">Pacientes Ativos</span>
      <div className="p-2 bg-muted/50 rounded-lg group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
        <Users className="h-4 w-4 text-success" />
      </div>
    </div>
    <div className="flex flex-col items-center justify-center py-2">
      <div className="h-24 flex items-center justify-center">
        <span className="text-5xl font-bold text-success">42</span>
      </div>
      <span className="text-sm text-muted-foreground mt-3">
        pacientes com agenda
      </span>
    </div>
  </CardContent>
</Card>
```

Card circular:

- Card: `hover:shadow-xl hover:scale-[1.02] hover:border-primary/20 transition-all duration-300 cursor-pointer group border-0 shadow-md`
- SVG: `w-24 h-24 transform -rotate-90`
- Trilha: `text-muted/30`
- Barra: `stroke-primary`, `stroke-secondary`, `stroke-success`, `stroke-warning` ou `stroke-destructive`
- Animação: `transition: "stroke-dashoffset 0.5s ease-in-out"`

## Botões

Base do botão:

```tsx
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
```

Variações:

```tsx
default: "bg-primary text-primary-foreground hover:bg-primary/90"
destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
ghost: "hover:bg-accent hover:text-accent-foreground"
link: "text-primary underline-offset-4 hover:underline"
```

Tamanhos:

```tsx
default: "h-10 px-4 py-2"
sm: "h-9 rounded-md px-3"
lg: "h-11 rounded-md px-8"
icon: "h-10 w-10"
```

Exemplos recorrentes:

```tsx
<Button variant="outline" size="sm" className="h-7 px-2 text-xs">
  <Calendar className="h-3 w-3 mr-1" />
  Hoje
</Button>

<Button variant="outline" size="icon" className="h-7 w-7">
  <ChevronLeft className="h-4 w-4" />
</Button>

<Button className="bg-primary hover:bg-primary-hover text-primary-foreground shadow-md transition-all duration-200 hover:shadow-lg">
  Salvar
</Button>
```

## Badges

Base:

```tsx
"inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
```

Variações:

```tsx
default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80"
secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80"
destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80"
outline: "text-foreground"
```

Badge demo:

```tsx
<Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 gap-1.5 px-3 py-1">
  <Play className="size-3" />
  Modo Demo
</Badge>
```

## Formulários

Input:

```tsx
<input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
```

Labels no padrão de dados:

```tsx
<Label className="text-sm font-medium text-muted-foreground">Nome</Label>
<p className="font-medium">{value}</p>
```

Filtros segmentados:

```tsx
<div className="flex rounded-lg border border-border bg-muted/30 p-1">
  <Button variant={active ? "default" : "ghost"} size="sm" className="h-7 px-3 text-xs">
    Mês
  </Button>
</div>
```

## Tabelas

Tabela base:

```tsx
<div className="relative w-full overflow-auto">
  <table className="w-full caption-bottom text-sm" />
</div>
```

Linhas:

```tsx
<tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted" />
```

Cabeçalho:

```tsx
<th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground" />
```

Célula:

```tsx
<td className="p-4 align-middle" />
```

Em listagens customizadas, o projeto também usa grids densos com hover:

```tsx
<div className="grid grid-cols-12 gap-6 px-6 py-4 items-center hover:bg-muted/20 transition-colors" />
```

## Tabs

Base shadcn:

```tsx
<TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground" />
<TabsTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm" />
```

Na área do profissional:

```tsx
<TabsList className="grid w-full grid-cols-3 mb-6">
  <TabsTrigger value="agenda" className="flex items-center gap-2">
    <Calendar className="w-4 h-4" />
    <span className="hidden sm:inline">Minha Agenda</span>
    <span className="sm:hidden">Agenda</span>
  </TabsTrigger>
</TabsList>
```

No admin, as `TabsContent` usam `className="mt-0"` e o menu lateral troca o valor ativo.

## Gráficos

Biblioteca: `recharts`.

Wrapper genérico:

```tsx
<ChartContainer
  config={chartConfig}
  className="flex aspect-video justify-center text-xs"
>
  <LineChart data={data}>...</LineChart>
</ChartContainer>
```

O wrapper injeta variáveis CSS por gráfico:

```css
[data-chart=chart-id] {
  --color-key: hsl(var(--primary));
}
```

Tooltip padrão:

```tsx
<div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl" />
```

### Evolução Mensal

Card:

```tsx
<Card className="border-0 shadow-md">
```

Altura:

```tsx
<div className="h-[300px] w-full">
```

Gráfico:

```tsx
<AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
  <XAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickLine={false} axisLine={false} />
  <Area type="monotone" dataKey="esperados" stroke="hsl(var(--muted-foreground))" strokeWidth={2} strokeDasharray="5 5" fill="url(#colorEsperados)" />
  <Area type="monotone" dataKey="atendimentos" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#colorAtendimentos)" />
  <Area type="monotone" dataKey="faltas" stroke="hsl(var(--destructive))" strokeWidth={2} fill="url(#colorFaltas)" />
</AreaChart>
```

Gradientes:

```tsx
<linearGradient id="colorAtendimentos" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
</linearGradient>
```

Tooltip custom:

```tsx
<div className="bg-popover border border-border rounded-lg shadow-lg p-3">
  <p className="font-semibold text-foreground capitalize mb-2">Maio/2026</p>
  <div className="space-y-1 text-sm">...</div>
</div>
```

### Rankings

Card de ranking:

```tsx
<Card className="border-0 shadow-md">
  <CardHeader>
    <CardTitle className="text-lg flex items-center gap-2">
      <Trophy className="h-5 w-5 text-primary" />
      Ranking de Atendimentos
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-yellow-500/10 border-yellow-500/20">
        ...
      </div>
    </div>
  </CardContent>
</Card>
```

Cores de ranking:

- 1o lugar: `bg-yellow-500/10 border-yellow-500/20`, icone `text-yellow-500`
- 2o lugar: `bg-gray-400/10 border-gray-400/20`, icone `text-gray-400`
- 3o lugar: `bg-amber-600/10 border-amber-600/20`, icone `text-amber-600`
- Demais: `bg-muted/30 border-transparent`

### Atividades Recentes

Container:

```tsx
<ScrollArea className="h-[400px] px-4 pb-4">
```

Item:

```tsx
<div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
  <div className="p-2 rounded-lg bg-primary/10 text-primary">
    <Calendar className="h-4 w-4" />
  </div>
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium text-foreground truncate">Título</p>
    <p className="text-xs text-muted-foreground truncate">Descrição</p>
  </div>
  <span className="text-xs text-muted-foreground whitespace-nowrap">Ontem</span>
</div>
```

Estados:

- Success: `bg-success/10 text-success`
- Warning: `bg-warning/10 text-warning`
- Error: `bg-destructive/10 text-destructive`
- Info: `bg-primary/10 text-primary`

## Agenda Profissional

Página fora do shell administrativo:

```tsx
<div className="min-h-screen bg-accent/5">
  <header className="border-b bg-card/50 backdrop-blur-sm">
    <div className="container mx-auto px-4 py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        ...
      </div>
    </div>
  </header>
  <div className="container mx-auto px-4 py-8">...</div>
</div>
```

Card de informações:

```tsx
<Card className="mb-6">
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Stethoscope className="w-5 h-5" />
      Informações Profissionais
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">...</div>
  </CardContent>
</Card>
```

Calendário desktop:

```tsx
<div className="grid grid-cols-7 gap-0 border border-border rounded-lg overflow-hidden bg-background">
  <div className="bg-muted p-3 border-r border-border font-medium text-sm">GMT-03</div>
  <div className="bg-muted p-3 border-r last:border-r-0 border-border text-center">...</div>
  <div className="p-3 border-r border-t border-border text-sm font-medium text-muted-foreground bg-background">8:00</div>
  <div className="p-2 border-r last:border-r-0 border-t border-border min-h-[60px] bg-background hover:bg-muted/50 transition-colors">...</div>
</div>
```

Legenda de status:

- Falta Prof.: `bg-red-500`, texto `text-red-600 dark:text-red-400`
- Falta Pac.: `bg-pink-500`, texto `text-pink-600 dark:text-pink-400`
- Anamnese: `bg-purple-500`, texto `text-purple-600 dark:text-purple-400`
- Devolutiva: `bg-green-500`, texto `text-green-600 dark:text-green-400`
- Substituição: `bg-amber-500`, texto `text-amber-600 dark:text-amber-400`

## Dialogs, Popovers e Dropdowns

Overlay:

```tsx
"fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
```

Dialog:

```tsx
"fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
```

Dropdown:

```tsx
"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
```

Item:

```tsx
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
```

## Animações

Padrões usados:

- Transição global de tema: `0.3s ease`
- Hover de card do dashboard: `transition-all duration-300`, `hover:scale-[1.02]`, `hover:shadow-xl`
- Ícones em cards/botões: `group-hover:scale-110 transition-all duration-300`
- Sidebar: `duration-300 transition-[left,right,width] ease-in-out`
- Menus/dialogs: `animate-in`, `animate-out`, `fade-in-0`, `zoom-in-95`, `slide-in-*`
- Loading: `animate-spin rounded-full border-b-2 border-primary`
- Skeleton: `animate-pulse rounded-md bg-muted`
- Chat typing: `animate-bounce` com delays
- Tour guiado: `framer-motion`

Tour guiado:

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
>
  <motion.div
    initial={{ scale: 0.9, opacity: 0, y: 20 }}
    animate={{ scale: 1, opacity: 1, y: 0 }}
    exit={{ scale: 0.9, opacity: 0, y: 20 }}
    transition={{ type: "spring", damping: 25, stiffness: 300 }}
    className="w-full max-w-md"
  />
</motion.div>
```

Indicador de progresso:

```tsx
<div className="h-1 bg-muted">
  <motion.div
    className="h-full bg-gradient-to-r from-primary to-primary/70"
    initial={{ width: 0 }}
    animate={{ width: `${progress}%` }}
    transition={{ duration: 0.3 }}
  />
</div>
```

Theme toggle:

```tsx
<Button variant="outline" size="icon" className="h-9 w-9 relative overflow-hidden">
  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 dark:-rotate-90 dark:scale-0" />
  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 dark:rotate-0 dark:scale-100" />
</Button>
```

## Responsividade

Regras recorrentes:

- Containers: `container mx-auto px-4`
- Admin main: `p-4 lg:p-6`
- Cards/painéis: `p-6`
- Dashboard cards: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4`
- Quick access: `grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9`
- Rankings: `grid-cols-1 lg:grid-cols-2 xl:grid-cols-4`
- Blocos de duas colunas: `grid-cols-1 lg:grid-cols-2`
- Área profissional: header em coluna no mobile e linha no desktop: `flex flex-col sm:flex-row`
- Calendário profissional: mobile usa cards por dia (`block md:hidden`); desktop usa grade (`hidden md:block`)

## Padrão de Página Administrativa

Use este molde para novas páginas internas:

```tsx
function MinhaPagina() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Título da Página</h2>
        <p className="text-muted-foreground">Descrição curta da função.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Seção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          ...
        </CardContent>
      </Card>
    </div>
  );
}
```

Para páginas de dashboard, use o fundo gradiente interno:

```tsx
<div className="space-y-6 bg-gradient-to-br from-card to-accent/10 -m-6 p-6 rounded-lg min-h-full">
```

Para páginas de gestão/listagem, use:

```tsx
<div className="space-y-4">
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h2 className="text-2xl font-bold">Entidade</h2>
      <p className="text-muted-foreground">Descrição</p>
    </div>
    <Button>
      <Plus className="h-4 w-4" />
      Novo
    </Button>
  </div>
  <Card>...</Card>
</div>
```

## Dependências Para Portar

Instale o equivalente:

```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs @radix-ui/react-tooltip @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react recharts framer-motion next-themes tailwindcss-animate
```

Se copiar todos os componentes shadcn usados no projeto original, inclua:

```
accordion, alert-dialog, alert, avatar, badge, breadcrumb, button, calendar,
card, chart, checkbox, dialog, dropdown-menu, form, input, label, popover,
progress, scroll-area, select, separator, sheet, sidebar, skeleton, switch,
table, tabs, textarea, toast, tooltip
```

## Checklist de Fidelidade

Para o novo projeto ficar visualmente fiel:

- Copie `src/index.css` ou replique exatamente os tokens acima.
- Copie o `tailwind.config.ts` com as cores semânticas e `tailwindcss-animate`.
- Use `ThemeProvider` de `next-themes` com `attribute="class"` e `defaultTheme="system"`.
- Use `Button`, `Card`, `Badge`, `Tabs`, `Sidebar`, `Dialog`, `DropdownMenu` no padrão shadcn.
- Use `lucide-react` para todos os ícones.
- Use `bg-accent/5` como fundo de app.
- Use `bg-card rounded-lg shadow-sm border p-6` como superfície de página no admin.
- Use cards de dashboard `border-0 shadow-md hover:shadow-xl hover:scale-[1.02]`.
- Use gráficos Recharts com `h-[300px]`, eixos sem linha, ticks `muted-foreground`, grids `stroke-muted`.
- Preserve os estados semânticos: `primary`, `secondary`, `success`, `warning`, `destructive`, `devolutiva`.
- Preserve os padrões de animação Radix: `animate-in`, `fade-in-0`, `zoom-in-95`, `slide-in-*`.
