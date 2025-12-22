import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, BookOpen, Activity } from "lucide-react";

const MobileBottomNav = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Accueil", icon: Home },
    { to: "/data-analysis", label: "Analyse", icon: BarChart3 },
    { to: "/exercises", label: "Exercices", icon: BookOpen },
    { to: "/epidemiology", label: "Épidémio", icon: Activity },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
