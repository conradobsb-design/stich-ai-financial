# Extrato Co. — Design System

## 1. Identity
**App:** Extrato Co. — gestão financeira pessoal  
**Vibe:** Premium Dark Finance · Nubank-inspired · Glassmorphism  
**Platform:** Mobile-first (iOS + Android) · Web (PWA)  
**Modes:** Dark (primary) + Light (full support)

---

## 2. Color Palette

### Dark Mode (Primary)
| Token | Hex | Role |
|---|---|---|
| `surface-base` | `#020617` | Background (Slate 950) |
| `surface-card` | `#0f172a` | Card background (Slate 900) |
| `surface-elevated` | `#1e293b` | Elevated card / modal (Slate 800) |
| `primary` | `#820AD1` | Primary action (Nubank Purple) |
| `primary-light` | `#a855f7` | Purple hover / accent |
| `accent` | `#0ea5e9` | Charts / secondary accent (Sky Blue) |
| `text-primary` | `#ffffff` | Main text |
| `text-secondary` | `#94a3b8` | Secondary / labels (Slate 400) |
| `text-tertiary` | `#475569` | Placeholders (Slate 600) |
| `success` | `#22c55e` | Income / positive (Green 500) |
| `danger` | `#ef4444` | Expense / negative (Red 500) |
| `warning` | `#f59e0b` | Alerts (Amber 500) |
| `border-subtle` | `rgba(255,255,255,0.05)` | Card borders |
| `border-medium` | `rgba(255,255,255,0.10)` | Active borders |

### Light Mode
| Token | Hex | Role |
|---|---|---|
| `surface-base` | `#f8fafc` | Background (Slate 50) |
| `surface-card` | `#ffffff` | Card background |
| `surface-elevated` | `#f1f5f9` | Elevated (Slate 100) |
| `primary` | `#7c3aed` | Primary action (Violet 700) |
| `accent` | `#0284c7` | Charts / accent (Sky 700) |
| `text-primary` | `#0f172a` | Main text (Slate 900) |
| `text-secondary` | `#475569` | Secondary (Slate 600) |
| `border-subtle` | `rgba(0,0,0,0.06)` | Card borders |

---

## 3. Typography
- **Font:** Inter (system-ui fallback)
- **Display (Balance):** 36–48px, font-weight 700, tracking -0.02em
- **Headline:** 20–24px, font-weight 600
- **Body:** 14–16px, font-weight 400
- **Caption:** 12px, font-weight 400, text-secondary

---

## 4. Elevation & Glassmorphism
```css
/* Glass Card */
background: rgba(30, 41, 59, 0.6);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.05);
box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
border-radius: 20px;
```

---

## 5. Stitch Project IDs
| Project | ID | Status |
|---|---|---|
| Análise Financeira Extrato (legacy) | `18226097735620231379` | 4 screens (light) |
| **Extrato Co. (current)** | `1694122937233939618` | Active |

---

## 6. Screen Inventory

### Extrato Co. (Dark/Light Redesign)
| Screen | Stitch ID | Local File |
|---|---|---|
| Dashboard Home | `023018b5ead04f1fb6040a566e771e7e` | `designs/extrato-co/dashboard-dark.png` |
| Extrato (Transactions List) | `d986f9d5b10d4fd99d8213fc6243e50b` | `designs/extrato-co/extrato-list-dark.png` |
| Nova Transação (Modal) | `e7cb2af3e5da495d827a2d0a25898c26` | `designs/extrato-co/add-transaction-dark.png` |
| Análise / Insights | `59a8f043744644be852387478f8dc1a9` | `designs/extrato-co/insights-dark.png` |
| Perfil / Configurações | — | Planned |

### Legacy Screens (Análise Financeira Extrato)
| Screen | Stitch ID |
|---|---|
| Dashboard Financeiro | `113dbf07f60a447cbd9ac1a51adeb937` |
| Extrato Detalhado | `0afd7234273b4ae5b280baa916266649` |
| Análise de Gastos | `c193b89c20ce494bbebb9b90fd93fc65` |
| Importar Extrato | `5a94620771b64df89622e5e090e11855` |

---

## 7. Design Principles
1. **Balance is King** — o saldo total é o maior elemento da tela
2. **Color = Sentiment** — verde para receita, vermelho para despesa, sempre
3. **Glass Layer** — cards usam glassmorphism, nunca fundo sólido sem blur
4. **Dark First** — dark mode é a experiência primária
5. **Bottom Nav** — navegação principal em pill flutuante com 5 tabs
