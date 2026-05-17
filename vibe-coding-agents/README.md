# Vibe Coding Agent Pack v2.0

7 agentes especializados integrados con Claude Code CLI.

## Estructura

```
vibe-coding-agents/
├── CLAUDE.md                        # Instrucciones base para Claude Code (editar por proyecto)
├── setup.sh                         # Instala el pack en cualquier proyecto
├── agents/
│   ├── pipeline.sh                  # Pipeline multi-agente (Audit + Security + DB)
│   ├── pre-commit                   # Hook git para seguridad automática
│   └── prompts/
│       ├── fullstack.md             # FullStack Dev Agent
│       ├── auditor.md               # Code Auditor Agent
│       ├── security.md              # Security Validator Agent
│       ├── ux-ui.md                 # UX/UI Design Agent
│       ├── sales.md                 # Sales Strategy Agent
│       ├── devops.md                # DevOps & CI/CD Agent
│       └── database.md             # Database Architect Agent
└── .claude/
    └── commands/
        ├── audit.md                 # /project:audit
        ├── security.md              # /project:security
        ├── db-review.md             # /project:db-review
        ├── ux-spec.md               # /project:ux-spec
        └── devops-check.md          # /project:devops-check
```

## Instalación en un proyecto nuevo

```bash
# Desde la raíz de tu proyecto
bash /path/to/vibe-coding-agents/setup.sh
```

El script copia `agents/`, `.claude/commands/`, instala el pre-commit hook, y crea `CLAUDE.md`.

## Uso diario en Claude Code

```bash
# Abrir Claude Code en tu proyecto
claude

# Comandos disponibles dentro de Claude Code:
/project:audit src/api/users.ts        # Auditoría de código
/project:security src/middleware/      # Revisión de seguridad
/project:db-review prisma/schema.prisma # Revisión de base de datos
/project:ux-spec "pantalla de login"   # Especificación UX/UI
/project:devops-check .github/         # Revisión de CI/CD
```

## Pipeline completo (pre-PR)

```bash
# Revisar una carpeta completa con 3 agentes en secuencia
./agents/pipeline.sh src/feature/payments/

# Revisar todo el proyecto
./agents/pipeline.sh --all

# El reporte se guarda como: review_YYYYMMDD_HHMMSS.md
```

## Pre-commit hook (seguridad automática)

El hook se instala automáticamente con `setup.sh`. Escanea los archivos staged antes de cada commit:

- **CRITICAL** → bloquea el commit
- **HIGH** → permite el commit con advertencia
- **MEDIUM/LOW** → pasa silenciosamente

```bash
# Para saltarlo en emergencia:
git commit --no-verify
```

## CLAUDE.md — Configuración por proyecto

Edita `CLAUDE.md` en la raíz de cada proyecto para:
- Definir el agente principal activo
- Especificar el stack del proyecto
- Establecer convenciones de código
- Agregar reglas específicas del proyecto

Claude Code lee este archivo automáticamente en cada sesión.

## Agentes disponibles

| Agente | Archivo | Integración principal |
|--------|---------|----------------------|
| FullStack Dev | `prompts/fullstack.md` | `CLAUDE.md` principal |
| Code Auditor | `prompts/auditor.md` | `/project:audit` + pipeline |
| Security Validator | `prompts/security.md` | pre-commit + pipeline |
| UX/UI Design | `prompts/ux-ui.md` | `/project:ux-spec` |
| Sales Strategy | `prompts/sales.md` | Claude Project separado |
| DevOps & CI/CD | `prompts/devops.md` | `/project:devops-check` |
| Database Architect | `prompts/database.md` | `/project:db-review` + pipeline |

## Requisitos

- [Claude Code CLI](https://claude.ai/code) instalado y autenticado
- `git` (para el pre-commit hook)
- bash 3.2+

---
*Vibe Coding Agent Pack v2.0*
