import * as React from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import App from "./App";
import { createAppTheme } from "./theme";

// Saved choice first, otherwise follow the system setting
const getInitialThemeMode = () => {
  const stored = localStorage.getItem("themeMode");
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function Root() {
  const [themeMode, setThemeMode] = React.useState(getInitialThemeMode);
  const theme = React.useMemo(() => createAppTheme(themeMode), [themeMode]);

  const toggleThemeMode = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    localStorage.setItem("themeMode", next);
    setThemeMode(next);
  };

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
      <CssBaseline />
      <App themeMode={themeMode} toggleThemeMode={toggleThemeMode} />
    </ThemeProvider>
  );
}

const root = createRoot(document.querySelector("#root"));
root.render(<Root />);
