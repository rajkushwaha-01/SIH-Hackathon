# 🛡️ Backend MVP — AI/NLP Engine to Detect SIF Precursors
### *SIH 2026 PS 26165 | Enterprise Safety Intelligence Backend*

[![Node.js ES Modules](https://img.shields.io/badge/Node.js-v20+_ESM-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![Google Gemini 1.5](https://img.shields.io/badge/AI-Google_Gemini_1.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](#)
[![Pinecone Vector DB](https://img.shields.io/badge/Vector_DB-Pinecone_768d-000000?style=for-the-badge&logo=pinecone&logoColor=white)](#)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB_Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#)
[![Tests Passing](https://img.shields.io/badge/Tests-172%2F172_Passed-success?style=for-the-badge&logo=vitest&logoColor=white)](#)
[![Zero CommonJS](https://img.shields.io/badge/Codebase-100%25_ES_Modules-blueviolet?style=for-the-badge)](#)

---

## 🏗️ Architecture & Component Overview

```
c:\Users\rajku\Desktop\SIH-Hackathon\Backend
├── src/
│   ├── config/              # Environment, MongoDB, AI & Vector configurations
│   ├── constants/           # 14 Precursor Taxonomies, 9 IOGP Rules, Severities
│   ├── controllers/         # Express REST controllers (Auth, Reports, Copilot, Graph, Simulator)
│   ├── middleware/          # JWT Auth, RBAC, File Uploads, Rate Limiter, Error Handler
│   ├── models/              # Mongoose Schemas (User, Report, Analysis, Graph, Simulation, Alert, Audit)
│   ├── prompts/             # Gemini System Prompts with strict grounding and citation constraints
│   ├── routes/              # Express API route modules mounted in app.js
│   ├── services/            # Core Business Logic:
│   │   ├── ai/              # Gemini service with JSON repair and schema validation
│   │   ├── alerts/          # Smart alert triggers & 24h suppression deduplication
│   │   ├── analytics/       # Executive KPIs, site trends, and barrier health
│   │   ├── barrier/         # Hierarchy of controls & barrier resilience scoring
│   │   ├── copilot/         # Evidence-Grounded HSE Copilot (SSE Streaming + Bracket Citations)
│   │   ├── embeddings/      # 768-dim text-embedding-004 + fallback vectorizer
│   │   ├── graph/           # SIF Precursor Causal Graph Engine & high-risk pathways
│   │   ├── ingestion/       # Multi-format parsers (PDF, CSV, TXT) + SHA-256 deduplication
│   │   ├── lifeSavingRules/ # 9 Official IOGP Report 459 life-saving rules mapping
│   │   ├── nlp/             # Multi-stage extraction & semantic text chunking
│   │   ├── pattern/         # Multi-dimensional cluster miner (Site + Precursor + Barrier)
│   │   ├── precursor/       # 14-Category precursor detector & barrier signals
│   │   ├── rag/             # Grounded RAG prompt assembler with mandatory citations
│   │   ├── review/          # Human-in-the-loop review workflow & versioned overrides
│   │   ├── risk/            # Deterministic mathematical risk scoring engine (0-100)
│   │   ├── sif/             # Counterfactual SIF potential classifier
│   │   ├── simulator/       # Counterfactual What-If risk simulator & delta calculations
│   │   └── vector/          # Pinecone vector store & cosine similarity search
│   ├── utils/               # AppError, ApiResponse, Logger, Crypto hashers
│   ├── validators/          # Zod runtime schema validators
│   ├── app.js               # Express application initialization & middleware pipeline
│   └── server.js            # HTTP Server bootstrap & graceful shutdown handler
├── scripts/
│   └── seed/                # Master seed scripts (Users, 9 IOGP Rules, 25+ Incidents)
├── tests/
│   ├── fixtures/            # Test datasets and gold-standard mock incident fixtures
│   ├── integration/         # API integration test suites (Supertest)
│   └── unit/                # Service & algorithm unit test suites (Vitest)
├── package.json             # NPM dependencies, scripts, ES Modules declaration
└── vitest.config.js         # Vitest test runner configuration
```

---

## ⚡ Key Commands

```bash
# Install dependencies
npm install

# Seed complete database (4 default users, 9 IOGP rules, 25 realistic reports, vectors, patterns, alerts)
npm run seed

# Run local development server
npm run dev

# Run all 37 test suites (172 tests)
npm test
```

---

## 🌟 The Three Flagship "WOW" Features

1. **🕸️ SIF Precursor Causal Graph (`GET /api/graph`, `GET /api/graph/pathways`)**:
   - Multi-hop causal failure paths ($Energy\ Source \rightarrow Precursor \rightarrow Failed\ Barrier \rightarrow Consequence$).
   - Formatted Cytoscape.js and D3 graph payloads for instant interactive UI visualization.

2. **⚡ What-If Risk Simulator (`POST /api/simulator/simulate`, `POST /api/simulator/compare`)**:
   - Counterfactual scenario testing with barrier restoration/degradation and precursor additions/removals.
   - Point-by-point delta risk scores ($\Delta Score$) and mitigation efficacy percentages.

3. **🤖 Evidence-Grounded HSE Copilot (`POST /api/copilot/chat`, `POST /api/copilot/chat/stream`)**:
   - Strict grounding in enterprise incidents and IOGP Life-Saving Rules.
   - Mandatory bracket citations (`[Report ID: INC-2026-001]`, `[IOGP Rule: Energy Isolation]`).
   - Server-Sent Events (SSE) streaming for real-time responsiveness.
