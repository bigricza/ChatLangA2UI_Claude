/**
 * AG-UI Chat Interface
 *
 * Simple AG-UI protocol implementation using Server-Sent Events (SSE).
 * Streams A2UI responses in real-time.
 */

import { useState, useRef, useEffect } from "react";
import { A2UIRenderer } from "./A2UIRenderer";
import { useTheme } from "../contexts/ThemeContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  a2ui?: string;
  timestamp: Date;
}

interface DashboardHistoryItem {
  id: string;
  title: string;
  query: string;
  a2ui: string;
  timestamp: Date;
}

const QUICK_EXAMPLES = [
  { label: "📊 Sales Dashboard", query: "Show me a sales dashboard template 1" },
  { label: "💻 IT Assets Grid", query: "Build IT asset tracking dashboard template 3" },
  { label: "👥 Customer Analytics", query: "Create customer analytics dashboard template 2" },
  { label: "☁️ Cloud Resources", query: "Show Azure/AWS resource dashboard" },
  { label: "📝 License Tracker", query: "Create software license dashboard" },
  { label: "📋 Support Form", query: "Generate a ticket logging form" },
];

export function AGUIChatInterface() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [a2uiData, setA2uiData] = useState<string | null>(null);
  const [currentDashboardTitle, setCurrentDashboardTitle] = useState<string>("");
  const [history, setHistory] = useState<DashboardHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState("");
  const [llmProvider, setLlmProvider] = useState<string>("google");
  const [providers] = useState([
    { id: "google", label: "Gemini", color: "#4285F4" },
    { id: "anthropic", label: "Claude", color: "#D97706" },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load default provider from backend on mount
  useEffect(() => {
    fetch("http://localhost:8123/health")
      .then((r) => r.json())
      .then((data) => setLlmProvider(data.llm_provider || "google"))
      .catch(() => {});
  }, []);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setA2uiData(null);
    setStreamingStatus("Connecting to agent...");

    try {
      // Use fetch with streaming for AG-UI protocol
      const response = await fetch("http://localhost:8123/agui/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, agent: "dashboard_agent", llm_provider: llmProvider }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let a2uiLines: string[] = [];
      let buffer = "";

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "status") {
              setStreamingStatus(data.message);
            } else if (data.type === "a2ui") {
              a2uiLines.push(data.data);
              setStreamingStatus(`Streaming UI components... (${a2uiLines.length} messages)`);
            } else if (data.type === "complete") {
              const a2uiJsonl = a2uiLines.join("\n");
              setA2uiData(a2uiJsonl);

              const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: "assistant",
                content: data.reasoning || "Generated dashboard",
                a2ui: a2uiJsonl,
                timestamp: new Date(),
              };

              setMessages((prev) => [...prev, assistantMessage]);

              // Extract title and add to history
              const title = extractDashboardTitle(a2uiJsonl);
              setCurrentDashboardTitle(title);

              const historyItem: DashboardHistoryItem = {
                id: Date.now().toString(),
                title,
                query: text,
                a2ui: a2uiJsonl,
                timestamp: new Date(),
              };

              setHistory((prev) => [historyItem, ...prev].slice(0, 10));
              setStreamingStatus("✓ Complete");
            } else if (data.type === "error") {
              throw new Error(data.message);
            }
          }
        }
      }

      setLoading(false);
      setStreamingStatus("");
    } catch (err) {
      console.error("[AG-UI] Error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Error: ${err}`,
          timestamp: new Date(),
        },
      ]);
      setLoading(false);
      setStreamingStatus("");
    }
  };

  const extractDashboardTitle = (jsonl: string): string => {
    try {
      const lines = jsonl.trim().split("\n");
      const firstLine = JSON.parse(lines[0]);
      if (firstLine.surfaceUpdate?.components) {
        const titleComp = firstLine.surfaceUpdate.components.find(
          (c: any) => c.component?.Text?.usage_hint === "title"
        );
        if (titleComp) {
          const text = titleComp.component.Text.text;
          return typeof text === 'string' ? text : (text.literalString || "Dashboard");
        }
      }
    } catch (e) {
      console.error("Failed to extract title:", e);
    }
    return "Dashboard";
  };

  const handleQuickExample = (query: string) => {
    sendMessage(query);
  };

  const handleExportJSON = () => {
    if (!a2uiData) return;

    try {
      const lines = a2uiData.trim().split("\n").filter((line) => line.trim());
      const parsedLines = lines.map((line) => JSON.parse(line));
      const formattedData = parsedLines.map((obj) => JSON.stringify(obj, null, 2)).join("\n\n");

      const dataBlob = new Blob([formattedData], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentDashboardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.jsonl`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
    }
  };

  const handleCopyJSON = async () => {
    if (!a2uiData) return;

    try {
      const lines = a2uiData.trim().split("\n").filter((line) => line.trim());
      const parsedLines = lines.map((line) => JSON.parse(line));
      const formattedData = parsedLines.map((obj) => JSON.stringify(obj, null, 2)).join("\n\n");

      await navigator.clipboard.writeText(formattedData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const loadHistoryItem = (item: DashboardHistoryItem) => {
    setA2uiData(item.a2ui);
    setCurrentDashboardTitle(item.title);
  };

  return (
    <div className="simple-chat-interface">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <div className="header-content">
            <div>
              <h1>ChatLangA2UI</h1>
              <p>AI-powered dynamic UI generation with A2UI (AG-UI Protocol + SSE)</p>
              <select
                value={llmProvider}
                onChange={(e) => setLlmProvider(e.target.value)}
                disabled={loading}
                style={{
                  marginTop: "4px",
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontWeight: 600,
                  borderRadius: "12px",
                  border: "none",
                  backgroundColor: providers.find((p) => p.id === llmProvider)?.color || "#4285F4",
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='white'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  color: "#fff",
                  cursor: loading ? "not-allowed" : "pointer",
                  outline: "none",
                  appearance: "none",
                  WebkitAppearance: "none",
                  paddingRight: "22px",
                }}
              >
                {providers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                style={{
                  padding: "8px 16px",
                  fontSize: "20px",
                  background: "transparent",
                  border: "2px solid var(--border-color)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {theme === "light" ? "🌙" : "☀️"}
              </button>
              <button
                className="history-toggle"
                onClick={() => setShowHistory(!showHistory)}
                title="Dashboard History"
              >
                📚 History {history.length > 0 && `(${history.length})`}
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`chat-main ${showHistory ? 'with-history' : ''}`}>
          {/* Dashboard History Sidebar */}
          {showHistory && (
            <div className="history-sidebar">
              <h3>Recent Dashboards</h3>
              {history.length === 0 ? (
                <p className="history-empty">No dashboards yet</p>
              ) : (
                <div className="history-list">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="history-item"
                      onClick={() => loadHistoryItem(item)}
                    >
                      <div className="history-item-title">{item.title}</div>
                      <div className="history-item-query">{item.query}</div>
                      <div className="history-item-time">
                        {item.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* A2UI Render Area */}
          <div className="a2ui-area">
            <div className="a2ui-area-header">
              <div>
                <h3>Generated UI {currentDashboardTitle && `- ${currentDashboardTitle}`}</h3>
                <p>Dynamic components rendered via AG-UI Protocol</p>
              </div>
              {a2uiData && (
                <div className="export-buttons">
                  <button
                    onClick={handleCopyJSON}
                    className="export-btn"
                    title="Copy A2UI JSON to clipboard"
                  >
                    {copySuccess ? "✓ Copied!" : "📋 Copy JSON"}
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="export-btn"
                    title="Download A2UI JSON file"
                  >
                    💾 Export
                  </button>
                </div>
              )}
            </div>
            <div className="a2ui-content">
              {loading ? (
                <div className="loading-skeleton">
                  <div className="skeleton-header"></div>
                  <div className="skeleton-cards">
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                    <div className="skeleton-card"></div>
                  </div>
                  <div className="skeleton-chart"></div>
                  <div className="skeleton-table">
                    <div className="skeleton-table-row"></div>
                    <div className="skeleton-table-row"></div>
                    <div className="skeleton-table-row"></div>
                  </div>
                  <p className="loading-text">✨ {streamingStatus || "Generating dashboard..."}</p>
                </div>
              ) : a2uiData ? (
                <A2UIRenderer data={a2uiData} />
              ) : (
                <div className="a2ui-placeholder">
                  <p>💬 Start a conversation to see dynamic UI appear here</p>
                  <div className="example-prompts">
                    <h4>Try asking:</h4>
                    <ul>
                      <li>"Show me a sales dashboard"</li>
                      <li>"Create a revenue chart"</li>
                      <li>"Generate a contact form"</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area - hide when history is shown */}
          {!showHistory && (
            <div className="chat-area">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="welcome-message">
                  <h2>Welcome! 👋</h2>
                  <p>Ask me to create dashboards, charts, tables, or forms.</p>
                  <p>I'll generate interactive UI components using A2UI.</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
                    Using AG-UI Protocol with Server-Sent Events
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.role}`}>
                  <div className="message-avatar">{msg.role === "user" ? "👤" : "🤖"}</div>
                  <div>
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">{msg.timestamp.toLocaleTimeString()}</div>
                  </div>
                </div>
              ))}

              {/* Show streaming status as a temporary message */}
              {streamingStatus && (
                <div className="message message-assistant message-streaming">
                  <div className="message-avatar">🤖</div>
                  <div>
                    <div className="message-content streaming-status">
                      <span className="streaming-icon">⚡</span>
                      {streamingStatus}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
              <div className="quick-examples">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    className="example-btn"
                    onClick={() => handleQuickExample(example.query)}
                    disabled={loading}
                  >
                    {example.label}
                  </button>
                ))}
              </div>
              <form className="chat-input-form" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
                <input
                  type="text"
                  className="chat-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me to create a dashboard, chart, or form..."
                  disabled={loading}
                />
                <button type="submit" className="chat-input-btn" disabled={loading || !input.trim()}>
                  {loading ? "⏳" : "Send"}
                </button>
              </form>
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
