import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Plus,
  Trash2,
  Bookmark,
  FileText,
  ShieldAlert,
  Flame,
  Wrench,
  CheckCircle2,
  ExternalLink,
  Info,
  Layers,
  ArrowRight,
  Clock,
} from 'lucide-react';
import { copilotService } from '../../services/copilot';
import PageContainer from '../../components/layout/PageContainer';
import PageHeader from '../../components/layout/PageHeader';
import {
  Button,
  Input,
  RiskBadge,
  SIFStatusBadge,
  EvidenceCard,
} from '../../components/common';
import { cn } from '../../utils/cn';

const SUGGESTED_PROMPTS = [
  'Analyze the recent SIF potential spike at Offshore Platform Alpha',
  'What are the top failing barriers across all pump maintenance tasks?',
  'Show me all near-misses related to Line of Fire and Crane operations',
  'Recommend preventive actions for repeated LOTO bypasses in Gas Processing',
];

export default function HseCopilotPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  const initialQuery = searchParams.get('q') || '';
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('COP-2026-SESSION');

  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Hello Raj. I am your HSE Safety Intelligence Copilot. I analyze multi-site safety telemetry, correlate SIF precursors, and evaluate barrier integrity against the 9 IOGP Life-Saving Rules.\n\nHow can I assist your safety investigation today?',
      citations: [],
      timestamp: new Date().toISOString(),
    },
  ]);

  const [sessions, setSessions] = useState([
    { id: 'COP-2026-SESSION', title: 'Offshore SIF Investigation', timestamp: 'Just now' },
    { id: 'COP-2026-PREV-1', title: 'Hydraulic LOTO Failure Analysis', timestamp: 'Yesterday' },
    { id: 'COP-2026-PREV-2', title: 'Work at Height Precursor Review', timestamp: '3 days ago' },
  ]);

  useEffect(() => {
    if (initialQuery && messages.length === 1) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (queryText = inputQuery) => {
    if (!queryText.trim() || loading) return;

    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: queryText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await copilotService.chat({
        sessionId,
        query: queryText.trim(),
      });

      // Extract content from backend response
      const assistantText =
        res?.data?.assistantMessage?.content ||
        res?.assistantMessage?.content ||
        res?.data?.answer ||
        res?.answer ||
        res?.data?.content ||
        res?.content;

      const citations =
        res?.data?.citations ||
        res?.citations ||
        res?.data?.assistantMessage?.citations ||
        res?.assistantMessage?.citations ||
        [];

      if (assistantText) {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: assistantText,
          citations,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        const errMsg = {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: '⚠️ Unable to generate safety intelligence assessment. No response returned from the backend service.',
          citations: [],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errMsg]);
      }
    } catch (err) {
      console.error('Copilot live query error:', err);
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **HSE Copilot Error**: ${err?.response?.data?.message || err?.message || 'Failed to connect to safety intelligence Copilot engine.'}`,
        citations: [],
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewSession = () => {
    const newId = `COP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    setSessionId(newId);
    setSessions((prev) => [{ id: newId, title: 'New Safety Investigation', timestamp: 'Just now' }, ...prev]);
    setMessages([
      {
        id: 'msg-welcome',
        role: 'assistant',
        content:
          'Started a new investigation thread. What specific safety incident, precursor pathway, or barrier would you like to examine?',
        citations: [],
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  return (
    <PageContainer>
      <PageHeader
        title="HSE Safety Copilot"
        description="Evidence-grounded conversational safety intelligence assistant powered by RAG and Pinecone vector retrieval."
        badge="WOW FEATURE #3"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Session Thread History Sidebar (3 cols) */}
        <div className="lg:col-span-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-subtle flex flex-col justify-between h-[680px]">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/60">
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Investigations
              </span>
              <Button
                variant="outline"
                size="xs"
                icon={Plus}
                onClick={handleNewSession}
              >
                New Chat
              </Button>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[460px]">
              {sessions.map((s) => (
                <div
                  key={s.id}
                  onClick={() => setSessionId(s.id)}
                  className={cn(
                    'p-2.5 rounded-lg border text-xs transition-all cursor-pointer select-none',
                    sessionId === s.id
                      ? 'bg-primary-fixed/25 border-primary text-primary font-bold shadow-xs'
                      : 'bg-surface-container-lowest border-outline-variant/50 text-on-surface hover:bg-surface-container-low'
                  )}
                >
                  <p className="truncate">{s.title}</p>
                  <span className="text-[10px] text-outline block mt-0.5 font-normal">
                    {s.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-outline-variant/60">
            <div className="p-3 bg-surface-container-low border border-outline-variant rounded-lg text-[11px] text-on-surface-variant">
              <span className="font-bold text-primary flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Hallucination Guarantee</span>
              </span>
              <p className="leading-snug">
                Every AI statement is grounded against indexed reports and IOGP rules with citations.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: Chat Conversation Area (9 cols) */}
        <div className="lg:col-span-9 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-subtle flex flex-col h-[680px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                  <span>HSE Safety Intelligence Assistant</span>
                  <span className="text-[10px] font-mono font-bold text-safety-green bg-green-100 px-1.5 py-0.2 rounded">
                    RAG Grounded
                  </span>
                </h3>
                <p className="text-[11px] text-on-surface-variant">
                  Connected to Pinecone Vector Database & Enterprise Safety Archive
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="xs"
              icon={Plus}
              onClick={handleNewSession}
            >
              Clear Conversation
            </Button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-surface-container-lowest">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 max-w-3xl',
                    isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs text-xs font-bold',
                      isUser
                        ? 'bg-on-surface text-white'
                        : 'bg-primary text-white ai-shimmer'
                    )}
                  >
                    {isUser ? 'RS' : <Bot className="w-4 h-4" />}
                  </div>

                  {/* Message Body */}
                  <div className="flex-1 space-y-3">
                    <div
                      className={cn(
                        'p-4 rounded-xl text-xs md:text-sm leading-relaxed whitespace-pre-wrap shadow-xs',
                        isUser
                          ? 'bg-primary text-white rounded-tr-none font-medium'
                          : 'bg-surface-container-low border border-outline-variant text-on-surface rounded-tl-none'
                      )}
                    >
                      {msg.content}
                    </div>

                    {/* Grounded Evidence Citations Attached */}
                    {!isUser && msg.citations && msg.citations.length > 0 && (
                      <div className="p-3 bg-surface-container-lowest border border-outline-variant/80 rounded-lg shadow-xs space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant pb-1 border-b border-outline-variant/40">
                          <span className="flex items-center gap-1 text-primary">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Grounded Precedent Citations ({msg.citations.length})</span>
                          </span>
                          <span className="text-[10px] font-mono text-outline">
                            Pinecone Similarity Search
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.citations.map((cite, i) => {
                            const targetId = cite.reportId || cite.identifier;
                            return (
                              <div
                                key={i}
                                onClick={() => targetId && navigate(`/reports/${targetId}`)}
                                className="p-2.5 bg-surface-container-low border border-outline-variant hover:border-primary rounded transition-all cursor-pointer text-xs group"
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span className="font-mono font-bold text-primary group-hover:underline flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {targetId || 'INC-REPORT'}
                                  </span>
                                  {cite.similarity && (
                                    <span className="text-[10px] font-bold text-primary bg-primary-fixed px-1.5 rounded">
                                      {Math.round(cite.similarity * 100)}% Match
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-semibold text-on-surface line-clamp-1">
                                  {cite.title}
                                </p>
                                {cite.textExcerpt && (
                                  <p className="text-[10px] text-on-surface-variant line-clamp-2 mt-0.5 italic font-serif">
                                    "{cite.textExcerpt}"
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Animation */}
            {loading && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ai-shimmer">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface-variant flex items-center gap-2 shadow-xs">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  <span>Searching Pinecone vector indexes & synthesizing safety evidence...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompt Pills */}
          <div className="px-4 py-2 bg-surface-container-low border-t border-outline-variant/60 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline shrink-0">
              Suggestions:
            </span>
            {SUGGESTED_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-xs px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant hover:border-primary-container text-on-surface hover:text-primary transition-all shrink-0 font-medium truncate max-w-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Message Input Bar */}
          <div className="p-4 bg-surface-container-low border-t border-outline-variant">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                placeholder="Ask about SIF precursors, barrier failures, site spikes, or IOGP rules..."
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                disabled={loading}
                className="flex-1 text-xs md:text-sm py-2.5"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!inputQuery.trim() || loading}
                loading={loading}
                icon={Send}
                className="shrink-0 font-bold shadow-sm"
              >
                Send
              </Button>
            </form>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
