
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import MedExplain from "./pages/MedExplain";
import MedicineIdentifier from "./pages/MedicineIdentifier";
import ManualMedicineEntry from "./pages/ManualMedicineEntry";
import MyMedicines from "./pages/MyMedicines";
import Dashboard from "./pages/Dashboard";
import BarcodeScannerPage from "./pages/BarcodeScannerPage";
import InteractionCheckerPage from "./pages/InteractionCheckerPage";
import SymptomChecker from "./pages/SymptomChecker";
import PrescriptionReader from "./pages/PrescriptionReader";
import CommunityQA from "./pages/CommunityQA";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/medexplain" element={<MedExplain />} />
            <Route path="/medicine-identifier" element={<MedicineIdentifier />} />
            <Route path="/manual-medicine-entry" element={<ManualMedicineEntry />} />
            <Route path="/my-medicines" element={<MyMedicines />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/barcode-scanner" element={<BarcodeScannerPage />} />
            <Route path="/interaction-checker" element={<InteractionCheckerPage />} />
            <Route path="/symptom-checker" element={<SymptomChecker />} />
            <Route path="/prescription-reader" element={<PrescriptionReader />} />
            <Route path="/community-qa" element={<CommunityQA />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
