import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileCTA from "@/components/MobileCTA";
import AdminLayout from "@/components/AdminLayout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/hooks/useAuth";
import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import ProjectsPage from "@/pages/projects";
import ReviewsPage from "@/pages/reviews";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import QuotePage from "@/pages/quote";
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/index";
import AdminLeads from "@/pages/admin/leads";
import AdminLeadDetail from "@/pages/admin/lead-detail";
import AdminQuotes from "@/pages/admin/quotes";
import AdminQuoteDetail from "@/pages/admin/quote-detail";
import AdminOpportunities from "@/pages/admin/opportunities";
import AdminOpportunityDetail from "@/pages/admin/opportunity-detail";
import AdminOpportunitySources from "@/pages/admin/opportunity-sources";
import AdminOpportunityRules from "@/pages/admin/opportunity-rules";
import AdminOpportunitySyncLog from "@/pages/admin/opportunity-sync-log";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <MobileCTA />
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public Pages */}
      <Route path="/">
        <PublicLayout><HomePage /></PublicLayout>
      </Route>
      <Route path="/services">
        <PublicLayout><ServicesPage /></PublicLayout>
      </Route>
      <Route path="/projects">
        <PublicLayout><ProjectsPage /></PublicLayout>
      </Route>
      <Route path="/reviews">
        <PublicLayout><ReviewsPage /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><AboutPage /></PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout><ContactPage /></PublicLayout>
      </Route>
      <Route path="/quote">
        <PublicLayout><QuotePage /></PublicLayout>
      </Route>

      {/* Admin Login */}
      <Route path="/admin/login">
        <AdminLogin />
      </Route>

      {/* Admin Area (protected) */}
      <Route path="/admin">
        <ProtectedRoute><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/leads">
        <ProtectedRoute><AdminLayout><AdminLeads /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/leads/:id">
        <ProtectedRoute><AdminLayout><AdminLeadDetail /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/quotes">
        <ProtectedRoute><AdminLayout><AdminQuotes /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/quotes/:id">
        <ProtectedRoute><AdminLayout><AdminQuoteDetail /></AdminLayout></ProtectedRoute>
      </Route>

      {/* Opportunities — static routes before :id */}
      <Route path="/admin/opportunities/sources">
        <ProtectedRoute><AdminLayout><AdminOpportunitySources /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/opportunities/rules">
        <ProtectedRoute><AdminLayout><AdminOpportunityRules /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/opportunities/sync-log">
        <ProtectedRoute><AdminLayout><AdminOpportunitySyncLog /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/opportunities/:id">
        <ProtectedRoute><AdminLayout><AdminOpportunityDetail /></AdminLayout></ProtectedRoute>
      </Route>
      <Route path="/admin/opportunities">
        <ProtectedRoute><AdminLayout><AdminOpportunities /></AdminLayout></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
