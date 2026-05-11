import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home.page";
import DifferentiatorPage from "./pages/differetiator.page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/diff" element={<DifferentiatorPage />} />
    </Routes>
  );
}
