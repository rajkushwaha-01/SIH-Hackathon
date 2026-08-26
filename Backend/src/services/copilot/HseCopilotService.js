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
        identifier: repId,
        title: matchedInc?.title || `Safety Report ${repId}`,
        textExcerpt: matchedInc?.evidenceSnippet?.substring(0, 140) || "Referenced historical incident precedent.",
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
        identifier: matchedRule?.ruleId || "IOGP-LSR",
        title: matchedRule?.name || ruleName,
        textExcerpt: matchedRule?.description || "IOGP Report 459 Life-Saving Rule requirement.",
      });
    }

    // If no explicit bracket citations were written but RAG context had matches, attach top context items
    if (citations.length === 0) {
      if (ragContext.incidents && ragContext.incidents.length > 0) {
        const topInc = ragContext.incidents[0];
        citations.push({
          type: "REPORT",
          identifier: topInc.reportId,
          title: topInc.title,
          textExcerpt: topInc.evidenceSnippet?.substring(0, 140) || "",
        });
      }
      if (ragContext.applicableRules && ragContext.applicableRules.length > 0) {
        const topRule = ragContext.applicableRules[0];
        citations.push({
          type: "IOGP_RULE",
          identifier: topRule.ruleId,
          title: topRule.name,
          textExcerpt: topRule.description,
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

    // 1. Build grounded RAG context for query
    const ragContext = await RagContextBuilder.buildContextForQuery({
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

    let content = "";
    const model = getGenerativeModel(COPILOT_SYSTEM_PROMPT);

    if (model) {
      try {
        logger.info(`Invoking Gemini for Copilot chat session: ${session.sessionId}`);
        const result = await model.generateContent(userPrompt);
        content = result.response.text();
      } catch (err) {
        logger.warn(`Gemini Copilot generation failed: ${err.message}. Using deterministic grounded response.`);
        content = HseCopilotService.generateDeterministicAnswer(query, ragContext);
      }
    } else {
      content = HseCopilotService.generateDeterministicAnswer(query, ragContext);
    }

    // 3. Extract citations
    const citations = HseCopilotService.extractCitations(content, ragContext);

    // 4. Generate 3 smart suggested follow-up questions
    const suggestedFollowUps = [
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
    answer += `Based on enterprise safety records, the investigation regarding **"${query}"** reveals significant operational risk.\n\n`;

    if (topInc) {
      answer += `#### Historical Incident Precedents\n`;
      answer += `Our safety repository records an analogous event in **[Report ID: ${topInc.reportId}]** (${topInc.title}) at **${topInc.site}** during *${topInc.activity}*.\n`;
      answer += `- **Key Evidence:** "${topInc.evidenceSnippet}"\n`;
      answer += `- **Recorded SIF Potential:** ${topInc.sifClassification} (Risk Score: ${topInc.riskScore}/100).\n\n`;
    }

    if (topRule) {
      answer += `#### Life-Saving Rule Governance\n`;
      answer += `This activity is strictly governed by **[IOGP Rule: ${topRule.name}]** (${topRule.ruleId}): *${topRule.description}*.\n\n`;
    }

    answer += `#### Recommended Hierarchy Interventions\n`;
    answer += `1. **Engineering Control:** Verify positive physical isolation and engineered interlocks prior to commencing task.\n`;
    answer += `2. **Administrative Control:** Conduct a dedicated Permit-to-Work (PTW) re-validation and pre-job safety brief.\n`;
    answer += `3. **Verification Mandate:** Require secondary competent person sign-off on critical safety barriers.`;

    return answer;
  }

  /**
   * Stream response via Server-Sent Events (SSE).
   */
  static async chatStream({ sessionId, query, userId = null, res } = {}) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const response = await HseCopilotService.chat({ sessionId, query, userId });
      const tokens = response.assistantMessage.content.split(" ");

      for (const token of tokens) {
        res.write(`data: ${JSON.stringify({ token: token + " " })}\n\n`);
        await new Promise((resolve) => setTimeout(resolve, 20));
      }

      res.write(
        `data: ${JSON.stringify({
          done: true,
          sessionId: response.sessionId,
          citations: response.citations,
          suggestedFollowUps: response.suggestedFollowUps,
        })}\n\n`
      );
      res.end();
    } catch (error) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }

  /**
   * Retrieve list of user sessions.
   */
  static async getSessions(userId) {
    if (mongoose.connection.readyState !== 1) {
      return [
        {
          sessionId: "COP-2026-0001",
          title: "Working at Height and Fall Protection Investigation",
          messageCount: 4,
          lastActiveAt: new Date(),
        },
      ];
    }
    return CopilotSession.find({ userId }).sort({ lastActiveAt: -1 });
  }

  /**
   * Retrieve session by ID.
   */
  static async getSessionById(sessionId, userId) {
    if (mongoose.connection.readyState !== 1) {
      return {
        sessionId,
        title: "Working at Height Investigation",
        messages: [
          {
            role: "user",
            content: "What are the common causes of scaffolding incidents?",
          },
          {
            role: "assistant",
            content: "Based on [Report ID: INC-2026-001], unhooked harness lanyards are the primary precursor.",
            citations: [{ type: "REPORT", identifier: "INC-2026-001" }],
          },
        ],
      };
    }

    const session = await CopilotSession.findOne({ sessionId, userId });
    if (!session) {
      throw new AppError(`Session '${sessionId}' not found`, 404, "SESSION_NOT_FOUND");
    }
    return session;
  }

  /**
   * Delete session.
   */
  static async deleteSession(sessionId, userId) {
    if (mongoose.connection.readyState !== 1) {
      return { sessionId, deleted: true };
    }
    const result = await CopilotSession.findOneAndDelete({ sessionId, userId });
    if (!result) {
      throw new AppError(`Session '${sessionId}' not found`, 404, "SESSION_NOT_FOUND");
    }
    return { sessionId, deleted: true };
  }
}

export default HseCopilotService;
