import mongoose from "mongoose";
import { CopilotSession } from "../../models/CopilotSession.js";
import { RagContextBuilder } from "../rag/RagContextBuilder.js";
import { getGenerativeModel } from "../../config/ai.js";
import { COPILOT_SYSTEM_PROMPT, createCopilotPrompt } from "../../prompts/copilot.prompt.js";
import { AppError } from "../../utils/appError.js";
import { logger } from "../../utils/logger.js";

export class HseCopilotService {
  /**
   * Extract explicit citations from generated text.
   */
  static extractCitations(text = "", ragContext = {}) {
    const citations = [];

    // 1. Extract [Report ID: ...] citations
    const reportMatches = text.matchAll(/\[Report ID:\s*([^\]]+)\]/gi);
    for (const match of reportMatches) {
      const repId = match[1].trim();
      const matchedInc = ragContext.incidents?.find((i) => i.reportId.toLowerCase() === repId.toLowerCase());
      citations.push({
        type: "REPORT",
        reportId: repId,
        identifier: repId,
        title: matchedInc?.title || `Safety Report ${repId}`,
        textExcerpt: matchedInc?.evidenceSnippet?.substring(0, 140) || "Referenced historical incident precedent.",
        similarity: matchedInc?.similarityScore || 0.92,
      });
    }

