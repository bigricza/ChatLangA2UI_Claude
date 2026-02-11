/**
 * Simple Chat Interface
 *
 * Custom chat UI that calls backend agents directly without CopilotKit.
 * Enhanced with quick examples, export functionality, loading states, and dashboard history.
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
  { label: "📊 Sales Dashboard", query: "Show me a sales dashboard template 1", icon: "📊" },
  { label: "💻 IT Assets Grid", query: "Build IT asset tracking dashboard template 3", icon: "💻" },
  { label: "👥 Customer Analytics", query: "Create customer analytics dashboard template 2", icon: "👥" },
  { label: "☁️ Cloud Resources", query: "Show Azure/AWS resource dashboard", icon: "☁️" },
  { label: "📝 License Tracker", query: "Create software license dashboard", icon: "📝" },
  { label: "📋 Support Form", query: "Generate a ticket logging form", icon: "📋" },
];

export function SimpleChatInterface() {
  const { theme, toggleTheme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [a2uiData, setA2uiData] = useState<string | null>(null);
  const [currentDashboardTitle, setCurrentDashboardTitle] = useState<string>("");
  const [history, setHistory] = useState<DashboardHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    setA2uiData(null); // Clear previous dashboard

    try {
      // Call backend agent endpoint
      const response = await fetch("http://localhost:8123/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "Generated dashboard",
        a2ui: data.a2ui,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data.a2ui) {
        setA2uiData(data.a2ui);

        // Extract dashboard title from query
        const title = extractDashboardTitle(text);
        setCurrentDashboardTitle(title);

        // Add to history
        const historyItem: DashboardHistoryItem = {
          id: Date.now().toString(),
          title,
          query: text,
          a2ui: data.a2ui,
          timestamp: new Date(),
        };
        setHistory((prev) => [historyItem, ...prev].slice(0, 10)); // Keep last 10
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to generate response"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const extractDashboardTitle = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes("sales")) return "Sales Dashboard";
    if (lowerQuery.includes("customer")) return "Customer Analytics";
    if (lowerQuery.includes("it asset") || lowerQuery.includes("asset tracking")) return "IT Assets";
    if (lowerQuery.includes("license")) return "License Management";
    if (lowerQuery.includes("cloud") || lowerQuery.includes("azure") || lowerQuery.includes("aws")) return "Cloud Resources";
    if (lowerQuery.includes("form") || lowerQuery.includes("ticket")) return "Support Form";
    return "Dashboard";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleQuickExample = (query: string) => {
    sendMessage(query);
  };

  const handleExportJSON = () => {
    if (!a2uiData) return;

    try {
      // Parse JSONL (newline-delimited JSON) and format each line
      const lines = a2uiData.trim().split("\n").filter(line => line.trim());
      const parsedLines = lines.map(line => JSON.parse(line));
      const formattedData = parsedLines.map(obj => JSON.stringify(obj, null, 2)).join("\n\n");

      const dataBlob = new Blob([formattedData], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentDashboardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.jsonl`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export:", err);
      // Fallback: export raw data
      const dataBlob = new Blob([a2uiData], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentDashboardTitle.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.jsonl`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyJSON = async () => {
    if (!a2uiData) return;

    try {
      // Format JSONL for better readability when copied
      const lines = a2uiData.trim().split("\n").filter(line => line.trim());
      const parsedLines = lines.map(line => JSON.parse(line));
      const formattedData = parsedLines.map(obj => JSON.stringify(obj, null, 2)).join("\n\n");

      await navigator.clipboard.writeText(formattedData);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      // Fallback: copy raw data
      try {
        await navigator.clipboard.writeText(a2uiData);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (e) {
        console.error("Fallback copy also failed:", e);
      }
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
              <p>AI-powered dynamic UI generation with Claude & A2UI</p>
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
        <div className="chat-main">
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
                <p>Dynamic components rendered from AI responses</p>
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
                  <p className="loading-text">✨ Generating dashboard...</p>
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

          {/* Chat Area */}
          <div className="chat-area">
            <div className="chat-messages">
              {messages.length === 0 && (
                <div className="welcome-message">
                  <h2>Welcome! 👋</h2>
                  <p>Ask me to create dashboards, charts, tables, or forms.</p>
                  <p>I'll generate interactive UI components using A2UI.</p>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`message message-${msg.role}`}>
                  <div className="message-avatar">
                    {msg.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{msg.content}</div>
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="message message-assistant">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Examples */}
            <div className="quick-examples">
              <div className="quick-examples-label">Quick Examples:</div>
              <div className="quick-examples-grid">
                {QUICK_EXAMPLES.map((example, idx) => (
                  <button
                    key={idx}
                    className="quick-example-btn"
                    onClick={() => handleQuickExample(example.query)}
                    disabled={loading}
                    title={example.query}
                  >
                    <span className="quick-example-icon">{example.icon}</span>
                    <span className="quick-example-label">{example.label.replace(example.icon + " ", "")}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Area */}
            <div className="chat-input-area">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me to create a dashboard, chart, or form..."
                disabled={loading}
                rows={2}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                {loading ? "⏳" : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .simple-chat-interface {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .chat-container {
          max-width: 1800px;
          margin: 0 auto;
          height: 95vh;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chat-header {
          padding: 24px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chat-header h1 {
          margin: 0;
          font-size: 28px;
          font-weight: 700;
        }

        .chat-header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .history-toggle {
          padding: 10px 20px;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-toggle:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .chat-main {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px;
          overflow: hidden;
        }

        .history-sidebar {
          width: 280px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 20px;
          overflow-y: auto;
        }

        .history-sidebar h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .history-empty {
          text-align: center;
          color: #9ca3af;
          font-size: 14px;
          padding: 20px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          background: white;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-item:hover {
          border-color: #667eea;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .history-item-title {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          margin-bottom: 4px;
        }

        .history-item-query {
          font-size: 12px;
          color: #6b7280;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          margin-bottom: 4px;
        }

        .history-item-time {
          font-size: 11px;
          color: #9ca3af;
        }

        .a2ui-area {
          flex: 1.5;
          display: flex;
          flex-direction: column;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .a2ui-area-header {
          padding: 16px 20px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .a2ui-area-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .a2ui-area-header p {
          margin: 4px 0 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .export-buttons {
          display: flex;
          gap: 8px;
        }

        .export-btn {
          padding: 8px 16px;
          background: white;
          color: #667eea;
          border: 1px solid #667eea;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .export-btn:hover {
          background: #667eea;
          color: white;
        }

        .a2ui-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .loading-skeleton {
          animation: fadeIn 0.3s ease-out;
        }

        .skeleton-header {
          height: 40px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
          margin-bottom: 20px;
          width: 60%;
        }

        .skeleton-cards {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 20px;
        }

        .skeleton-card {
          height: 120px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
        }

        .skeleton-chart {
          height: 300px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .skeleton-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .skeleton-table-row {
          height: 50px;
          background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 8px;
        }

        .loading-text {
          text-align: center;
          color: #667eea;
          font-size: 16px;
          font-weight: 600;
          margin-top: 20px;
          animation: pulse 1.5s infinite;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .a2ui-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          color: #6b7280;
        }

        .a2ui-placeholder p {
          font-size: 16px;
          margin-bottom: 30px;
        }

        .example-prompts {
          background: white;
          padding: 20px;
          border-radius: 8px;
          text-align: left;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .example-prompts h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #111827;
        }

        .example-prompts ul {
          margin: 0;
          padding-left: 20px;
          list-style: none;
        }

        .example-prompts li {
          margin: 8px 0;
          font-size: 14px;
          color: #667eea;
          cursor: pointer;
        }

        .example-prompts li:before {
          content: "→ ";
          margin-right: 8px;
        }

        .chat-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: white;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .welcome-message {
          text-align: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .welcome-message h2 {
          margin: 0 0 12px 0;
          color: #111827;
        }

        .message {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .message-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .message-user .message-avatar {
          background: #667eea;
        }

        .message-assistant .message-avatar {
          background: #10b981;
        }

        .message-content {
          flex: 1;
        }

        .message-text {
          background: #f3f4f6;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          line-height: 1.5;
        }

        .message-user .message-text {
          background: #667eea;
          color: white;
        }

        .message-time {
          margin-top: 4px;
          font-size: 11px;
          color: #9ca3af;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
          padding: 12px 16px;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #9ca3af;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .quick-examples {
          padding: 12px 16px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .quick-examples-label {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-examples-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .quick-example-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 12px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
        }

        .quick-example-btn:hover:not(:disabled) {
          border-color: #667eea;
          background: #f0f4ff;
          transform: translateY(-2px);
        }

        .quick-example-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-example-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .quick-example-label {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .chat-input-area {
          padding: 16px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 12px;
        }

        .chat-input-area textarea {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          resize: none;
          transition: border-color 0.2s;
        }

        .chat-input-area textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .chat-input-area button {
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
        }

        .chat-input-area button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .chat-input-area button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 1400px) {
          .quick-examples-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 1024px) {
          .chat-main {
            flex-direction: column;
          }

          .history-sidebar {
            width: 100%;
            max-height: 200px;
          }

          .quick-examples-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}
