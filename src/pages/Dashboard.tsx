import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, GraduationCap, Upload, TrendingUp, Calculator, Activity, BookOpen, User, LogOut, Clock, FolderOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ThesisProject {
  id: string;
  topic: string;
  domain: string | null;
  current_step: number | null;
  updated_at: string;
}

interface SavedAnalysis {
  id: string;
  analysis_name: string;
  analysis_type: string;
  file_name: string;
  updated_at: string | null;
}

interface UserProfile {
  full_name: string | null;
  email: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [thesisProjects, setThesisProjects] = useState<ThesisProject[]>([]);
  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoadingData(true);
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Fetch thesis projects
      const { data: thesisData } = await supabase
        .from('thesis_projects')
        .select('id, topic, domain, current_step, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (thesisData) {
        setThesisProjects(thesisData);
      }

      // Fetch saved analyses
      const { data: analysesData } = await supabase
        .from('saved_analyses')
        .select('id, analysis_name, analysis_type, file_name, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(5);
      
      if (analysesData) {
        setSavedAnalyses(analysesData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingData(false);
    }
  };

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

  const getStepLabel = (step: number | null) => {
    const steps = ['Sujet', 'Domaine', 'Type d\'étude', 'Population', 'Rédaction'];
    return steps[step || 0] || 'Démarrage';
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

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Utilisateur';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SaidiStat
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <Button variant="ghost" onClick={handleLogout} className="gap-2">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Bonjour, {displayName} 👋
          </h1>
          <p className="text-xl text-muted-foreground">
            Bienvenue sur votre espace de travail SaidiStat
          </p>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Thèses/Mémoires</p>
                  <p className="text-3xl font-bold text-primary">{thesisProjects.length}</p>
                </div>
                <BookOpen className="w-8 h-8 text-primary opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Analyses sauvées</p>
                  <p className="text-3xl font-bold text-secondary">{savedAnalyses.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-secondary opacity-70" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Projets</p>
                  <p className="text-3xl font-bold text-foreground">{thesisProjects.length + savedAnalyses.length}</p>
                </div>
                <FolderOpen className="w-8 h-8 text-accent opacity-70" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent projects */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Thesis Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Mes Thèses/Mémoires
                </CardTitle>
                <CardDescription>Vos projets de rédaction récents</CardDescription>
              </div>
              <Link to="/thesis-writing">
                <Button variant="outline" size="sm">Voir tout</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : thesisProjects.length > 0 ? (
                <div className="space-y-3">
                  {thesisProjects.map((project) => (
                    <Link key={project.id} to="/thesis-writing">
                      <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{project.topic}</h4>
                            <p className="text-sm text-muted-foreground">{project.domain || 'Domaine non défini'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                              {getStepLabel(project.current_step)}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(project.updated_at), 'dd MMM yyyy', { locale: fr })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucun projet de thèse</p>
                  <Link to="/thesis-writing">
                    <Button variant="link" className="mt-2">Commencer une thèse</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Saved Analyses */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  Mes Analyses
                </CardTitle>
                <CardDescription>Vos analyses statistiques sauvegardées</CardDescription>
              </div>
              <Link to="/data-analysis">
                <Button variant="outline" size="sm">Voir tout</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : savedAnalyses.length > 0 ? (
                <div className="space-y-3">
                  {savedAnalyses.map((analysis) => (
                    <Link key={analysis.id} to="/data-analysis">
                      <div className="p-4 rounded-lg border border-border hover:border-secondary/50 hover:bg-muted/50 transition-all cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{analysis.analysis_name}</h4>
                            <p className="text-sm text-muted-foreground">{analysis.file_name}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 ml-4">
                            <span className="text-xs px-2 py-1 bg-secondary/10 text-secondary rounded-full">
                              {analysis.analysis_type}
                            </span>
                            {analysis.updated_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(analysis.updated_at), 'dd MMM yyyy', { locale: fr })}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune analyse sauvegardée</p>
                  <Link to="/data-analysis">
                    <Button variant="link" className="mt-2">Faire une analyse</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions */}
        <h2 className="text-2xl font-bold mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Link to="/data-analysis">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-base">Analyse de données</CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/statistical-tests">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-secondary/50 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-secondary to-secondary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Calculator className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-base">Tests statistiques</CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/thesis-writing">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/50 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5 text-primary-foreground" />
                </div>
                <CardTitle className="text-base">Thèse / Mémoire</CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/epidemiology">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-destructive/50 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-destructive to-destructive/80 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="w-5 h-5 text-destructive-foreground" />
                </div>
                <CardTitle className="text-base">Épidémiologie</CardTitle>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/exercises">
            <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-accent/50 cursor-pointer h-full">
              <CardHeader className="pb-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent to-accent flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5 text-foreground" />
                </div>
                <CardTitle className="text-base">Exercices</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
