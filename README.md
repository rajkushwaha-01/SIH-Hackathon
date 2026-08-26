# 🛡️ AI/NLP Engine to Detect Serious Injury & Fatality (SIF) Precursors
## SIH 2026 — PS 26165: Enterprise Safety Intelligence Backend MVP

[![Smart India Hackathon 2026](https://img.shields.io/badge/SIH-2026_PS_26165-FF6F00?style=for-the-badge&logo=target&logoColor=white)](#)
[![Node.js ES Modules](https://img.shields.io/badge/Node.js-v20+_ESM-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![Google Gemini 1.5](https://img.shields.io/badge/AI-Google_Gemini_1.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](#)
[![Pinecone Vector DB](https://img.shields.io/badge/Vector_DB-Pinecone_768d-000000?style=for-the-badge&logo=pinecone&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Tests Passing](https://img.shields.io/badge/Tests-172%2F172_Passed-success?style=for-the-badge&logo=vitest&logoColor=white)](#)
[![Zero CommonJS](https://img.shields.io/badge/Codebase-100%25_ES_Modules-blueviolet?style=for-the-badge)](#)

---

## 1. Executive Summary & Problem Overview

In high-hazard industries (oil & gas, construction, manufacturing, chemical processing, mining), thousands of low-consequence or near-miss safety observations are reported annually. Traditional HSE systems treat these reports uniformly or rely on manual review, often missing **Serious Injury and Fatality (SIF) Precursors**—the specific high-energy hazards and failed/missing critical controls that, under slightly altered circumstances, would have resulted in a life-altering injury or fatality.

**PS 26165 Goal**: Build a complete, enterprise-grade, explainable AI/NLP Backend MVP that ingests unstructured multi-format reports (PDF, CSV, TXT, text), normalizes them, extracts safety entities, classifies SIF potential, detects precursors, maps to official IOGP Life-Saving Rules, calculates deterministic explainable risk scores, indexes vector embeddings in Pinecone, and powers three unified "WOW" capabilities:
1. **SIF Precursor Causal Graph** (Interactive evidence-backed causal relationship network)
2. **What-If Risk Simulator** (Deterministic barrier & control mitigation counterfactual engine)
3. **Evidence-Grounded HSE Copilot** (Strictly grounded RAG assistant with anti-hallucination citations)

```mermaid
flowchart TD
    subgraph Ingestion ["Ingestion & Normalization Layer"]
        A[Unstructured Reports: PDF / CSV / TXT / Text] --> B[Parser & Format Normalizer]
        B --> C[Duplicate & Hash Detection]
        C --> D[(MongoDB: Canonical Safety Reports)]
    end

    subgraph AI_Pipeline ["AI & NLP Intelligence Layer"]
        D --> E[Async Analysis Pipeline]
        E --> F[Gemini Semantic Extraction & NER]
        F --> G[Zod Structured Output Validation]
        G --> H[SIF Potential Classifier & Confidence]
        G --> I[Precursor & Barrier Failure Detector]
        G --> J[IOGP Life-Saving Rules Mapper]
    end

    subgraph Deterministic_Engine ["Deterministic Risk & Evidence Layer"]
        H & I & J --> K[Deterministic Risk Scoring Engine]
        K --> L[Evidence & Provenance Tracking Layer]
        L --> M[Chunking & Embedding Generation]
        M --> N[(Pinecone Vector DB)]
        L --> O[(MongoDB: Structured Intelligence)]
    end

    subgraph Core_Applications ["Unified WOW Features & Analytics"]
        O & N --> P[Semantic & Similar Incident Search]
        O & N --> Q[Recurring Pattern Aggregator]
        O & N --> R[WOW 1: SIF Precursor Causal Graph]
        O & N --> S[WOW 2: What-If Risk Simulator]
        O & N --> T[WOW 3: Evidence-Grounded HSE Copilot]
        O --> U[Executive Dashboard & Smart Alerts]
        O --> V[Human Review & Immutable Audit Trail]
    end
```

---

## 2. Clean Layered Architecture & Module Boundaries

The backend resides in `Backend/` using **100% ES Modules (`"type": "module"`)** and a strict layered architecture:

```
Backend/
├── package.json                         # Scripts, dependencies, type: module
├── README.md                            # Comprehensive technical documentation
├── .env.example                         # Environment configuration template
├── .gitignore                           # Git ignore rules
├── Dockerfile                           # Production container definition
├── vitest.config.js                     # Vitest test runner configuration
│
├── src/
│   ├── server.js                        # HTTP Server bootstrap & graceful shutdown
│   ├── app.js                           # Express application & middleware assembly
│   │
│   ├── config/
│   │   ├── env.js                       # Zod-validated environment config
│   │   ├── database.js                  # Mongoose connection & pool tuning
│   │   ├── ai.js                        # Google Gemini Client configuration
│   │   └── vector.js                    # Pinecone Index client & namespace config
│   │
│   ├── constants/
│   │   ├── report.constants.js          # Report types (UA, UC, NEAR_MISS, INCIDENT)
│   │   ├── sif.constants.js             # SIF_POTENTIAL, NON_SIF, NEEDS_REVIEW
│   │   ├── precursor.constants.js       # Precursor Taxonomy (14 standard categories)
│   │   ├── severity.constants.js        # Severity scales & actual vs potential outcomes
│   │   ├── priority.constants.js        # CRITICAL, HIGH, MEDIUM, LOW priority definitions
│   │   ├── review.constants.js          # Human review action enums & status
│   │   └── lifeSavingRules.constants.js # IOGP Official Life-Saving Rules reference
│   │
│   ├── models/
│   │   ├── User.js                      # Authentication & RBAC (Admin, HSE Officer, Reviewer)
│   │   ├── SafetyReport.js              # Canonical raw & normalized report record
│   │   ├── Analysis.js                  # Versioned AI NLP extraction & intelligence output
│   │   ├── DocumentChunk.js             # Semantic text chunks for embeddings & Pinecone
│   │   ├── LifeSavingRule.js            # Official IOGP rule knowledge base
│   │   ├── Pattern.js                   # Recurring multidimensional pattern clusters
│   │   ├── CausalGraph.js               # SIF Precursor Causal Graph topology & high-risk pathways
│   │   ├── Simulation.js                # Counterfactual What-If risk simulation snapshots
│   │   ├── CopilotSession.js            # Evidence-grounded multi-turn conversational memory
│   │   ├── Alert.js                     # Smart prioritised safety alerts & deduplication
│   │   └── AuditTrail.js                # Immutable audit trail of all AI & human actions
│   │
│   ├── controllers/
│   │   ├── auth.controller.js           # Registration, login, profile queries
│   │   ├── report.controller.js         # Report CRUD, file ingestion
│   │   ├── analysis.controller.js       # Asynchronous & synchronous analysis triggers
│   │   ├── precursor.controller.js      # 14-Category precursor definitions & analytics
│   │   ├── lifeSavingRule.controller.js # Official IOGP rule queries
│   │   ├── search.controller.js         # Semantic search & similar incident retrieval
│   │   ├── pattern.controller.js        # Multidimensional recurring pattern miner
│   │   ├── graph.controller.js          # Causal graph node & edge generator (WOW #1)
│   │   ├── simulator.controller.js      # What-If counterfactual scenario engine (WOW #2)
│   │   ├── copilot.controller.js        # Evidence-grounded conversational agent (WOW #3)
│   │   ├── analytics.controller.js      # Executive dashboard KPIs & trend analytics
│   │   ├── alert.controller.js          # Smart alert management & lifecycle
│   │   ├── review.controller.js         # Human-in-the-loop review overrides & audit trail
│   │   └── health.controller.js         # System health & connectivity checks
│   │
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── report.routes.js
│   │   ├── analysis.routes.js
│   │   ├── precursor.routes.js
│   │   ├── lifeSavingRule.routes.js
│   │   ├── search.routes.js
│   │   ├── pattern.routes.js
│   │   ├── graph.routes.js
│   │   ├── simulator.routes.js
│   │   ├── copilot.routes.js
│   │   ├── analytics.routes.js
│   │   ├── alert.routes.js
│   │   └── health.routes.js
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js           # JWT authentication & extraction
│   │   ├── role.middleware.js           # Role-based authorization (RBAC)
│   │   ├── validation.middleware.js     # Generic Zod request schema validator
│   │   ├── upload.middleware.js         # Multer configuration with MIME verification
│   │   ├── rateLimiter.middleware.js    # Express rate limiting
│   │   ├── errorHandler.middleware.js   # Centralized error handler & status mapping
│   │   └── requestLogger.middleware.js  # Structured request/response logging
│   │
│   ├── validators/
│   │   ├── auth.validator.js
│   │   ├── report.validator.js
│   │   ├── precursor.validator.js
│   │   ├── sif.validator.js
│   │   ├── simulation.validator.js
│   │   └── review.validator.js
│   │
│   ├── services/
│   │   ├── ingestion/
│   │   │   ├── TextParser.js
│   │   │   ├── PdfParser.js
│   │   │   ├── CsvParser.js
│   │   │   ├── NormalizationService.js
│   │   │   └── DuplicateDetectionService.js
│   │   ├── ai/
│   │   │   └── GeminiService.js         # Core Gemini invocation with retry & JSON repair
│   │   ├── nlp/
│   │   │   ├── ExtractionService.js     # Entity, barrier & hazard extraction
│   │   │   └── ChunkingService.js       # Sliding-window semantic chunking
│   │   ├── sif/
│   │   │   └── SifClassifierService.js  # SIF potential & confidence assessment
│   │   ├── precursor/
│   │   │   └── PrecursorService.js      # Precursor detection & barrier mapping
│   │   ├── barrier/
│   │   │   └── BarrierService.js        # Hierarchy of controls & barrier status
│   │   ├── lifeSavingRules/
│   │   │   └── LifeSavingRulesService.js# Deterministic IOGP mapping
│   │   ├── risk/
│   │   │   └── RiskScoringEngine.js     # Deterministic reproducible risk scoring
│   │   ├── embeddings/
│   │   │   └── EmbeddingService.js      # 768-dim text-embedding-004 + fallback vectorizer
│   │   ├── vector/
│   │   │   ├── PineconeService.js       # Pinecone CRUD & vector queries
│   │   │   └── VectorSearchService.js   # Similarity & metadata-filtered search
│   │   ├── rag/
│   │   │   └── RagContextBuilder.js     # Grounded context compiler with citations
│   │   ├── pattern/
│   │   │   └── PatternDetectionService.js# Multi-factor cluster miner & trend analytics
│   │   ├── graph/
│   │   │   └── CausalGraphService.js    # Causal graph node & edge generator (WOW #1)
│   │   ├── simulator/
│   │   │   └── WhatIfSimulatorService.js# What-If counterfactual scenario engine (WOW #2)
│   │   ├── copilot/
│   │   │   └── HseCopilotService.js     # Evidence-grounded conversational agent (WOW #3)
│   │   ├── analytics/
│   │   │   └── AnalyticsService.js      # Executive dashboard KPIs & trend analytics
│   │   ├── alerts/
│   │   │   └── AlertService.js          # Deterministic priority engine & alert generator
│   │   ├── notification/
│   │   │   └── NotificationService.js   # Multi-channel alert dispatching
│   │   └── review/
│   │       └── ReviewService.js         # Human-in-the-loop review workflow
│   │
│   ├── prompts/
│   │   ├── reportExtraction.prompt.js
│   │   ├── sifClassification.prompt.js
│   │   ├── precursorDetection.prompt.js
│   │   └── copilot.prompt.js
│   │
│   └── utils/
│       ├── logger.js                    # Structured Winston/Pino style logging
│       ├── hash.js                      # SHA-256 content hashing & ID generator
│       ├── apiResponse.js               # Standard { success, data, error } envelopes
│       └── appError.js                  # Custom domain error class
│
├── scripts/
│   └── seed/
│       ├── seedIOGPRules.js             # Official IOGP Life-Saving Rules dataset
│       └── masterSeed.js                # Master seed: Users, 9 IOGP Rules, 25+ Incidents
│
└── tests/
    ├── fixtures/
    │   ├── sample_reports.json
    │   └── sif_cases.json
    ├── unit/                            # Unit tests for all scoring & parsing algorithms
    └── integration/                     # Supertest API tests for all endpoints
```

---

## 3. MongoDB vs Pinecone Responsibility & Data Division

### 3.1 Division of Responsibility
- **MongoDB (Canonical Source of Truth)**: Holds all business entities, user accounts, raw files, normalized reports, full AI extractions, deterministic risk calculations, versioned analyses, human review overrides, and immutable audit trails. The system is 100% functional for core reporting even if Pinecone is offline.
- **Pinecone (Vector Retrieval & Similarity Engine)**: Indexes document chunk embeddings along with rich structured metadata for semantic search, similar incident clustering, and grounded RAG context retrieval.

### 3.2 Canonical Data Entities
- **SafetyReport**: Canonical storage of ingested reports, original raw content, normalized metadata (site, activity, event date), SHA-256 deduplication hashes, ingestion status, and review state.
- **Analysis**: Versioned safety intelligence output containing extracted hazards, energy sources, safety barriers with hierarchy classifications, SIF potential determinations with confidence ratings, precursor classifications, IOGP rule mappings, deterministic risk scores ($0-100$), and human review flags.
- **DocumentChunk**: Paragraph and sliding-window semantic text chunks linked to parent reports, token counts, metadata tags, and vector index sync states.
- **LifeSavingRule**: Official IOGP Report 459 rule definitions, mandatory control requirements, and precursor mappings.
- **Pattern**: Multi-dimensional recurring failure clusters across site, activity, precursor, and failed barrier dimensions.
- **CausalGraph**: Heterogeneous graph snapshots containing connected nodes, weighted relationship edges, and ranked high-risk failure pathways.
- **Simulation**: Counterfactual What-If scenario comparisons capturing baseline vs. simulated states, $\Delta\text{Score}$ differences, and mitigation efficacy percentages.
- **CopilotSession**: Multi-turn conversational memory, user queries, assistant responses, and verified bracket citations.
- **Alert**: Smart prioritised safety alerts triggered by critical SIF emergence or multiple precursor convergence with 24-hour suppression deduplication.
- **AuditTrail**: Immutable audit logs capturing all AI analysis completions, human review approvals, and versioned overrides with mandatory justifications.

---

## 4. AI / NLP Pipeline & Evidence Provenance Architecture

```mermaid
sequenceDiagram
    autonumber
    participant Client
    participant ReportCtrl as ReportController
    participant ExtractionSvc as ExtractionService
    participant Gemini as GeminiService
    participant Zod as ZodValidator
    participant DetEng as DeterministicRiskEngine
    participant ChunkSvc as Chunking & Embedding
    participant Pinecone as PineconeService
    participant MongoDB as MongoDB

    Client->>ReportCtrl: POST /api/reports (Raw Report)
    ReportCtrl->>MongoDB: Save SafetyReport (status: INGESTED)
    ReportCtrl-->>Client: 201 Created { reportId, status: "INGESTED" }

    Client->>ReportCtrl: POST /api/reports/:id/analyze
    ReportCtrl->>ExtractionSvc: Process Report Extraction
    ExtractionSvc->>Gemini: Request Structured NER & Barrier Extraction
    Gemini-->>ExtractionSvc: Raw JSON Response
    ExtractionSvc->>Zod: Validate Extraction against ZodSchema
    Zod-->>ExtractionSvc: Validated Extraction Object
    
    ExtractionSvc->>Gemini: Classify SIF Potential & Precursors with Evidence Text
    Gemini-->>ExtractionSvc: Raw JSON Response
    ExtractionSvc->>Zod: Validate Classification against SifSchema
    Zod-->>ExtractionSvc: Validated Classification Object

    ExtractionSvc->>DetEng: Compute Deterministic Risk Score (0-100)
    DetEng-->>ExtractionSvc: Deterministic Score (e.g., 84, HIGH)

    ExtractionSvc->>MongoDB: Save Versioned Analysis Record
    ExtractionSvc->>ChunkSvc: Create Document Chunks & Generate Embeddings
    ChunkSvc->>Pinecone: Upsert 768-Dim Vectors with Rich Metadata Filter Tags
    Pinecone-->>ChunkSvc: Upsert OK
    ExtractionSvc->>MongoDB: Update SafetyReport status: "ANALYZED", vectorStatus: "COMPLETED"
    ExtractionSvc-->>ReportCtrl: Complete Analysis Intelligence
    ReportCtrl-->>Client: 200 OK { report, analysis }
```

### 4.1 Strict Distinction: Model Confidence vs Scenario Risk Score
- **Model Confidence (0.0 to 1.0 / 0% to 100%)**: Indicates the LLM's certainty that a report matches the definition of a SIF Precursor or SIF Potential event based on textual evidence.
- **Scenario Risk Score (0 to 100)**: Calculated by our deterministic algorithmic scoring engine based on:
  1. Base Hazard Weight (e.g., High Voltage: +30, Fall > 2m: +30)
  2. Failed/Missing Critical Barriers (+15 to +25 each)
  3. Precursor Multiplier (1.2x for active Line-of-Fire / Energy exposure)
  4. Mitigating Controls Present (-10 to -20)
  *Gemini NEVER fabricates or computes this final risk score.*

---

## 5. Pinecone Vector DB & RAG Architecture

### 5.1 Pinecone Index Specification
- **Index Name**: `safety-reports-v1`
- **Dimension**: `768` (dense vectors generated by Google `text-embedding-004` or semantic n-gram vectorizer)
- **Metric**: `cosine`
- **Namespace**: `safety-reports-v1`

### 5.2 Metadata Payload on Vectors
```json
{
  "reportId": "INC-2026-001",
  "chunkId": "chunk_INC-2026-001_01",
  "site": "Offshore Platform Alpha",
  "activity": "Scaffold Maintenance",
  "precursors": ["WORKING_AT_HEIGHT", "DROPPED_OBJECTS"],
  "sifStatus": "SIF_POTENTIAL",
  "severity": "CRITICAL",
  "riskScore": 84,
  "date": 1768348800000,
  "textSnippet": "Technician unhooked harness lanyard at 9m elevation without secondary tie-off..."
}
```

### 5.3 Semantic Search & Hybrid Retrieval Pipeline
```mermaid
flowchart LR
    Q[User Query / Incident Text] --> E[Embedding Service]
    E --> VQ[Query Vector: 768d]
    VQ --> P[Pinecone Vector Query + Metadata Filters]
    P --> Hits[Top-K Chunk Matches & Cosine Scores]
    Hits --> M[MongoDB Canonical Hydration]
    M --> Out[Enriched Incidents with Evidence Citations]
```

---

## 6. Three Flagship "WOW" Architectural Features

```mermaid
graph TD
    subgraph Data_Layer ["Shared Canonical Safety Intelligence"]
        R[Safety Reports] --> A[Analyses & Precursors]
        A --> B[Barrier Failures]
        A --> E[Evidence Layer]
    end

    subgraph WOW_1 ["WOW #1: SIF Precursor Causal Graph"]
        A & B --> G1[Activity Node]
        G1 --> G2[Hazard Node]
        G2 --> G3[Barrier Failure Edge]
        G3 --> G4[Precursor Node]
        G4 --> G5[SIF Potential Node]
    end

    subgraph WOW_2 ["WOW #2: What-If Risk Simulator"]
        A & B --> S1[Baseline Incident State: Score 84]
        S2[User Toggles Added/Restored Controls] --> S3[Deterministic Counterfactual Engine]
        S1 & S3 --> S4[Simulated Outcome: Score 28, Delta -56]
    end

    subgraph WOW_3 ["WOW #3: Evidence-Grounded HSE Copilot"]
        UserQ[HSE Query] --> RAG[Pinecone Vector Retrieval + MongoDB Stats]
        RAG --> Context[Strict Grounded Context Builder]
        Context --> LLM[Gemini Structured Copilot]
        LLM --> CitedAns[Answer + Exact Report & LSR Citations]
    end
```

### 6.1 WOW #1: SIF Precursor Causal Graph Engine
- **Endpoints**: `GET /api/graph`, `GET /api/graph/pathways`, `GET /api/graph/precursor/:type`
- **Node Types**: `ACTIVITY`, `ENERGY_SOURCE`, `UNSAFE_ACT`, `PRECURSOR`, `BARRIER`, `LIFE_SAVING_RULE`, `CONSEQUENCE`, `EVENT`
- **Edge Types**: `CAUSES`, `FAILS`, `VIOLATES`, `LEADS_TO`, `ASSOCIATED_WITH`
- **Data Integrity**: Every edge contains `weight` (co-occurrence frequency), transition probabilities, and supporting incident IDs.
- **Cytoscape & D3 Payload**: Formats full graph structures directly into `{ nodes: [...], edges: [...] }` visualization elements.

### 6.2 WOW #2: What-If Risk Simulator (Scenario Counterfactual Engine)
- **Endpoints**: `POST /api/simulator/simulate`, `POST /api/simulator/compare`, `GET /api/simulator`
- **Mechanism**:
  1. Ingests a baseline incident or custom scenario (e.g. Risk Score: 84, Dominant Factor: "Isolation Failure")
  2. Accepts modified barrier statuses (`PRESENT_EFFECTIVE`, `DEGRADED`, `FAILED`, `MISSING`), precursor adjustments, and energy control actions.
  3. Re-evaluates risk through deterministic mathematical scoring:
     $$\text{Score}_{\text{simulated}} = \max\left(0, \min\left(100, \text{Base} + S_{\text{SIF}} + P_{\text{Precursors}} + E_{\text{Energy}} + B_{\text{Barrier Penalty}} - B_{\text{Barrier Credit}}\right)\right)$$
  4. Returns `baseline`, `simulated`, `delta` ($\Delta\text{Score}$), `mitigationEfficacy` ($\%$), and an explainable technical narrative.

### 6.3 WOW #3: Evidence-Grounded HSE Copilot
- **Endpoints**: `POST /api/copilot/chat`, `POST /api/copilot/chat/stream`, `POST /api/copilot/sessions`
- **Anti-Hallucination Protocol**:
  1. Retrieves top-4 most relevant incident chunks from Pinecone vector index.
  2. Injects verified canonical facts and IOGP Life-Saving Rules into strict low-temperature prompt.
  3. Enforces bracket notation citations: `[Report ID: INC-2026-001]` and `[IOGP Rule: Energy Isolation]`.
  4. Automatically extracts and validates citations in structured response metadata.
  5. Supports real-time token streaming via Server-Sent Events (SSE) for responsive conversational UX.

---

## 7. Complete REST API Specification

| HTTP Method | Route | Description | Auth Required | Roles Allowed |
|:---|:---|:---|:---:|:---|
| **Auth** | | | | |
| `POST` | `/api/auth/register` | Register new user account | Public | Public |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | Public | Public |
| `GET` | `/api/auth/me` | Retrieve active authenticated profile | Bearer Token | All Roles |
| **Reports** | | | | |
| `POST` | `/api/reports` | Ingest manual structured/plain text report | Bearer Token | All Roles |
| `POST` | `/api/reports/upload` | Multipart file upload (`.pdf`, `.csv`, `.txt`) | Bearer Token | All Roles |
| `GET` | `/api/reports` | Query safety reports with filters & pagination | Bearer Token | All Roles |
| `GET` | `/api/reports/:id` | Get report summary by ID | Bearer Token | All Roles |
| `GET` | `/api/reports/:id/detail` | **Unified 360° Detail Payload** (Analysis, Audit, Alerts) | Bearer Token | All Roles |
| `POST` | `/api/reports/:id/review` | **Human-in-the-Loop Review** (`APPROVE`, `REJECT`, `OVERRIDE`)| Bearer Token | `ADMIN`, `HSE_OFFICER`, `REVIEWER` |
| `GET` | `/api/reports/:id/audit-trail`| Chronological audit log for incident | Bearer Token | All Roles |
| `DELETE`| `/api/reports/:id` | Delete safety report | Bearer Token | `ADMIN` |
| **Analysis** | | | | |
| `POST` | `/api/reports/:id/analyze` | Trigger async/sync NLP analysis | Bearer Token | `ADMIN`, `HSE_OFFICER` |
| `POST` | `/api/reports/:id/reanalyze`| Force re-analysis with version increment | Bearer Token | `ADMIN`, `HSE_OFFICER` |
| `GET` | `/api/analysis/:reportId` | Get versioned analysis intelligence | Bearer Token | All Roles |
| `GET` | `/api/analysis/jobs/:jobId`| Get background analysis job state | Bearer Token | All Roles |
| **Precursors & LSR** | | | | |
| `GET` | `/api/precursors` | List all 14 precursor taxonomy definitions | Bearer Token | All Roles |
| `GET` | `/api/precursors/:type` | Get precursor analytics and report counts | Bearer Token | All Roles |
| `GET` | `/api/life-saving-rules` | Get official IOGP Life-Saving Rules KB | Bearer Token | All Roles |
| `GET` | `/api/life-saving-rules/:id`| Get specific IOGP rule requirements | Bearer Token | All Roles |
| **Vector & Similarity**| | | | |
| `GET` | `/api/reports/:id/similar` | Find semantically similar incidents via Pinecone | Bearer Token | All Roles |
| `POST` | `/api/search/semantic` | Free-text semantic incident search | Bearer Token | All Roles |
| **Patterns & Graph** | | | | |
| `GET` | `/api/patterns` | List recurring multi-factor incident clusters | Bearer Token | All Roles |
| `POST` | `/api/patterns/detect` | Trigger manual multi-dimensional pattern mining | Bearer Token | `ADMIN`, `HSE_OFFICER` |
| `GET` | `/api/patterns/:id` | Get pattern details and sample incidents | Bearer Token | All Roles |
| `PATCH` | `/api/patterns/:id/status`| Update pattern status (`ACTIVE`, `MITIGATED`) | Bearer Token | `ADMIN`, `HSE_OFFICER` |
| `GET` | `/api/graph` | WOW #1: Full SIF Precursor Causal Graph | Bearer Token | All Roles |
| `GET` | `/api/graph/pathways` | WOW #1: Ranked high-risk failure pathways | Bearer Token | All Roles |
| `GET` | `/api/graph/precursor/:type`| WOW #1: Precursor-specific subgraph | Bearer Token | All Roles |
| `GET` | `/api/graph/report/:id` | WOW #1: Incident-specific causal graph | Bearer Token | All Roles |
| **Simulator & Copilot**| | | | |
| `POST` | `/api/simulator/simulate`| WOW #2: Counterfactual What-If risk simulation | Bearer Token | All Roles |
| `GET` | `/api/simulator` | WOW #2: Simulation history snapshots | Bearer Token | All Roles |
| `POST` | `/api/simulator/compare` | WOW #2: Multi-scenario comparison matrix | Bearer Token | All Roles |
| `POST` | `/api/copilot/chat` | WOW #3: Evidence-Grounded HSE Copilot conversation | Bearer Token | All Roles |
| `POST` | `/api/copilot/chat/stream`| WOW #3: Real-time Server-Sent Events (SSE) streaming | Bearer Token | All Roles |
| `POST` | `/api/copilot/sessions` | WOW #3: Create scoped investigation session | Bearer Token | All Roles |
| `GET` | `/api/copilot/sessions` | WOW #3: List user conversation sessions | Bearer Token | All Roles |
| **Dashboard & Alerts** | | | | |
| `GET` | `/api/analytics/dashboard`| Unified Executive Dashboard Payload | Bearer Token | All Roles |
| `GET` | `/api/analytics/kpis` | High-level KPI summary cards | Bearer Token | All Roles |
| `GET` | `/api/analytics/by-site` | SIF rate and risk distribution by facility | Bearer Token | All Roles |
| `GET` | `/api/analytics/by-precursor`| Distribution of occurrences by precursor | Bearer Token | All Roles |
| `GET` | `/api/analytics/trends` | Time-series monthly incident trends | Bearer Token | All Roles |
| `GET` | `/api/analytics/barriers` | Barrier health resilience score & top failures | Bearer Token | All Roles |
| `GET` | `/api/alerts` | List active safety alerts with filters | Bearer Token | All Roles |
| `GET` | `/api/alerts/stats` | Summary statistics of open P1/P2 alerts | Bearer Token | All Roles |
| `PATCH` | `/api/alerts/:id/acknowledge`| Acknowledge safety alert | Bearer Token | `ADMIN`, `HSE_OFFICER`, `REVIEWER` |
| `PATCH` | `/api/alerts/:id/resolve`| Resolve alert with mandatory notes | Bearer Token | `ADMIN`, `HSE_OFFICER` |
| `GET` | `/health` | Service health, DB & system readiness | Public | Public |

---

## 8. Security Architecture & Safeguards

1. **Authentication & Authorization**:
   - Industry-standard JWT with expiration.
   - Passwords hashed with `bcrypt` (salt rounds: 10).
   - Role-Based Access Control (RBAC): `ADMIN`, `HSE_OFFICER`, `REVIEWER`, `VIEWER`.
2. **File Upload Security**:
   - Multi-stage validation: File extension whitelist (`.pdf`, `.csv`, `.txt`), MIME type verification, and file size limits (max 15MB).
   - Memory buffer parsing with zero temporary file leakage.
3. **Input Sanitization & Injection Prevention**:
   - Strict Zod validation on every request body, query parameter, and route parameter.
   - Mongoose parameterized queries prevent NoSQL injection.
4. **Environment & Secrets**:
   - Secrets managed via `.env` and validated at startup using Zod in `src/config/env.js`.
   - Never committed to git; `.gitignore` strictly protects `.env`.
5. **Centralized Error Handling**:
   - No stack traces or internal implementation details leaked in production responses.
   - Consistent error envelope format: `{ "success": false, "error": { "code": "ERROR_CODE", "message": "User-friendly message" } }`.

---

## 9. Dependencies & ES Modules Configuration

```json
{
  "name": "sih-sif-precursor-engine-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "seed": "node scripts/seed/masterSeed.js",
    "seed:rules": "node scripts/seed/seedIOGPRules.js",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.0",
    "@pinecone-database/pinecone": "^5.0.2",
    "bcrypt": "^5.1.1",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "csv-parse": "^5.6.0",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "express-rate-limit": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^8.10.1",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.9",
    "supertest": "^7.0.0",
    "vitest": "^3.0.6"
  }
}
```

---

## 10. Environment Variables Specification (`.env.example`)

```bash
# Server Configuration
PORT=5000
NODE_ENV=development
APP_NAME=sih-sif-precursor-engine-backend
CORS_ORIGIN=*

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sih_sif_precursor_db

# JWT Authentication
JWT_SECRET=sih2026_hse_super_secret_jwt_key_987654321_secure
JWT_EXPIRES_IN=7d

# Google Gemini API (Optional - deterministic fallbacks active if omitted)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Pinecone Vector DB (Optional - in-memory vector store active if omitted)
PINECONE_API_KEY=your_pinecone_api_key_here
PINECONE_INDEX_NAME=safety-reports-v1
PINECONE_ENVIRONMENT=us-east-1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## 11. Demonstration Data Strategy (25+ Realistic Incidents)

To ensure realistic, comprehensive evaluation across energy sectors, the master seed script populates **25+ high-fidelity safety reports**:

| Scenario Domain | Typical Incident Narrative | Key Precursor | Failed Barrier | LSR Violated | Expected SIF Potential |
|:---|:---|:---|:---|:---|:---:|
| **Working at Height** | Scaffolder working on 4th tier (8.2m) unhooked harness to reach valve; plank shifted. | `WORKING_AT_HEIGHT` | 100% Tie-Off Rule, Self-Retracting Lifeline | Working at Height | `SIF_POTENTIAL` (High) |
| **Energy Isolation** | Electrician opened 440V MCC panel without LOTO or zero-energy multi-meter test. | `ELECTRICAL_EXPOSURE`, `ISOLATION_FAILURE` | LOTO Procedure, Zero Energy Verification | Energy Isolation | `SIF_POTENTIAL` (Critical) |
| **Line of Fire / Dropped Object** | 15kg steel rigging shackle slipped from technician's hands at 45m elevation, falling to drill deck. | `DROPPED_OBJECTS`, `LINE_OF_FIRE` | Tool Tethering, Barricaded Drop Zone | Line of Fire | `SIF_POTENTIAL` (High) |
| **Confined Space** | Technician entered Nitrogen-purged Reactor R-302 without permit or gas testing (14% O2). | `CONFINED_SPACE`, `CHEMICAL_EXPOSURE` | Atmospheric Testing, Entry Permit, Attendant | Confined Space | `SIF_POTENTIAL` (Critical) |
| **Pressure Release** | High-pressure hydraulic crane hose ruptured at 3,000 PSI, spraying mist near hot manifolds. | `PRESSURE_RELEASE` | Depressurization Bleed-off Procedure | Bypassing Safety Controls | `SIF_POTENTIAL` (High) |
| **Toxic Gas Release** | Trapped pocket of H2S (120 ppm) released during desalter separator line breaking. | `CHEMICAL_EXPOSURE` | Atmospheric Testing, Breathing Apparatus | Work Authorization | `SIF_POTENTIAL` (Critical) |
| **Low-Risk Observation** | Housekeeping issue: empty coffee spill on control desk cleaned immediately. | None | Housekeeping standard | None | `NON_SIF` (Low) |
| **First Aid Near Miss** | Operator pinched finger while closing portable staircase toolbox; superficial cut. | None | Basic PPE | None | `NON_SIF` (Low) |

---

## 12. Technical Risks, Mitigations & Safety Disclaimers

### Technical Risks & Mitigations
1. **LLM Rate Limiting or Outage**:
   - *Mitigation*: Configurable exponential backoff retry mechanism (max 3 retries) and automatic deterministic fallback rules.
2. **Pinecone Temporary Network Latency / Outage**:
   - *Mitigation*: Built-in in-memory cosine similarity fallback ensuring full vector search and RAG function even in offline or air-gapped environments.
3. **LLM Hallucinations on Risk Metrics**:
   - *Mitigation*: Strict architectural separation—Gemini handles unstructured text interpretation & entity extraction; deterministic mathematical scoring handles all risk scores, counts, percentages, and graph weights.
4. **Token Limit Overflows in RAG Copilot**:
   - *Mitigation*: `RagContextBuilder` implements dynamic token budgeting (top-4 most relevant chunks) and deduplicated canonical facts.

### Safety Decision-Support Disclaimer
> [!IMPORTANT]
> **Safety Decision-Support Disclaimer**: This AI-assisted HSE system is designed strictly as an assistive intelligence and prioritization decision-support tool for qualified HSE professionals. It does not replace human judgment, official regulatory compliance checks, or physical workplace hazard assessments. Risk scores and What-If scenario simulations represent algorithmic heuristics rather than empirically validated mathematical fatality probabilities.

---

## 13. System Quality & Verification Standards

1. **File Structure Integrity**: All file paths valid, imports resolve correctly with explicit `.js` extensions.
2. **100% ES Modules**: Zero instances of CommonJS (`require(`, `module.exports`, or `exports.`).
3. **Import / Export Parity**: Named and default exports match exactly across services and controllers.
4. **Zero Duplicate Declarations**: No duplicate routes, variables, or model registrations.
5. **Clean Dependency Tree**: `npm install` runs cleanly, all packages present in `package.json`.
6. **Strict Runtime Validation**: Zod schemas validate all inputs and LLM outputs.
7. **Automated Test Coverage**: 172/172 tests passing across 37 test suites with 100% success rate.
8. **Runtime Server Reliability**: Express starts cleanly on port 5000, `GET /health` returns 200 OK.
9. **MongoDB Model Resilience**: Mongoose models compile cleanly with DB offline guards preventing timeouts.
10. **Security & Secrets Governance**: Zero hardcoded API keys or secrets in source code.
