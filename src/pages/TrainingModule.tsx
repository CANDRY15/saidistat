import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowLeft, BookOpen, CheckCircle2, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

const TrainingModule = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);

  const modules = {
    basics: {
      name: "Les bases des biostatistiques",
      description: "Introduction aux concepts fondamentaux",
      icon: "📊",
      lessons: [
        { id: "1", title: "Introduction aux statistiques", duration: "15 min", completed: false },
        { id: "2", title: "Types de variables", duration: "20 min", completed: false },
        { id: "3", title: "Mesures de tendance centrale", duration: "25 min", completed: false },
        { id: "4", title: "Mesures de dispersion", duration: "20 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Identifier les types de variables", difficulty: "Facile", points: 10 },
        { id: "2", title: "Calculer moyenne et médiane", difficulty: "Facile", points: 15 },
        { id: "3", title: "Analyse de données descriptives", difficulty: "Moyen", points: 20 },
      ],
    },
    chi2: {
      name: "Test du Khi²",
      description: "Maîtriser le test d'indépendance",
      icon: "🔢",
      lessons: [
        { id: "1", title: "Qu'est-ce que le test du Khi²?", duration: "15 min", completed: false },
        { id: "2", title: "Hypothèses et conditions d'application", duration: "20 min", completed: false },
        { id: "3", title: "Calcul du Khi² pas à pas", duration: "30 min", completed: false },
        { id: "4", title: "Interprétation des résultats", duration: "25 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Vérifier les conditions d'application", difficulty: "Facile", points: 10 },
        { id: "2", title: "Calculer le Khi² observé", difficulty: "Moyen", points: 20 },
        { id: "3", title: "Cas pratique complet", difficulty: "Difficile", points: 30 },
      ],
    },
    ttest: {
      name: "Tests t et comparaisons",
      description: "Comparaison de moyennes",
      icon: "📈",
      lessons: [
        { id: "1", title: "Introduction aux tests t", duration: "15 min", completed: false },
        { id: "2", title: "Test t de Student pour échantillons indépendants", duration: "25 min", completed: false },
        { id: "3", title: "Test t pour échantillons appariés", duration: "25 min", completed: false },
        { id: "4", title: "Conditions d'application et alternatives", duration: "20 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Choisir le bon test t", difficulty: "Facile", points: 10 },
        { id: "2", title: "Test t indépendant", difficulty: "Moyen", points: 20 },
        { id: "3", title: "Test t apparié", difficulty: "Moyen", points: 20 },
        { id: "4", title: "Cas clinique complet", difficulty: "Difficile", points: 30 },
      ],
    },
    regression: {
      name: "Régression et corrélation",
      description: "Modélisation statistique avancée",
      icon: "📐",
      lessons: [
        { id: "1", title: "Corrélation de Pearson", duration: "20 min", completed: false },
        { id: "2", title: "Régression linéaire simple", duration: "30 min", completed: false },
        { id: "3", title: "Régression linéaire multiple", duration: "35 min", completed: false },
        { id: "4", title: "Diagnostic et validation du modèle", duration: "25 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Calculer une corrélation", difficulty: "Facile", points: 15 },
        { id: "2", title: "Régression simple", difficulty: "Moyen", points: 25 },
        { id: "3", title: "Régression multiple", difficulty: "Difficile", points: 35 },
      ],
    },
    methodology: {
      name: "Méthodologie de recherche",
      description: "Conception d'études et protocoles",
      icon: "🔬",
      lessons: [
        { id: "1", title: "Types d'études en recherche médicale", duration: "20 min", completed: false },
        { id: "2", title: "Élaboration d'un protocole de recherche", duration: "30 min", completed: false },
        { id: "3", title: "Calcul de taille d'échantillon", duration: "25 min", completed: false },
        { id: "4", title: "Biais et validité", duration: "20 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Identifier le type d'étude approprié", difficulty: "Moyen", points: 20 },
        { id: "2", title: "Calculer une taille d'échantillon", difficulty: "Difficile", points: 30 },
        { id: "3", title: "Analyser les biais d'une étude", difficulty: "Difficile", points: 30 },
      ],
    },
    interpretation: {
      name: "Interprétation des résultats",
      description: "Analyser et présenter les données",
      icon: "💡",
      lessons: [
        { id: "1", title: "Comprendre la p-value", duration: "20 min", completed: false },
        { id: "2", title: "Intervalles de confiance", duration: "25 min", completed: false },
        { id: "3", title: "Signification statistique vs clinique", duration: "20 min", completed: false },
        { id: "4", title: "Présenter les résultats", duration: "25 min", completed: false },
      ],
      exercises: [
        { id: "1", title: "Interpréter des p-values", difficulty: "Facile", points: 15 },
        { id: "2", title: "Calculer des intervalles de confiance", difficulty: "Moyen", points: 20 },
        { id: "3", title: "Rédiger une section Résultats", difficulty: "Difficile", points: 35 },
      ],
    },
  };

  const currentModule = moduleId ? modules[moduleId as keyof typeof modules] : null;

  if (!currentModule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Module non trouvé</CardTitle>
            <CardDescription>Ce module de formation n'existe pas.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/training">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux formations
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = completedLessons.length > 0 
    ? Math.round((completedLessons.length / currentModule.lessons.length) * 100)
    : 0;

  const handleStartLesson = (lessonId: string) => {
    toast.success("Leçon commencée !");
    if (!completedLessons.includes(lessonId)) {
      setCompletedLessons([...completedLessons, lessonId]);
    }
  };

  const handleStartExercise = (exerciseId: string) => {
    toast.info("Les exercices interactifs seront bientôt disponibles !");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </Link>
            <Link to="/training">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux formations
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        {/* Module Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-6xl">{currentModule.icon}</span>
            <div>
              <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {currentModule.name}
              </h1>
              <p className="text-xl text-muted-foreground">
                {currentModule.description}
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progression du module</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="lessons" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="lessons">
              <BookOpen className="w-4 h-4 mr-2" />
              Leçons
            </TabsTrigger>
            <TabsTrigger value="exercises">
              <Play className="w-4 h-4 mr-2" />
              Exercices
            </TabsTrigger>
          </TabsList>

          <TabsContent value="lessons" className="space-y-4">
            <div className="grid gap-4">
              {currentModule.lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className={completedLessons.includes(lesson.id) ? "border-primary bg-primary/5" : ""}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {completedLessons.includes(lesson.id) && (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          )}
                          {lesson.title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          ⏱️ {lesson.duration}
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => handleStartLesson(lesson.id)}
                        variant={completedLessons.includes(lesson.id) ? "outline" : "default"}
                        size="sm"
                      >
                        {completedLessons.includes(lesson.id) ? "Revoir" : "Commencer"}
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="exercises" className="space-y-4">
            <div className="grid gap-4">
              {currentModule.exercises.map((exercise) => (
                <Card key={exercise.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{exercise.title}</CardTitle>
                          <Badge variant="secondary">
                            {exercise.difficulty}
                          </Badge>
                        </div>
                        <CardDescription>
                          🏆 {exercise.points} points
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => handleStartExercise(exercise.id)}
                        size="sm"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Démarrer
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default TrainingModule;
