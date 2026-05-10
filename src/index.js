import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

if (!window.storage) {
  window.storage = {
    get: (key) => new Promise((resolve) => {
      try { const v = localStorage.getItem("savvie_" + key); resolve(v ? { key, value: v } : null); }
      catch { resolve(null); }
    }),
    set: (key, value) => new Promise((resolve) => {
      try { localStorage.setItem("savvie_" + key, value); resolve({ key, value }); }
      catch { resolve(null); }
    }),
    delete: (key) => new Promise((resolve) => {
      try { localStorage.removeItem("savvie_" + key); resolve({ key, deleted: true }); }
      catch { resolve(null); }
    }),
    list: (prefix) => new Promise((resolve) => {
      try {
        const keys = Object.keys(localStorage)
          .filter((k) => k.startsWith("savvie_" + (prefix || "")))
          .map((k) => k.replace("savvie_", ""));
        resolve({ keys });
      } catch { resolve({ keys: [] }); }
    }),
  };
}

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null, info: null }; }
  static getDerivedStateFromError(e) { return { hasError: true, error: e }; }
  componentDidCatch(error, info) {
    console.error("SAVVIE CRASH:", error);
    console.error("Component stack:", info.componentStack);
    this.setState({ info });
  }
  render() {
    if (this.state.hasError) {
      const stack = this.state.info ? this.state.info.componentStack : "";
      // Extract first component from stack
      const firstComp = stack ? stack.trim().split("\n")[0] : "unknown";
      return (
        <div style={{ padding: 16, fontFamily: "monospace", background: "#0F2B34", minHeight: "100vh", color: "#fff", overflowY: "auto" }}>
          <h2 style={{ color: "#7FD9E5", fontFamily: "sans-serif", margin: "0 0 8px" }}>Savvie — Error</h2>
          <p style={{ color: "#ccc", margin: "0 0 12px", fontFamily: "sans-serif" }}>Something went wrong.</p>
          <div style={{ background: "#FF6B6B22", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <p style={{ color: "#FF6B6B", fontSize: 13, margin: 0, wordBreak: "break-all" }}>
              {this.state.error && this.state.error.toString()}
            </p>
          </div>
          <div style={{ background: "#F0A50022", borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <p style={{ color: "#F0A500", fontSize: 11, margin: "0 0 4px", fontWeight: "bold" }}>Failed in: {firstComp}</p>
            <pre style={{ color: "#F0A500", fontSize: 10, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all", maxHeight: 200, overflowY: "auto" }}>
              {stack}
            </pre>
          </div>
          <button onClick={() => window.location.reload()}
            style={{ background: "#0D7680", border: "none", borderRadius: 10, padding: "12px 24px", color: "#fff", fontSize: 14, cursor: "pointer", fontFamily: "sans-serif" }}>
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<ErrorBoundary><App /></ErrorBoundary>);
