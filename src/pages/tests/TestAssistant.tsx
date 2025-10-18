import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const TestAssistant = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [variableType, setVariableType] = useState("");
  const [groupCount, setGroupCount] = useState("");
  const [recommendation, setRecommendation] = useState<string | null>(null);

  const handleNext = () => {
    if (step === 1 && variableType) {
      setStep(2);
    } else if (step === 2 && groupCount) {
      // Logique de recommandation simplifiée
      if (variableType === "qualitative" && groupCount === "2") {
        setRecommendation("chi2");
      } else if (variableType === "quantitative" && groupCount === "2") {
        setRecommendation("ttest");
      } else if (variableType === "quantitative" && groupCount === "3+") {
        setRecommendation("anova");
      }
      setStep(3);
    }
  };

  const handleUseTest = () => {
    if (recommendation === "chi2") navigate("/tests/chi2");
    else if (recommendation === "ttest") navigate("/tests/ttest");
    else if (recommendation === "anova") navigate("/tests/anova");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
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
            <Link to="/statistical-tests">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Assistant de choix de test
          </h1>
          <p className="text-xl text-muted-foreground">
            Répondez aux questions pour trouver le test adapté
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle>Étape {step} sur 2</CardTitle>
                <div className="flex gap-2">
                  {[1, 2].map((s) => (
                    <div
                      key={s}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        s <= step ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
                    </div>
                  ))}
                </div>
              </div>
              <CardDescription>
                {step === 1 && "Quel est le type de vos variables ?"}
                {step === 2 && "Combien de groupes comparez-vous ?"}
                {step === 3 && "Recommandation de test"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {step === 1 && (
                <RadioGroup value={variableType} onValueChange={setVariableType}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="qualitative" id="qualitative" />
                      <Label htmlFor="qualitative" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-medium">Variables qualitatives</p>
                          <p className="text-sm text-muted-foreground">Ex: Genre, Catégorie, Type</p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="quantitative" id="quantitative" />
                      <Label htmlFor="quantitative" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-medium">Variables quantitatives</p>
                          <p className="text-sm text-muted-foreground">Ex: Âge, Poids, Score</p>
                        </div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {step === 2 && (
                <RadioGroup value={groupCount} onValueChange={setGroupCount}>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="2" id="2groups" />
                      <Label htmlFor="2groups" className="cursor-pointer flex-1">
                        <p className="font-medium">2 groupes</p>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="3+" id="3groups" />
                      <Label htmlFor="3groups" className="cursor-pointer flex-1">
                        <p className="font-medium">3 groupes ou plus</p>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              )}

              {step === 3 && recommendation && (
                <div className="space-y-4">
                  <div className="p-6 bg-primary/10 rounded-lg text-center">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <h3 className="text-xl font-bold mb-2">
                      {recommendation === "chi2" && "Test du Khi²"}
                      {recommendation === "ttest" && "Test t de Student"}
                      {recommendation === "anova" && "ANOVA"}
                    </h3>
                    <p className="text-muted-foreground">
                      Ce test est recommandé pour vos données
                    </p>
                  </div>
                  <Button className="w-full" size="lg" onClick={handleUseTest}>
                    Utiliser ce test
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}

              {step < 3 && (
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                      Précédent
                    </Button>
                  )}
                  <Button
                    onClick={handleNext}
                    disabled={
                      (step === 1 && !variableType) || (step === 2 && !groupCount)
                    }
                    className="flex-1"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default TestAssistant;
