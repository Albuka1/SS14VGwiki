import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/app/AppShell";
import { ContentPage } from "@/pages/ContentPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rules" element={<ContentPage />} />
        <Route path="/:section" element={<ContentPage />} />
        <Route path="/:section/:slug" element={<ContentPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}
