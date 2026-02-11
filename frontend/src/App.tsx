/**
 * Main Application Component
 *
 * Chat interface with dynamic A2UI rendering.
 */

import { AGUIChatInterface } from "./components/AGUIChatInterface";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <AGUIChatInterface />
    </ThemeProvider>
  );
}

export default App;
