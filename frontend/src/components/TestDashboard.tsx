/**
 * Test Dashboard Component
 *
 * Simple test page to demonstrate A2UI rendering without CopilotKit.
 */

import { useEffect, useState } from "react";
import { A2UIRenderer } from "./A2UIRenderer";

export function TestDashboard() {
  const [a2uiData, setA2uiData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch A2UI data from test endpoint
    fetch("http://localhost:8123/test/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setA2uiData(data.a2ui);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="test-dashboard">
      <div className="test-header">
        <h1>ChatLangA2UI - Test Dashboard</h1>
        <p>Demonstrating A2UI rendering with sample data</p>
      </div>

      <div className="test-content">
        {loading && <div className="loading">Loading dashboard...</div>}

        {error && (
          <div className="error">
            <h3>Error loading dashboard</h3>
            <p>{error}</p>
            <p>Make sure the backend is running on http://localhost:8123</p>
          </div>
        )}

        {a2uiData && !loading && (
          <div className="dashboard-render">
            <A2UIRenderer data={a2uiData} />
          </div>
        )}
      </div>

      <style>{`
        .test-dashboard {
          width: 100%;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 20px;
        }

        .test-header {
          text-align: center;
          color: white;
          margin-bottom: 30px;
        }

        .test-header h1 {
          font-size: 36px;
          margin: 0 0 10px 0;
        }

        .test-header p {
          font-size: 18px;
          opacity: 0.9;
        }

        .test-content {
          max-width: 1400px;
          margin: 0 auto;
        }

        .loading,
        .error {
          background: white;
          padding: 40px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .error {
          color: #ef4444;
        }

        .error h3 {
          margin: 0 0 10px 0;
        }

        .dashboard-render {
          background: #f8f9fa;
          padding: 30px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}
