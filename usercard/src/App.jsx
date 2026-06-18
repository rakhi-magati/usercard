import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
function App() {


  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);

  const [darkMode, setDarkMode] =
    useState(
      localStorage.getItem("theme") ===
      "dark"
    );
  useEffect(() => {

    if (darkMode) {

      document.body.classList.add(
        "dark-theme"
      );

      document.body.classList.remove(
        "light-theme"
      );

      localStorage.setItem(
        "theme",
        "dark"
      );

    } else {

      document.body.classList.add(
        "light-theme"
      );

      document.body.classList.remove(
        "dark-theme"
      );

      localStorage.setItem(
        "theme",
        "light"
      );
    }

  }, [darkMode]);

  return (
    <AppRoutes
      darkMode={darkMode}
      setDarkMode={setDarkMode}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
    />
  );
}

export default App;