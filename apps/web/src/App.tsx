import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import type { ReactElement } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/contexts/AuthContext";
import PageTransition from "@/components/PageTransition";

const Index = lazy(() => import("./pages/Index"));
const PreorderPage = lazy(() => import("./pages/PreorderPage"));
const AccountPage = lazy(() => import("./pages/AccountPage"));
const SimpleAuthPage = lazy(() => import("./pages/SimpleAuthPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();

  const wrap = (element: ReactElement) => <PageTransition>{element}</PageTransition>;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={wrap(<Index />)} />
        <Route path="/preorder" element={wrap(<PreorderPage />)} />
        <Route path="/account" element={wrap(<AccountPage />)} />
        <Route path="/login" element={wrap(<SimpleAuthPage />)} />
        <Route path="/auth" element={wrap(<SimpleAuthPage />)} />
        <Route path="/signup" element={wrap(<SimpleAuthPage />)} />
        <Route path="/register" element={wrap(<SimpleAuthPage />)} />
        <Route path="/auth/callback" element={wrap(<SimpleAuthPage />)} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={wrap(<NotFound />)} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<RouteFallback />}>
            <AnimatedRoutes />
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
