# SimOffice — Department Architecture
## Business Operations Layer

### Overview
SimOffice departments group agents, furniture, and CrewAI tools into functional
business units. Each department has prefab agents, furniture with pre-wired tools,
and task templates. Departments can be dropped into any office as prefab units.

---

## Department 1: Marketing & Social Media

### Agents
| Role | Name | Default Model | Responsibilities |
|------|------|---------------|------------------|
| Social Media Manager | Jordan Lee | claude-sonnet | Content strategy, posting schedule, engagement monitoring, comment replies |
| Content Creator | Maya Torres | gpt-4o | Post copywriting, image prompts, hashtag research, A/B variants |

### Furniture → CrewAI Tools
| Furniture | Tools | Composio Integration | Setup |
|-----------|-------|---------------------|-------|
| Social Station | ComposioTool (Facebook, YouTube, TikTok, Instagram) | `composio_crewai.ComposioProvider` | COMPOSIO_API_KEY + OAuth per platform |
| Content Desk | SerperDevTool, WebsiteSearchTool, ScrapeWebsiteTool | Built-in crewai-tools | SERPER_API_KEY |
| Analytics Screen | WebsiteSearchTool, CSVSearchTool | Built-in crewai-tools | None |

### Task Templates
- `Create social post` → Content Creator drafts → SM Manager reviews → post to platforms
- `Monitor engagement` → SM Manager checks comments/replies → responds or escalates
- `Weekly analytics` → Analytics Screen pulls metrics → SM Manager reports to CEO
- `Campaign launch` → Content Creator produces batch → SM Manager schedules → CFO tracks cost

### Event Chains
```
Content Creator writes post
  → SM Manager reviews and approves
    → Social Station posts to Facebook + YouTube + TikTok
      → SM Manager monitors comments (next cycle)
        → CEO reviews weekly analytics summary
```

---

## Department 2: Finance & Billing

### Agents
| Role | Name | Default Model | Responsibilities |
|------|------|---------------|------------------|
| Accounts Agent | Dana Kim | gpt-4o | Invoice tracking, payment scheduling, expense reports, bill reminders |

*Note: CFO (Priya Singh) oversees this department and reviews reports.*

### Furniture → CrewAI Tools
| Furniture | Tools | Composio Integration | Setup |
|-----------|-------|---------------------|-------|
| Billing Terminal | ComposioTool (QuickBooks, Stripe, PayPal) | `composio_crewai.ComposioProvider` | COMPOSIO_API_KEY + OAuth per service |
| Accounts Ledger | FileReadTool, CSVSearchTool, DirectoryReadTool | Built-in crewai-tools | workspace directory |

### Task Templates
- `Track invoices` → Accounts Agent reviews pending → flags overdue to CFO
- `Schedule payment` → Accounts Agent prepares → CFO approves → Billing Terminal executes
- `Monthly report` → Accounts Agent compiles from ledger → CFO reviews → CEO receives summary
- `Expense audit` → Accounts Agent scans recent transactions → flags anomalies

### Event Chains
```
Accounts Agent scans invoices
  → Flags overdue bills to CFO
    → CFO approves payment
      → Billing Terminal processes payment
        → Accounts Agent logs confirmation
          → CEO sees monthly summary
```

---

## Department 3: Operations & Scheduling

### Agents
| Role | Name | Default Model | Responsibilities |
|------|------|---------------|------------------|
| Scheduler | Robin Park | mistral-local | Calendar management, appointment setting, reminders, conflict resolution |

*Note: Admin (Sam Riley) coordinates with Scheduler on logistics.*

### Furniture → CrewAI Tools
| Furniture | Tools | Composio Integration | Setup |
|-----------|-------|---------------------|-------|
| Calendar Station | ComposioTool (Google Calendar, Outlook, Calendly) | `composio_crewai.ComposioProvider` | COMPOSIO_API_KEY + OAuth |
| Reception Desk | SerperDevTool, FileReadTool | Built-in crewai-tools | None |

### Task Templates
- `Set appointment` → Scheduler checks availability → creates event → sends invites
- `Daily briefing` → Scheduler compiles today's calendar → Admin distributes to team
- `Reschedule request` → Scheduler finds alternatives → confirms with participants
- `Weekly planning` → Scheduler reviews next week → flags conflicts → resolves

