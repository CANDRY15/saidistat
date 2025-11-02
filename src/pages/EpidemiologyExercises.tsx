import { Card } from "@/components/ui/card";
import Navigation from "@/components/Navigation";
import { Link, useNavigate } from "react-router-dom";
import { Activity, BarChart3, FileSearch, TestTube, TrendingUp, Users } from "lucide-react";

const exerciseTypes = [
  {
    id: "diagnostic-test",
    title: "Test Diagnostique (Sensibilité & Spécificité)",
    description: "Calculer la sensibilité, spécificité, VPP, VPN d'un test diagnostique",
    icon: TestTube,
    path: "/epidemiology/diagnostic-test",
    color: "bg-blue-500",
  },
  {
    id: "cohort-study",
    title: "Étude de Cohorte (E+/E-)",
    description: "Calculer RR, RA, FER pour les études de cohorte exposé/non-exposé",
    icon: Users,
    path: "/epidemiology/cohort-study",
    color: "bg-green-500",
  },
  {
    id: "case-control",
    title: "Étude Cas-Témoins",
    description: "Calculer OR, FER, IC95% pour les études cas-témoins",
    icon: FileSearch,
    path: "/epidemiology/case-control",
    color: "bg-purple-500",
  },
  {
    id: "frequency-measures",
    title: "Mesures de Fréquence",
    description: "Calculer incidence, prévalence, densité d'incidence",
    icon: TrendingUp,
    path: "/epidemiology/frequency-measures",
    color: "bg-orange-500",
  },
  {
    id: "mortality-rates",
    title: "Taux de Mortalité",
    description: "Calculer mortalité brute, spécifique, proportionnelle, létalité",
    icon: BarChart3,
    path: "/epidemiology/mortality-rates",
    color: "bg-red-500",
  },
  {
    id: "study-identifier",
    title: "Identifier le Type d'Étude",
    description: "Assistant pour identifier le type d'étude épidémiologique",
    icon: Activity,
    path: "/epidemiology/study-identifier",
    color: "bg-indigo-500",
  },
];

export default function EpidemiologyExercises() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/dashboard" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour au tableau de bord
          </Link>
          <h1 className="text-3xl font-bold text-primary">BioStasmarT</h1>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Exercices d'Épidémiologie</h2>
            <p className="text-lg text-muted-foreground">
              Résolvez vos exercices pratiques d'épidémiologie avec calculs détaillés
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {exerciseTypes.map((exercise) => (
              <Card
                key={exercise.id}
                className="p-6 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => navigate(exercise.path)}
              >
                <div className="flex flex-col gap-4">
                  <div className={`${exercise.color} w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <exercise.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {exercise.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {exercise.description}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card className="p-6 bg-muted/50">
            <h3 className="text-xl font-semibold mb-4">Comment utiliser ?</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Sélectionnez le type d'exercice correspondant à votre problème</li>
              <li>• Entrez les données de votre exercice dans les champs appropriés</li>
              <li>• Le système calculera automatiquement tous les résultats avec formules</li>
              <li>• Les calculs détaillés et interprétations sont affichés pas à pas</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
