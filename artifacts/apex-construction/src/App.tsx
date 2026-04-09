import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import MobileCTA from "@/components/MobileCTA";
import AdminLayout from "@/components/AdminLayout";
import HomePage from "@/pages/home";
import ServicesPage from "@/pages/services";
import ProjectsPage from "@/pages/projects";
import ReviewsPage from "@/pages/reviews";
import AboutPage from "@/pages/about";
import ContactPage from "@/pages/contact";
import QuotePage from "@/pages/quote";
import AdminDashboard from "@/pages/admin/index";
import AdminLeads from "@/pages/admin/leads";
import AdminLeadDetail from "@/pages/admin/lead-detail";
import AdminQuotes from "@/pages/admin/quotes";
import AdminQuoteDetail from "@/pages/admin/quote-detail";

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

      {/* Admin Area */}
      <Route path="/admin">
        <AdminLayout><AdminDashboard /></AdminLayout>
      </Route>
      <Route path="/admin/leads">
        <AdminLayout><AdminLeads /></AdminLayout>
      </Route>
      <Route path="/admin/leads/:id">
        <AdminLayout><AdminLeadDetail /></AdminLayout>
      </Route>
      <Route path="/admin/quotes">
        <AdminLayout><AdminQuotes /></AdminLayout>
      </Route>
      <Route path="/admin/quotes/:id">
        <AdminLayout><AdminQuoteDetail /></AdminLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
