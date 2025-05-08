import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { RefreshCw, Menu } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface NavbarProps {
  toggleSidebar: () => void;
  lastRefreshed: Date;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Navbar({ toggleSidebar, lastRefreshed, onRefresh, isRefreshing }: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm fixed top-0 left-0 right-0 z-10">
      <div className="mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                <Menu className="h-6 w-6" />
              </Button>
              <span className="ml-3 text-xl font-bold text-primary-600 dark:text-primary-400">
                Spring Boot K8s Monitor
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Last refresh: <span>{formatDate(lastRefreshed)}</span>
            </div>
            <Button 
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="bg-primary-500 hover:bg-primary-600 text-white py-1 px-3 rounded text-sm flex items-center gap-1"
            >
              {isRefreshing && <RefreshCw className="h-4 w-4 animate-spin" />}
              {!isRefreshing && <RefreshCw className="h-4 w-4" />}
              Refresh Now
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
