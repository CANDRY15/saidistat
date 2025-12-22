import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, LayoutDashboard, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const Navigation = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de se déconnecter",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    }
    setIsOpen(false);
  };

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/data-analysis", label: "Analyse" },
    { to: "/exercises", label: "Exercices" },
    { to: "/epidemiology", label: "Épidémiologie" },
  ];

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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-foreground hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleLogout} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Déconnexion</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost">Connexion</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="hero">Commencer</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Nav Links */}
                  <div className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.to}>
                        <Link
                          to={link.to}
                          className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2 border-b border-border"
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </div>

                  {/* Mobile Auth Buttons */}
                  <div className="flex flex-col gap-3 pt-4">
                    {user ? (
                      <>
                        <SheetClose asChild>
                          <Link to="/dashboard">
                            <Button variant="outline" className="w-full gap-2">
                              <LayoutDashboard className="w-4 h-4" />
                              Dashboard
                            </Button>
                          </Link>
                        </SheetClose>
                        <Button
                          variant="destructive"
                          onClick={handleLogout}
                          className="w-full gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <Link to="/auth">
                            <Button variant="outline" className="w-full">
                              Connexion
                            </Button>
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link to="/auth">
                            <Button variant="hero" className="w-full">
                              Commencer
                            </Button>
                          </Link>
                        </SheetClose>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
