import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, FileText, GraduationCap, Upload, TrendingUp, Calculator } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

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
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline">Mon compte</Button>
              <Button variant="ghost" onClick={handleLogout}>Déconnexion</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Tableau de bord
          </h1>
          <p className="text-xl text-muted-foreground">
            Bienvenue sur votre espace de travail
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Link to="/data-analysis">
            <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Analyse de données</CardTitle>
                <CardDescription>
                  Importez vos datasets (CSV, Excel, SPSS) et obtenez des analyses statistiques complètes
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/statistical-tests">
            <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-secondary/50 cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-secondary to-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Calculator className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Tests statistiques</CardTitle>
                <CardDescription>
                  Plus de 10 tests : Khi², t de Student, Mann-Whitney, corrélations, régressions
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/writing">
            <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-accent/50 cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-foreground" />
                </div>
                <CardTitle>Rédaction</CardTitle>
                <CardDescription>
                  Générez automatiquement vos sections de rapport scientifique
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/training">
            <Card className="group hover:shadow-xl transition-all duration-300 border-border hover:border-primary/50 cursor-pointer h-full">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                </div>
                <CardTitle>Formation</CardTitle>
                <CardDescription>
                  Accédez aux exercices et tutoriels pour progresser
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent projects */}
        <Card>
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>
              Vos analyses et travaux en cours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Aucun projet pour le moment</p>
              <p className="text-sm">Créez votre première analyse pour commencer</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Analyses</p>
                  <p className="text-3xl font-bold text-primary">0</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Rapports</p>
                  <p className="text-3xl font-bold text-secondary">0</p>
                </div>
                <FileText className="w-8 h-8 text-secondary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Exercices</p>
                  <p className="text-3xl font-bold text-accent">0</p>
                </div>
                <GraduationCap className="w-8 h-8 text-accent opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
