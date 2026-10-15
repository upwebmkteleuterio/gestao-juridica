import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { iniciarMonitorDeSessao } from "@/lib/sessao";
import "./globals.css";

iniciarMonitorDeSessao();
createRoot(document.getElementById("root")!).render(<App />);
