/**
 * Simple Chat Interface
 *
 * Custom chat UI that calls backend agents directly without CopilotKit.
 */

import { useState, useRef, useEffect } from "react";
import { A2UIRenderer } from "./A2UIRenderer";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  a2ui?: string;
  timestamp: Date;
}

export function SimpleChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [a2uiData, setA2uiData] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call backend agent endpoint
      const response = await fetch("http://localhost:8123/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="simple-chat-interface">
      <div className="chat-container">
        {/* Header */}
        <div className="chat-header">
          <h1>ChatLangA2UI</h1>
          <p>AI-powered dynamic UI generation with Claude & A2UI</p>
        </div>

        {/* Main Content Area */}
        <div className="chat-main">
          {/* A2UI Render Area */}
          <div className="a2ui-area">
            <div className="a2ui-area-header">
              <h3>Generated UI</h3>
              <p>Dynamic components rendered from AI responses</p>
            </div>
            <div className="a2ui-content">
              {a2uiData ? (
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
              <button onClick={sendMessage} disabled={loading || !input.trim()}>
                Send
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
          max-width: 1600px;
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

        .chat-main {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px;
          overflow: hidden;
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

        .a2ui-content {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
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

        @media (max-width: 1024px) {
          .chat-main {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
