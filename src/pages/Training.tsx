import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowLeft, BookOpen, Award, CheckCircle } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { Link, useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const Training = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const navigate = useNavigate();

  const modules = [
    {
      id: "basics",
      name: "Les bases des biostatistiques",
      description: "Introduction aux concepts fondamentaux",
      difficulty: "Débutant",
      duration: "2h",
      progress: 0,
      exercises: 12,
      icon: "📊",
    },
    {
      id: "chi2",
      name: "Test du Khi²",
      description: "Maîtriser le test d'indépendance",
      difficulty: "Intermédiaire",
      duration: "1h30",
      progress: 0,
      exercises: 8,
      icon: "🔢",
    },
    {
      id: "ttest",
      name: "Tests t et comparaisons",
      description: "Comparaison de moyennes",
      difficulty: "Intermédiaire",
      duration: "2h",
      progress: 0,
      exercises: 10,
      icon: "📈",
    },
    {
      id: "regression",
      name: "Régression et corrélation",
      description: "Modélisation statistique avancée",
      difficulty: "Avancé",
      duration: "3h",
      progress: 0,
      exercises: 15,
      icon: "📐",
    },
    {
      id: "methodology",
      name: "Méthodologie de recherche",
      description: "Conception d'études et protocoles",
      difficulty: "Avancé",
      duration: "2h30",
      progress: 0,
      exercises: 10,
      icon: "🔬",
    },
    {
      id: "interpretation",
      name: "Interprétation des résultats",
      description: "Analyser et présenter les données",
      difficulty: "Intermédiaire",
      duration: "2h",
      progress: 0,
      exercises: 12,
      icon: "💡",
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Débutant":
        return "bg-green-500";
      case "Intermédiaire":
        return "bg-yellow-500";
      case "Avancé":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SaidiStat
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Formation & Exercices
          </h1>
          <p className="text-xl text-muted-foreground">
            Accédez aux exercices et tutoriels pour progresser en biostatistiques
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Modules List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-4">
              {modules.map((module) => (
                <Card
                  key={module.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    selectedModule === module.id
                      ? "border-primary shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <span className="text-4xl">{module.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{module.name}</CardTitle>
                            <Badge
                              variant="secondary"
                              className={`${getDifficultyColor(module.difficulty)} text-white`}
                            >
                              {module.difficulty}
                            </Badge>
                          </div>
                          <CardDescription className="mb-3">
                            {module.description}
                          </CardDescription>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>⏱️ {module.duration}</span>
                            <span>📝 {module.exercises} exercices</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progression</span>
                        <span className="font-medium">{module.progress}%</span>
                      </div>
                      <Progress value={module.progress} className="h-2" />
                      <div className="flex gap-2 mt-4">
                        <Button
                          variant={selectedModule === module.id ? "default" : "outline"}
                          className="flex-1"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/training/${module.id}`);
                          }}
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          Commencer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Votre progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-primary mb-2">0%</div>
                  <p className="text-sm text-muted-foreground">Progression globale</p>
                </div>
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Modules complétés</span>
                    <span className="font-medium">0/6</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Exercices réussis</span>
                    <span className="font-medium">0/67</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Score moyen</span>
                    <span className="font-medium">-</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Exercices interactifs avec correction</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Explications détaillées pas à pas</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Jeux de données réalistes</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Suivi de progression personnalisé</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Certificats de compétence</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <CardTitle className="text-base">💡 Conseil du jour</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Commencez par les modules débutants pour construire des bases solides avant de 
                  passer aux concepts avancés.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Training;