### Event Chains
```
User requests appointment
  → Scheduler checks Google Calendar
    → Creates event with attendees
      → Admin sends confirmation
        → Reminder fires 30 min before
```

---

## Cross-Cutting: Projects & Task Management

### How Projects Work
A **Project** groups related tasks across departments with:
- **Name**: e.g., "Q4 Product Launch"
- **Owner**: CEO or department lead
- **Tasks**: Ordered list with dependencies
- **Agents**: Assigned per task
- **Status**: Not Started → In Progress → Blocked → Complete
- **Timeline**: Start date, milestones, deadline

### Project Flow
```
CEO creates project "Q4 Product Launch"
  → Assigns tasks:
    1. Content Creator: "Create launch content" (Marketing)
    2. SM Manager: "Schedule social campaign" (Marketing, depends on 1)
    3. Accounts Agent: "Budget allocation" (Finance)
    4. Scheduler: "Set launch meeting" (Operations)
    5. CTO: "Verify product readiness" (Executive)
  → Each agent works their task
  → Dependencies auto-resolve (task 2 waits for task 1)
  → CEO monitors progress via observational loop
  → CFO tracks project cost
```

### CEO Observational Management
The CEO agent continuously:
1. Reviews all active agent outputs every N cycles
2. Checks project progress against milestones
3. Flags blockers or delays
4. Reassigns resources if needed
5. Generates management observations (only surfaces issues, stays silent when all is well)

---

## Full Agent Roster (All Departments)

| ID | Name | Role | Department | Default Model | Desk |
|----|------|------|------------|---------------|------|
| ceo | Alex Chen | CEO | Executive | claude-sonnet | (5,1) |
| cto | Marcus Webb | CTO | Executive | claude-opus | (8,1) |
| cfo | Priya Singh | CFO | Finance | gpt-4o | (5,4) |
| cio | James Torres | CIO | Infrastructure | llama-local | (8,4) |
| adm | Sam Riley | Admin | Operations | mistral-local | (1,4) |
| smm | Jordan Lee | Social Media Mgr | Marketing | claude-sonnet | TBD |
| crt | Maya Torres | Content Creator | Marketing | gpt-4o | TBD |
| acc | Dana Kim | Accounts Agent | Finance | gpt-4o | TBD |
| sch | Robin Park | Scheduler | Operations | mistral-local | TBD |

---

## Full Furniture Registry (All Types)

| ID | Label | Department | CrewAI Tools | Composio Apps |
|----|-------|------------|-------------|---------------|
| desk | Workstation | General | SerperDevTool, WebsiteSearchTool | — |
| srv | Server Rack | Infrastructure | CodeInterpreterTool | — |
| cab | Filing Cabinet | General | FileReadTool, DirectoryReadTool | — |
| prn | Printer | General | FileReadTool | — |
| tbl | Conference Table | General | (triggers multi-agent Crew) | — |
| social | Social Station | Marketing | ComposioTool | Facebook, YouTube, TikTok, Instagram |
| content | Content Desk | Marketing | SerperDevTool, ScrapeWebsiteTool | — |
| analytics | Analytics Screen | Marketing | WebsiteSearchTool, CSVSearchTool | — |
| billing | Billing Terminal | Finance | ComposioTool | QuickBooks, Stripe, PayPal |
| ledger | Accounts Ledger | Finance | FileReadTool, CSVSearchTool | — |
| calendar | Calendar Station | Operations | ComposioTool | Google Calendar, Outlook, Calendly |
| reception | Reception Desk | Operations | SerperDevTool, FileReadTool | — |
| phone | Phone | General | ComposioTool | Twilio, Slack |
| mail | Mailbox | General | ComposioTool | Gmail, Outlook |
| board | Whiteboard | General | DALLETool, RagTool | — |
| screen | Display Monitor | General | WebsiteSearchTool, YoutubeVideoSearchTool | — |

---

## Installation Flow (per furniture)

1. **Drop furniture** in Sandbox → appears with "Setup Needed" badge
2. **Click in Live mode** → panel shows requirements
3. **Enter API keys / OAuth** → furniture status changes to "Installed"
4. **Nearby agents auto-gain tools** → agent tool list updates dynamically
5. **Ready to use** → click triggers furniture-specific UI and actions

---

*LumenHelix Solutions · Christopher Gordon Phillips*
