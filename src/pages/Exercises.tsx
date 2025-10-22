import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, Calculator, ArrowLeft, FileText, TrendingUp, PieChart, Percent } from "lucide-react";

const Exercises = () => {
  const navigate = useNavigate();

  const exerciseTypes = [
    {
      id: "descriptive-stats",
      title: "Statistiques Descriptives",
      description: "Calculez la moyenne, écart-type, médiane, mode, étendue, coefficient de variation",
      icon: TrendingUp,
      path: "/exercises/descriptive-stats",
      color: "text-blue-500"
    },
    {
      id: "percentiles",
      title: "Calcul de Percentiles",
      description: "Calculez P25, P50 (médiane), P75 et autres percentiles",
      icon: PieChart,
      path: "/exercises/percentiles",
      color: "text-green-500"
    },
    {
      id: "probability",
      title: "Probabilités",
      description: "Résolvez des problèmes de probabilités simples et composées",
      icon: Percent,
      path: "/exercises/probability",
      color: "text-purple-500"
    },
    {
      id: "variable-types",
      title: "Types de Variables",
      description: "Identifiez les types de variables (qualitative, quantitative, etc.)",
      icon: FileText,
      path: "/exercises/variable-types",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Tableau de bord
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Exercices de Biostatistique
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Résolvez vos exercices de travaux pratiques et devoirs en entrant simplement vos données. 
              Basé sur les exercices de l'UNILU 2023-2024.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {exerciseTypes.map((exercise) => {
              const Icon = exercise.icon;
              return (
                <Card 
                  key={exercise.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50"
                  onClick={() => navigate(exercise.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Icon className={`w-6 h-6 ${exercise.color}`} />
                      </div>
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                      {exercise.title}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {exercise.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Commencer
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-2 border-primary/20">
            <CardHeader>
              <CardTitle>Comment utiliser cette section ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Choisissez le type d'exercice</h3>
                  <p className="text-muted-foreground">Sélectionnez le type d'exercice que vous devez résoudre</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Entrez vos données</h3>
                  <p className="text-muted-foreground">Saisissez les données de votre exercice dans les champs appropriés</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Obtenez les résultats</h3>
                  <p className="text-muted-foreground">Les calculs sont effectués automatiquement avec explications détaillées</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Exercises;
