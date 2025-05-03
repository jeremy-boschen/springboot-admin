import { Switch, Route } from "wouter";
import { Providers } from "@/components/providers";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <Providers>
      <Router />
    </Providers>
  );
}

export default App;
