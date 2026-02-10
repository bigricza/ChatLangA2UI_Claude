/**
 * Chat Interface Component
 *
 * Main chat UI using CopilotKit components with A2UI message detection.
 */

import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";
import { A2UIRenderer } from "./A2UIRenderer";
import "@copilotkit/react-ui/styles.css";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isA2UI?: boolean;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [a2uiData, setA2uiData] = useState<string | null>(null);

  // Make chat history readable to the agent
  useCopilotReadable({
    description: "The chat conversation history",
    value: messages,
  });

  // Register action to handle A2UI responses
  useCopilotAction({
    name: "renderA2UI",
    description: "Render A2UI components from agent response",
    parameters: [
      {
        name: "a2uiMessages",
        type: "string",
        description: "JSONL formatted A2UI messages",
        required: true,
      },
    ],
    handler: async ({ a2uiMessages }) => {
      console.log("Received A2UI messages:", a2uiMessages);
      setA2uiData(a2uiMessages);

      // Add to chat history
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content: a2uiMessages,
          isA2UI: true,
        },
      ]);
    },
  });

  // Detect A2UI in regular messages
  const handleNewMessage = (content: string, role: "user" | "assistant") => {
    const isA2UI = role === "assistant" && content.includes("surfaceUpdate");

    if (isA2UI) {
      setA2uiData(content);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role,
        content,
        isA2UI,
      },
    ]);
  };

  return (
    <div className="chat-interface">
      <div className="chat-container">
        <div className="chat-header">
          <h1>ChatLangA2UI</h1>
          <p className="chat-subtitle">
            AI-powered chat with dynamic UI generation
          </p>
        </div>

        <div className="chat-content">
          {/* A2UI Rendering Area */}
          {a2uiData && (
            <div className="a2ui-render-area">
              <A2UIRenderer data={a2uiData} />
            </div>
          )}

          {/* CopilotKit Chat Component */}
          <CopilotChat
            labels={{
              title: "Chat Assistant",
              initial: "Hello! I can generate dashboards, charts, tables, and forms for you. Try asking me to:\n\n• Show me a sales dashboard\n• Create a bar chart of revenue\n• Generate a user registration form\n• Build a customer analytics dashboard",
            }}
            onSubmitMessage={(message) => {
              handleNewMessage(message, "user");
            }}
            className="copilot-chat"
          />
        </div>
      </div>

      <style>{`
        .chat-interface {
          width: 100%;
          height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .chat-container {
          width: 100%;
          max-width: 1400px;
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

        .chat-subtitle {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .chat-content {
          flex: 1;
          display: flex;
          gap: 20px;
          padding: 20px;
          overflow: hidden;
        }

        .a2ui-render-area {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .copilot-chat {
          width: 450px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
        }

        /* Responsive layout */
        @media (max-width: 1024px) {
          .chat-content {
            flex-direction: column;
          }

          .copilot-chat {
            width: 100%;
            height: 400px;
          }
        }
      `}</style>
    </div>
  );
}