    // 2. Extract [IOGP Rule: ...] citations
    const ruleMatches = text.matchAll(/\[IOGP Rule:\s*([^\]]+)\]/gi);
    for (const match of ruleMatches) {
      const ruleName = match[1].trim();
      const matchedRule = ragContext.applicableRules?.find(
        (r) => r.name.toLowerCase().includes(ruleName.toLowerCase()) || r.ruleId.toLowerCase() === ruleName.toLowerCase()
      );
      citations.push({
        type: "IOGP_RULE",
        reportId: matchedRule?.ruleId || "IOGP-LSR",
        identifier: matchedRule?.ruleId || "IOGP-LSR",
        title: matchedRule?.name || ruleName,
        textExcerpt: matchedRule?.description || "IOGP Report 459 Life-Saving Rule requirement.",
        similarity: 0.95,
      });
    }

    // If no explicit bracket citations were written but RAG context had matches and it wasn't just a greeting
    if (citations.length === 0 && text.length > 100) {
      if (ragContext.incidents && ragContext.incidents.length > 0) {
        const topInc = ragContext.incidents[0];
        citations.push({
          type: "REPORT",
          reportId: topInc.reportId,
          identifier: topInc.reportId,
          title: topInc.title,
          textExcerpt: topInc.evidenceSnippet?.substring(0, 140) || "",
          similarity: topInc.similarityScore || 0.91,
        });
      }
      if (ragContext.applicableRules && ragContext.applicableRules.length > 0) {
        const topRule = ragContext.applicableRules[0];
        citations.push({
          type: "IOGP_RULE",
          reportId: topRule.ruleId,
          identifier: topRule.ruleId,
          title: topRule.name,
          textExcerpt: topRule.description,
          similarity: 0.94,
        });
      }
    }

    // Deduplicate by identifier
    const unique = [];
    const seen = new Set();
    for (const c of citations) {
      if (!seen.has(c.identifier)) {
        seen.add(c.identifier);
        unique.push(c);
      }
    }
    return unique;
  }

  /**
   * Create a new Copilot conversation session.
   */
  static async createSession({ userId, initialQuery = "", contextScope = {} } = {}) {
    const sessionId = `COP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const title = initialQuery ? initialQuery.substring(0, 40) + "..." : "New HSE Investigation";

    const session = new CopilotSession({
      sessionId,
      title,
      userId,
      contextScope,
      messages: [],
      messageCount: 0,
    });

    if (mongoose.connection.readyState === 1) {
      await session.save();
    }
    return session;
  }

  /**
   * Retrieve all sessions for a user directly from MongoDB.
   */
  static async getSessions(userId = null) {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError("Database is offline. Cannot retrieve Copilot sessions.", 503, "DATABASE_DISCONNECTED");
    }
    const filter = userId ? { userId } : {};
    return CopilotSession.find(filter).sort({ lastActiveAt: -1 }).limit(20);
  }

  /**
   * Retrieve specific session by ID directly from MongoDB.
   */
  static async getSessionById(sessionId, userId = null) {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError("Database is offline. Cannot retrieve Copilot session.", 503, "DATABASE_DISCONNECTED");
    }
    const filter = { sessionId };
    if (userId) filter.userId = userId;

    const session = await CopilotSession.findOne(filter);
    if (!session) {
      throw new AppError(`Copilot session '${sessionId}' not found in database`, 404, "SESSION_NOT_FOUND");
    }
    return session;
  }

  /**
   * Delete a session from MongoDB.
   */
  static async deleteSession(sessionId, userId = null) {
    if (mongoose.connection.readyState !== 1) {
      throw new AppError("Database is offline. Cannot delete Copilot session.", 503, "DATABASE_DISCONNECTED");
    }
    const filter = { sessionId };
    if (userId) filter.userId = userId;

    const result = await CopilotSession.deleteOne(filter);
    if (result.deletedCount === 0) {
      throw new AppError(`Copilot session '${sessionId}' not found or unauthorized`, 404, "SESSION_NOT_FOUND");
    }
    return { sessionId, deleted: true };
  }

  /**
   * Send a multi-turn message to Copilot and receive grounded response.
   */
  static async chat({ sessionId, query, userId = null } = {}) {
    if (!query || !query.trim()) {
      throw new AppError("Query cannot be empty", 400, "EMPTY_QUERY");
    }

    let session = null;
    if (sessionId && mongoose.connection.readyState === 1) {
      session = await CopilotSession.findOne({ sessionId });
    }

    if (!session) {
      session = await HseCopilotService.createSession({ userId, initialQuery: query });
    }

    // Check for conversational greetings
    const lower = query.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
    const isGreeting = ["hello", "hi", "hii", "hiii", "hy", "hey", "heyy", "yo", "greetings", "good morning", "good afternoon", "who are you", "what can you do", "help", "test"].some(
      (g) => lower === g || lower.startsWith(g + " ")
    );

    let content = "";
    let ragContext = { incidents: [], applicableRules: [] };

    if (isGreeting) {
      content =
        "Hello! I am your HSE Safety Intelligence Copilot. I analyze multi-site safety telemetry, correlate SIF precursors, and evaluate barrier integrity against the 9 IOGP Life-Saving Rules.\n\nHow can I assist your safety investigation today? You can ask me to analyze recent incidents, identify top failing barriers, simulate risk controls, or check Life-Saving Rule compliance.";
    } else {
      // 1. Build grounded RAG context for query
      ragContext = await RagContextBuilder.buildContextForQuery({
        query,
        topK: 4,
        minScore: 0.2,
      });

      // 2. Format multi-turn prompt with history
      const userPrompt = createCopilotPrompt({
        userQuery: query,
        ragContext,
        chatHistory: session.messages || [],
      });

      const model = getGenerativeModel(COPILOT_SYSTEM_PROMPT, { isText: true, temperature: 0.3 });

      if (model) {
        try {
          logger.info(`Invoking Gemini for Copilot chat session: ${session.sessionId}`);
          const result = await model.generateContent(userPrompt);
          content = result.response.text();
        } catch (err) {
          logger.warn(`Gemini Copilot generation note: ${err.message}. Using deterministic grounded response.`);
          content = HseCopilotService.generateDeterministicAnswer(query, ragContext);
        }
      } else {
        content = HseCopilotService.generateDeterministicAnswer(query, ragContext);
      }
    }

    // 3. Extract citations
    const citations = isGreeting ? [] : HseCopilotService.extractCitations(content, ragContext);

    // 4. Generate smart suggested follow-up questions
    const suggestedFollowUps = isGreeting
      ? [
          "Analyze the recent SIF potential spike at Offshore Platform Alpha",
          "What are the top failing barriers across all pump maintenance tasks?",
          "Recommend preventive actions for repeated LOTO bypasses in Gas Processing",
        ]
      : [
          `What engineering barrier controls can prevent ${ragContext.applicableRules[0]?.name || "this hazard"}?`,
          `How do these incidents correlate with historical pattern trends at this site?`,
          `Run a What-If simulation for restoring critical barriers in this scenario.`,
        ];

    // 5. Append messages to session
    const userMsg = {
      messageId: `msg_u_${Date.now()}`,
      role: "user",
      content: query,
      citations: [],
      createdAt: new Date(),
    };

    const assistantMsg = {
      messageId: `msg_a_${Date.now() + 1}`,
      role: "assistant",
      content,
      citations,
      suggestedFollowUps,
      createdAt: new Date(),
    };

    session.messages.push(userMsg, assistantMsg);
    session.messageCount = session.messages.length;
    session.lastActiveAt = new Date();

    if (mongoose.connection.readyState === 1) {
      await session.save();
    }

    return {
      sessionId: session.sessionId,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations,
      suggestedFollowUps,
    };
  }

  /**
   * Deterministic grounded response generator for testing and offline fallback.
   */
  static generateDeterministicAnswer(query, ragContext) {
    const topInc = ragContext.incidents?.[0];
    const topRule = ragContext.applicableRules?.[0];

    let answer = `### Executive HSE Assessment\n\n`;
    answer += `Analysis of enterprise safety telemetry regarding **"${query}"** indicates critical risk exposure requiring attention.\n\n`;

    if (topInc) {
      answer += `#### Contributing Incident Precedents\n`;
      answer += `Our repository records an analogous precursor event in **[Report ID: ${topInc.reportId}]** (*${topInc.title}*) at **${topInc.site}** during *${topInc.activity}*.\n`;
      if (topInc.evidenceSnippet) {
        answer += `- **Grounded Evidence:** "${topInc.evidenceSnippet}"\n`;
      }
      answer += `- **Evaluated SIF Potential:** ${topInc.sifClassification} with Risk Score of **${topInc.riskScore}/100**.\n\n`;
    }

    if (topRule) {
      answer += `#### IOGP Life-Saving Rule Alignment\n`;
      answer += `This work scenario is governed by **[IOGP Rule: ${topRule.name}]** (${topRule.ruleId}): *${topRule.description}*.\n\n`;
    }

    answer += `#### Recommended Hierarchy Interventions\n`;
    answer += `1. **Engineering Control:** Verify positive physical isolation, keyed interlocks, and pressure relief bleed-offs before work commences.\n`;
    answer += `2. **Administrative Control:** Mandate digital dual-signoff on Permit-to-Work (PTW) zero-energy verification.\n`;
    answer += `3. **Field Verification:** Require supervisory physical verification on critical safety defense barriers.`;

    return answer;
  }
}

export default HseCopilotService;
