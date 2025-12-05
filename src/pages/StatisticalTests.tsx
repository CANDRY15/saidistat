import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowLeft, TrendingUp } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const StatisticalTests = () => {
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  const tests = [
    {
      id: "chi2",
      name: "Test du Khi²",
      description: "Test d'indépendance entre deux variables qualitatives",
      category: "Qualitatif",
      icon: "📊",
    },
    {
      id: "ttest",
      name: "Test t de Student",
      description: "Comparaison de moyennes entre deux groupes",
      category: "Quantitatif",
      icon: "📈",
    },
    {
      id: "anova",
      name: "ANOVA",
      description: "Comparaison de moyennes entre plusieurs groupes",
      category: "Quantitatif",
      icon: "📉",
    },
    {
      id: "mannwhitney",
      name: "Test de Mann-Whitney",
      description: "Alternative non-paramétrique au test t",
      category: "Non-paramétrique",
      icon: "🔢",
    },
    {
      id: "pearson",
      name: "Corrélation de Pearson",
      description: "Mesure de la corrélation linéaire entre deux variables",
      category: "Corrélation",
      icon: "🔗",
    },
    {
      id: "spearman",
      name: "Corrélation de Spearman",
      description: "Corrélation de rang entre deux variables",
      category: "Corrélation",
      icon: "🔗",
    },
    {
      id: "regression",
      name: "Régression linéaire",
      description: "Modélisation de la relation entre variables",
      category: "Régression",
      icon: "📐",
    },
    {
      id: "logistic",
      name: "Régression logistique",
      description: "Prédiction d'une variable binaire",
      category: "Régression",
      icon: "📐",
    },
  ];

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
            Tests statistiques
          </h1>
          <p className="text-xl text-muted-foreground">
            Plus de 10 tests statistiques avec explications détaillées et interprétations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tests List */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test) => (
                <Card
                  key={test.id}
                  className="transition-all duration-300 hover:shadow-lg border-border hover:border-primary/50"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{test.icon}</span>
                      <Badge variant="secondary">{test.category}</Badge>
                    </div>
                    <CardTitle className="text-lg">{test.name}</CardTitle>
                    <CardDescription>{test.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/tests/${test.id}`}>
                      <Button variant="outline" className="w-full" size="sm">
                        <Calculator className="w-4 h-4 mr-2" />
                        Utiliser ce test
                      </Button>
                    </Link>
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
                  <TrendingUp className="w-5 h-5" />
                  Assistant de choix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Pas sûr du test à utiliser ? Notre assistant vous guide selon :
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Le type de vos variables</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Le nombre de groupes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>La distribution des données</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>Vos hypothèses de recherche</span>
                  </li>
                </ul>
                <Link to="/tests/assistant">
                  <Button className="w-full" variant="hero">
                    Lancer l'assistant
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fonctionnalités</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Formules détaillées</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Calculs pas à pas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-accent"></span>
                  <span>Interprétation automatique</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  <span>Graphiques explicatifs</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  <span>Export des résultats</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatisticalTests;
