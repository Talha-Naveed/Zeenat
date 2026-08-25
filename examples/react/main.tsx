import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Example } from "./Example";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Example />
  </StrictMode>,
);
