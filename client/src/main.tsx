import { render } from "preact";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import { App } from "./app.tsx";

render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById("app")!,
);
