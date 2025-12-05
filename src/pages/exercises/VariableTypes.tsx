import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Check, X } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { Badge } from "@/components/ui/badge";

interface Variable {
  name: string;
  type: string;
  category: string;
  explanation: string;
}

const VariableTypes = () => {
  const [selectedVariable, setSelectedVariable] = useState<Variable | null>(null);

  const variables: Variable[] = [
    {
      name: "Nombre de globules rouges",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "On compte les globules rouges (valeurs entières)"
    },
    {
      name: "Numéro de téléphone",
      type: "Qualitative nominale",
      category: "Identification",
      explanation: "Code d'identification, pas de calcul mathématique possible"
    },
    {
      name: "Glycémie",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Valeur mesurée pouvant prendre n'importe quelle valeur dans un intervalle"
    },
    {
      name: "Présence ou absence d'accident",
      type: "Qualitative nominale dichotomique",
      category: "Binaire",
      explanation: "Deux modalités sans ordre: présent/absent"
    },
    {
      name: "Être vivant ou mort",
      type: "Qualitative nominale dichotomique",
      category: "Binaire",
      explanation: "Deux modalités sans ordre: vivant/mort"
    },
    {
      name: "Sexe",
      type: "Qualitative nominale dichotomique",
      category: "Binaire",
      explanation: "Deux modalités sans ordre: masculin/féminin"
    },
    {
      name: "Évolution d'une maladie",
      type: "Qualitative ordinale",
      category: "Ordre",
      explanation: "Catégories ordonnées: amélioration > stable > aggravation"
    },
    {
      name: "Date de naissance",
      type: "Temporelle",
      category: "Date",
      explanation: "Variable temporelle, peut être transformée en âge (quantitative)"
    },
    {
      name: "Salaire mensuel (dollar)",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Valeur mesurée avec décimales possibles"
    },
    {
      name: "Nombre de cellules",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "On compte les cellules (valeurs entières)"
    },
    {
      name: "Pli cutané (mm)",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Mesure continue en millimètres"
    },
    {
      name: "Durée d'hospitalisation (jours)",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "On compte le nombre de jours (valeurs entières)"
    },
    {
      name: "Température des malades",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Mesure continue en degrés"
    },
    {
      name: "Âge (<5 ans, 5-17 ans, ≥18 ans)",
      type: "Qualitative ordinale",
      category: "Catégories ordonnées",
      explanation: "Catégories d'âge ordonnées du plus jeune au plus âgé"
    },
    {
      name: "Parité",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "Nombre d'accouchements (valeurs entières)"
    },
    {
      name: "Gestité",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "Nombre de grossesses (valeurs entières)"
    },
    {
      name: "Nombre d'avortements",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "On compte le nombre d'avortements (valeurs entières)"
    },
    {
      name: "Cholestérolémie",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Mesure continue du cholestérol dans le sang"
    },
    {
      name: "Uricémie",
      type: "Quantitative continue",
      category: "Mesure",
      explanation: "Mesure continue de l'acide urique dans le sang"
    },
    {
      name: "Profession",
      type: "Qualitative nominale",
      category: "Classification",
      explanation: "Catégories sans ordre naturel"
    },
    {
      name: "Nombre d'enfants",
      type: "Quantitative discrète",
      category: "Dénombrement",
      explanation: "On compte le nombre d'enfants (valeurs entières)"
    },
    {
      name: "Groupe sanguin",
      type: "Qualitative nominale",
      category: "Classification",
      explanation: "Catégories sans ordre: A, B, AB, O"
    },
    {
      name: "Nationalité",
      type: "Qualitative nominale",
      category: "Classification",
      explanation: "Catégories sans ordre naturel"
    },
    {
      name: "Langues nationales",
      type: "Qualitative nominale",
      category: "Classification",
      explanation: "Catégories sans ordre naturel"
    },
    {
      name: "Langues officielles de la RDC",
      type: "Qualitative nominale",
      category: "Classification",
      explanation: "Catégories sans ordre naturel"
    }
  ];

  const getTypeColor = (type: string) => {
    if (type.includes("Quantitative")) return "bg-blue-500/10 text-blue-700 dark:text-blue-300";
    if (type.includes("Qualitative ordinale")) return "bg-green-500/10 text-green-700 dark:text-green-300";
    if (type.includes("Qualitative nominale")) return "bg-purple-500/10 text-purple-700 dark:text-purple-300";
    return "bg-orange-500/10 text-orange-700 dark:text-orange-300";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/exercises" className="flex items-center gap-2 group">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Exercices
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SaidiStat
              </span>
            </div>
            <div className="w-24" />
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Types de Variables
            </h1>
            <p className="text-lg text-muted-foreground">
              Identifiez les types de variables en biostatistique
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-blue-600 dark:text-blue-400">Quantitative</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Continue:</strong> Valeurs mesurées (température, poids)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Discrète:</strong> Valeurs comptées (nombre d'enfants)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600 dark:text-green-400">Qualitative Ordinale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Catégories avec ordre naturel (léger, moyen, grave)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-purple-600 dark:text-purple-400">Qualitative Nominale</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Catégories sans ordre (groupe sanguin, profession)
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Liste des variables (UNILU 2023-2024)</CardTitle>
              <CardDescription>
                Cliquez sur une variable pour voir sa classification détaillée
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {variables.map((variable, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedVariable?.name === variable.name
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedVariable(variable)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{variable.name}</p>
                        {selectedVariable?.name === variable.name && (
                          <div className="mt-3 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={getTypeColor(variable.type)}>
                                {variable.type}
                              </Badge>
                              <Badge variant="outline">{variable.category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground italic">
                              {variable.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                      {selectedVariable?.name === variable.name && (
                        <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VariableTypes;
