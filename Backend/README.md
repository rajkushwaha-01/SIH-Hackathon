# SIH 2026 — PS 26165: AI/NLP Engine to Detect Serious Injury & Fatality (SIF) Precursors

An enterprise-grade, explainable AI-assisted HSE Safety Intelligence Backend MVP.

## Technology Stack
- **Runtime**: Node.js (ES Modules only: `"type": "module"`)
- **Web Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Vector Database**: Pinecone (768-dim embeddings, cosine metric)
- **AI Engine**: Google Gemini API (`@google/genai`)
- **Validation**: Zod
- **Testing**: Vitest, Supertest

## Getting Started

### Prerequisites
- Node.js 18+ (Node 20 recommended)
- MongoDB running locally on `localhost:27017` or MongoDB Atlas URI

### Installation
```bash
cd Backend
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and fill in credentials:
```bash
cp .env.example .env
```

### Running the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production mode
npm start
```

### Running Tests
```bash
npm test
```

## Health Check
- `GET http://localhost:5000/api/health`
