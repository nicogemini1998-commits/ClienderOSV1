# Graph Report - /Volumes/BOB MEMORY/ClienderOSV1  (2026-04-28)

## Corpus Check
- 117 files · ~116,814 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 445 nodes · 571 edges · 31 communities detected
- Extraction: 87% EXTRACTED · 13% INFERRED · 0% AMBIGUOUS · INFERRED: 72 edges (avg confidence: 0.81)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_BOB AI Agents|BOB AI Agents]]
- [[_COMMUNITY_FastAPI Backend Routes|FastAPI Backend Routes]]
- [[_COMMUNITY_Studio Frontend React|Studio Frontend React]]
- [[_COMMUNITY_Project Docs & Brand|Project Docs & Brand]]
- [[_COMMUNITY_Orchestrator Workflow Engine|Orchestrator Workflow Engine]]
- [[_COMMUNITY_Studio Canvas Nodes|Studio Canvas Nodes]]
- [[_COMMUNITY_Lead Data Pipeline|Lead Data Pipeline]]
- [[_COMMUNITY_Dynamic Workflow Core|Dynamic Workflow Core]]
- [[_COMMUNITY_LeadUp Backend|LeadUp Backend]]
- [[_COMMUNITY_Orchestrator Canvas UI|Orchestrator Canvas UI]]
- [[_COMMUNITY_AI Creative Pipeline (Freepik)|AI Creative Pipeline (Freepik)]]
- [[_COMMUNITY_AI Image Spaces Gallery|AI Image Spaces Gallery]]
- [[_COMMUNITY_LeadUp Brand Identity|LeadUp Brand Identity]]
- [[_COMMUNITY_Company Modal Lead UI|Company Modal Lead UI]]
- [[_COMMUNITY_Workflow Node Types|Workflow Node Types]]
- [[_COMMUNITY_KIE AI Integration|KIE AI Integration]]
- [[_COMMUNITY_Automotive AI Photography|Automotive AI Photography]]
- [[_COMMUNITY_LeadUp CRM Profile Card|LeadUp CRM Profile Card]]
- [[_COMMUNITY_Studio App Branding|Studio App Branding]]
- [[_COMMUNITY_Client Picker UI|Client Picker UI]]
- [[_COMMUNITY_Editorial Image Canvas|Editorial Image Canvas]]
- [[_COMMUNITY_Nano Banana AI Node|Nano Banana AI Node]]
- [[_COMMUNITY_Krea AI Platform|Krea AI Platform]]
- [[_COMMUNITY_Dark Luxury AI Photography|Dark Luxury AI Photography]]
- [[_COMMUNITY_ClienderOS App Icons|ClienderOS App Icons]]
- [[_COMMUNITY_Styles Panel|Styles Panel]]
- [[_COMMUNITY_Config Settings|Config Settings]]
- [[_COMMUNITY_Company Card UI|Company Card UI]]
- [[_COMMUNITY_Veo3 Video Generation|Veo3 Video Generation]]
- [[_COMMUNITY_Source Code Docs|Source Code Docs]]
- [[_COMMUNITY_Download Guide|Download Guide]]

## God Nodes (most connected - your core abstractions)
1. `BOB-BRAIN` - 21 edges
2. `get_conn()` - 14 edges
3. `CLIENDER OS` - 14 edges
4. `useAuth()` - 13 edges
5. `executeWorkflow()` - 10 edges
6. `executeDynamicWorkflow()` - 9 edges
7. `fetch_and_store_leads()` - 9 edges
8. `Claude Haiku 4.5` - 9 edges
9. `CLIENDER — Sales Technology Consultancy` - 9 edges
10. `SharedNotebook` - 8 edges

## Surprising Connections (you probably didn't know these)
- `executeWorkflow()` --calls--> `onProgress()`  [INFERRED]
  core/bot/agentes/index.js → apps/studio/backend/server.js
