import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import saidistatLogo from "@/assets/saidistat-logo.jpg";

const Navigation = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg group-hover:shadow-xl transition-shadow">
              <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              SaidiStat
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-foreground hover:text-primary transition-colors">
              Accueil
            </Link>
            <Link to="/features" className="text-foreground hover:text-primary transition-colors">
              Fonctionnalités
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              À propos
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">
                Connexion
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
