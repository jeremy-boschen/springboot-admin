import { Switch, Route } from "wouter";
import { Providers } from "@/components/providers";
import Dashboard from "@/pages/dashboard";
import ServicePage from "@/pages/service";
import NotFound from "@/pages/not-found";

/**
 * Router component that handles application routing
 * 
 * Includes routes for:
 * - Dashboard (home page)
 * - Service detail pages with optional section parameters
 * - 404 page for unmatched routes
 */
function Router() {
  return (
    <Switch>
      {/* Main dashboard route */}
      <Route path="/" component={Dashboard} />
      
      {/* Service routes with optional section anchors */}
      <Route path="/service/:id" component={ServicePage} />
      <Route path="/service/:id/:section" component={ServicePage} />
      
      {/* Fallback 404 route for unmatched paths */}
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Main application component
 * 
 * Wraps the router with necessary providers for state management,
 * theme handling, and other app-wide functionality
 */
function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}

export default App;
