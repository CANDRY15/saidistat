import { Link } from "react-router-dom";
import { Github, Linkedin, Mail } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo-new.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-12 w-auto">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="h-full w-auto object-contain" />
              </div>
            </Link>
            <p className="text-sm text-muted-foreground">
              Plateforme d'analyse biostatistique et de rédaction scientifique pour les professionnels de santé.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Plateforme</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/features" className="text-muted-foreground hover:text-primary transition-colors">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-primary transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-muted-foreground hover:text-primary transition-colors">
                  Commencer
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Ressources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/documentation" className="text-muted-foreground hover:text-primary transition-colors">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/tutorials" className="text-muted-foreground hover:text-primary transition-colors">
                  Tutoriels
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                contact@saidistat.com
              </li>
            </ul>
            <div className="flex items-center gap-3 mt-4">
              <a 
                href="#" 
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a 
                href="#" 
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} SaidiStat. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
