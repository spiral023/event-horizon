import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Voting from "./pages/Voting";
import CampaignDetail from "./pages/CampaignDetail";
import QRScan from "./pages/QRScan";
import CreateCampaign from "./pages/CreateCampaign";
import QRCreate from "./pages/QRCreate";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/create" element={<CreateCampaign />} />
            <Route path="/voting/:id" element={<Voting />} />
            <Route path="/campaign/:id" element={<CampaignDetail />} />
            <Route path="/qr-scan" element={<QRScan />} />
            <Route path="/qr-create" element={<QRCreate />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