- `Dark Glass Design System` --conceptually_related_to--> `LeadUp Color Palette (Tailwind)`  [INFERRED]
  docs/06_DOCUMENTO_FINAL_TODO_COMPLETADO.md → SPEC_DISEÑO_CLIENDEROSV1.md
- `Dark Glass Design System` --conceptually_related_to--> `Studio Color Palette (oklch)`  [INFERRED]
  docs/06_DOCUMENTO_FINAL_TODO_COMPLETADO.md → SPEC_DISEÑO_CLIENDEROSV1.md
- `Dark Glass Design System` --conceptually_related_to--> `CLIENDER Logo (Glassmorphism 3D)`  [INFERRED]
  docs/06_DOCUMENTO_FINAL_TODO_COMPLETADO.md → SPEC_DISEÑO_CLIENDEROSV1.md
- `LeadUp — B2B Prospecting CRM App` --conceptually_related_to--> `Lead Qualification — AI-powered Filtering and Nurturing`  [INFERRED]
  apps/leadup/frontend/index.html → BOB/que-es-cliender.md

## Hyperedges (group relationships)
- **Text → Image → Video Generation Pipeline** —  [EXTRACTED 0.95]
- **LeadUp Profile Card Components** —  [EXTRACTED 1.00]

## Communities

### Community 0 - "BOB AI Agents"
Cohesion: 0.09
Nodes (52): Content Strategist Agent, Kickoff Analyzer Agent, LeadExtractor Agent, Lead Research Agent, Meeting Analyzer Agent, NextStepsPlanner Agent, PainAnalyzer Agent, Proposal Generator Agent (+44 more)

### Community 1 - "FastAPI Backend Routes"
Cohesion: 0.06
Nodes (38): create_access_token(), decode_token(), get_current_user(), verify_password(), get_conn(), BaseModel, assign_now(), AssignNowRequest (+30 more)

### Community 2 - "Studio Frontend React"
Cohesion: 0.06
Nodes (16): AuthProvider(), useAuth(), useGallery(), Ajustes(), Analytics(), Dashboard(), Login(), LoginPage() (+8 more)

### Community 3 - "Project Docs & Brand"
Cohesion: 0.13
Nodes (24): BOB Memory — Business Operations Bot Profile, AI Integration — Practical IA Implementation in Sales, CLIENDER Brand Identity — Colors, Typography, Tagline, Lead Qualification — AI-powered Filtering and Nurturing, Sales Automation — WhatsApp, Email, CRM Flows, BOB — Business Operations Bot (AI Assistant), CLIENDER — Sales Technology Consultancy, CLIENDER TECH — Custom Software Development Line (+16 more)

### Community 4 - "Orchestrator Workflow Engine"
Cohesion: 0.19
Nodes (9): executeWorkflow(), leadExtractor(), nextStepsPlanner(), painAnalyzer(), parseJSON(), proposalWriter(), SharedNotebook, strategyMapper() (+1 more)

### Community 5 - "Studio Canvas Nodes"
Cohesion: 0.11
Nodes (9): CanvasToolbar(), useWorkflow(), FlowEdge(), AgentNode(), statusGlow(), DynamicInputNode(), statusGlow(), LeadInputNode() (+1 more)

### Community 6 - "Lead Data Pipeline"
Cohesion: 0.16
Nodes (17): _extract_mobile(), fetch_and_store_leads(), _fetch_apollo_people(), _get_assigned_company_ids_for_user(), _get_existing_apollo_ids(), _insert_company_and_contact(), _is_construction_related(), _is_spanish_mobile() (+9 more)

### Community 7 - "Dynamic Workflow Core"
Cohesion: 0.22
Nodes (5): executeDynamicWorkflow(), getClaude(), Notebook, parseJSON(), onProgress()

### Community 8 - "LeadUp Backend"
Cohesion: 0.15
Nodes (7): hash_password(), main(), Script de inicialización: inserta los usuarios iniciales en la base de datos. Ej, init_db(), lifespan(), main(), Inserta 10 leads ficticios para hoy en la base de datos. Asignados al usuario 1

