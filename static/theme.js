    const lightTheme = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-light.min.css";
    const darkTheme = "https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark-reasonable.min.css";

    const themeLink = document.getElementById("hljs-theme");
    const toggleBtn = document.getElementById("toggle-theme");

    function setTheme(mode) {
      const body = document.body;
      if (mode === "dark") {
        themeLink.href = darkTheme;
        body.classList.add("dark-mode");
        document.body.classList.add("dark-mode");

        toggleBtn.textContent = "Switch to Light";
      } else {
        themeLink.href = lightTheme;
        body.classList.remove("dark-mode");
        document.body.classList.remove("dark-mode");
        toggleBtn.textContent = "Switch to Dark";
      }
      localStorage.setItem("theme", mode);
    }

    // Apply saved or default theme on load
    const savedTheme = localStorage.getItem("theme") || "light";
    setTheme(savedTheme);

    toggleBtn.addEventListener("click", () => {
      const current = localStorage.getItem("theme") === "dark" ? "light" : "dark";
      setTheme(current);
    });