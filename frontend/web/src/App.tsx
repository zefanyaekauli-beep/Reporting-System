import { AppRoutes } from "./routes/AppRoutes";
import { ToastProvider } from "./modules/shared/components/Toast";
import { SiteProvider } from "./modules/shared/contexts/SiteContext";

export function App() {
  return (
    <SiteProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </SiteProvider>
  );
}