### Community 9 - "Orchestrator Canvas UI"
Cohesion: 0.17
Nodes (4): OrchestratorCanvas(), useTemplates(), useWorkflowSocket(), TemplatesPanel()

### Community 10 - "AI Creative Pipeline (Freepik)"
Cohesion: 0.29
Nodes (12): AI Creative Workflow — Text to Image to Video Pipeline, Assistant Node — Expanded Prompt Generator, Creation Node — Generated Image Panel, Freepik AI Suite, Image Generator Node — AI Image Output, New Flow — AI Creative Workflow Canvas, Node Graph UI — Visual Flow Builder, Freepik AI Suite — New Flow Screenshot (+4 more)

### Community 11 - "AI Image Spaces Gallery"
Cohesion: 0.31
Nodes (9): Chill Bunny Vibes Collection Space, Cinematic Zoom Out Scene Prompt, Generated AI Images (Silhouette at Sunset), AI Image Generation Workflow UI Screenshot, AI Image Generation Prompt Workflow (Node Graph), Personal Project Workspace, Silhouette Figure Double-Exposure Prompt, Spaces Dashboard UI (+1 more)

### Community 12 - "LeadUp Brand Identity"
Cohesion: 0.28
Nodes (9): LeadUp Application, LeadUp App Logo, Deep Dark Background Color, Neon Purple Brand Color, Text-Free Logomark (Symbol Only), Rounded Square App Icon Shape, Glassmorphism / Frosted Glass Container, Neon Glow Visual Style (+1 more)

### Community 13 - "Company Modal Lead UI"
Cohesion: 0.32
Nodes (3): buildOpportunities(), CompanyModal(), scoreColor()

### Community 14 - "Workflow Node Types"
Cohesion: 0.25
Nodes (8): Image Generator Node Type, Image Upscaler Node Type, Music Generator Node Type, Node Picker Command Palette, Sound Effects Node Type (New), Video Generator Node Type, Voiceover Node Type (New), Node-based AI Workflow Canvas

### Community 16 - "KIE AI Integration"
Cohesion: 0.43
Nodes (5): getClaude(), kieRecordInfo(), pollUntilDone(), runShaqAgent(), sleep()

### Community 17 - "Automotive AI Photography"
Cohesion: 0.29
Nodes (7): 4K Resolution 4:5 Output Settings, Editorial Automotive Photography Prompt, HOK Photography Style, Krea 1 Model, Krea AI Image Generation Interface, Pagani Huayra Roadster BC Subject, Italian Renaissance Villa Garden Scene

### Community 18 - "LeadUp CRM Profile Card"
Cohesion: 0.48
Nodes (7): Decision Makers — Samuel Hernández, Cristina Vilches, Pedro López Ruiz, Ecosistema Digital — Diagnóstico, Oportunidades HBD Revolution, Lead Score 71/100 — Posible, LeadUp — Lead Intelligence UI, Vilches Abogados — Law Firm Entity, Vilches Abogados — LeadUp Profile Card

### Community 19 - "Studio App Branding"
Cohesion: 0.48
Nodes (7): Studio App Logo, Studio App Brand Identity, Deep Purple and Black Color Palette, 3D Extruded Glossy Surface Depth Effect, Rounded Square App Icon Shape, Neon S-Curve Letterform Symbol, Neon Glow Glassmorphism Dark Luxury Style

### Community 21 - "Client Picker UI"
Cohesion: 0.33
Nodes (2): useClients(), ClientPicker()

### Community 22 - "Editorial Image Canvas"
Cohesion: 0.4
Nodes (6): Node-based AI Image Canvas, Editorial Image Generation Style, Generated Image Variants (3), Generador de Imágenes Node, Reference Image Input (Cubicle Office), Text Prompt Node

### Community 23 - "Nano Banana AI Node"
Cohesion: 0.33
Nodes (6): AI Image Generation, Nano Banana 2 AI Image Node, Prompt Input Field, Imagen de Referencia Upload, Estilo Style Selector, Workflow Editor UI (n8n style)

### Community 24 - "Krea AI Platform"
Cohesion: 0.33
Nodes (6): Credit Unit Cost (6 CU), Generated Mountain Sunset Image, Krea 1 Model, Krea AI Image Generation Node, Sunset Ocean Prompt (Spanish), Node-based AI Workflow UI

### Community 25 - "Dark Luxury AI Photography"
Cohesion: 0.33
Nodes (6): Assistant Node with Photo Prompt, AI Image Pipeline Canvas (Dark Luxury), Creation Node with Reference Image, Dark Luxury Photography Style, Image Generator Output Node, Whisky Decanter Product Photography

### Community 26 - "ClienderOS App Icons"
Cohesion: 0.4
Nodes (6): App Icon Design Asset, App Icon — Neon Purple Zigzag on Dark Background, ClienderOS Brand Identity, Dark Luxury Palette — Black + Vivid Purple, Neon Glow Visual Style, Zigzag S-Shape Logo Symbol

### Community 28 - "Styles Panel"
Cohesion: 0.4
Nodes (2): useStyles(), StylesPanel()

### Community 29 - "Config Settings"
Cohesion: 0.5
Nodes (4): Config, get_settings(), Settings, BaseSettings

### Community 30 - "Company Card UI"
Cohesion: 0.67
Nodes (2): CompanyCard(), scoreColor()

### Community 33 - "Veo3 Video Generation"
Cohesion: 1.0
Nodes (3): AI Video Generation — Concept, Veo3 Fast — Video Generation Node UI, Workflow Node Editor (n8n-style)

### Community 56 - "Source Code Docs"
Cohesion: 1.0
Nodes (1): Códigos Fuente Completos

### Community 57 - "Download Guide"
Cohesion: 1.0
Nodes (1): Guía de Descargas

## Knowledge Gaps
- **67 isolated node(s):** `Config`, `Script de inicialización: inserta los usuarios iniciales en la base de datos. Ej`, `Inserta 10 leads ficticios para hoy en la base de datos. Asignados al usuario 1`, `Update notes for a lead assignment.`, `Get notes for a lead assignment.` (+62 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Client Picker UI`** (6 nodes): `ClientPicker.jsx`, `useClients.js`, `useClients()`, `Avatar()`, `ClientPicker()`, `NewClientForm()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Styles Panel`** (5 nodes): `StylesPanel.jsx`, `useStyles.js`, `useStyles()`, `StyleCard()`, `StylesPanel()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Company Card UI`** (4 nodes): `CompanyCard.jsx`, `CompanyCard()`, `PhoneIcon()`, `scoreColor()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Source Code Docs`** (1 nodes): `Códigos Fuente Completos`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Download Guide`** (1 nodes): `Guía de Descargas`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `get_conn()` connect `FastAPI Backend Routes` to `LeadUp Backend`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `assign_leads_for_user()` connect `FastAPI Backend Routes` to `Lead Data Pipeline`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `fetch_and_store_leads()` connect `Lead Data Pipeline` to `FastAPI Backend Routes`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 13 inferred relationships involving `get_conn()` (e.g. with `get_current_user()` and `login()`) actually correct?**
  _`get_conn()` has 13 INFERRED edges - model-reasoned connections that need verification._
- **Are the 11 inferred relationships involving `useAuth()` (e.g. with `AppInner()` and `ContentStudioCanvas()`) actually correct?**
  _`useAuth()` has 11 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Config`, `Script de inicialización: inserta los usuarios iniciales en la base de datos. Ej`, `Inserta 10 leads ficticios para hoy en la base de datos. Asignados al usuario 1` to the rest of the system?**
  _67 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `BOB AI Agents` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._