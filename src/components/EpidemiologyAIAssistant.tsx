import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AIAnalysisResult {
  studyType: "cohort" | "case-control" | "diagnostic" | "frequency" | "mortality";
  studyTypeName: string;
  explanation: string;
  values: {
    a: number | null;
    b: number | null;
    c: number | null;
    d: number | null;
  };
  extractionDetails: string;
  confidence: "high" | "medium" | "low";
}

export default function EpidemiologyAIAssistant() {
  const [exerciseText, setExerciseText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const analyzeExercise = async () => {
    if (!exerciseText.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un exercice à analyser",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("epidemiology-ai", {
        body: { exerciseText },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      toast({
        title: "Analyse terminée",
        description: `Type d'étude identifié: ${data.studyTypeName}`,
      });
    } catch (error: any) {
      console.error("Analysis error:", error);
      toast({
        title: "Erreur d'analyse",
        description: error.message || "Une erreur est survenue lors de l'analyse",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const goToCalculator = () => {
    if (!result) return;

    const pathMap: Record<string, string> = {
      "cohort": "/epidemiology/cohort-study",
      "case-control": "/epidemiology/case-control",
      "diagnostic": "/epidemiology/diagnostic-test",
      "frequency": "/epidemiology/frequency-measures",
      "mortality": "/epidemiology/mortality-rates",
    };

    const path = pathMap[result.studyType];
    if (path && result.values) {
      // Store values in sessionStorage for the calculator to use
      sessionStorage.setItem("epidemiology-ai-values", JSON.stringify(result.values));
      sessionStorage.setItem("epidemiology-ai-exercise", exerciseText);
      navigate(path);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-red-600 bg-red-100";
      default: return "text-muted-foreground bg-muted";
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case "high": return "Confiance élevée";
      case "medium": return "Confiance moyenne";
      case "low": return "Confiance faible";
      default: return confidence;
    }
  };

  return (
    <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-background">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            Assistant IA
            <Sparkles className="w-4 h-4 text-yellow-500" />
          </h3>
          <p className="text-sm text-muted-foreground">
            Collez votre exercice, l'IA identifie le type et extrait les valeurs
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder="Collez ici votre exercice d'épidémiologie...

Exemple: L'étude menée en RDC pour évaluer l'association entre l'infection génitale et l'incontinence urinaire chez les jeunes adultes, a révélé que 69% de 750 jeunes adultes souffrant de l'incontinence urinaire et 17% de 600 jeunes adultes ne souffrant pas de l'incontinence urinaire ont déclaré avoir souffert d'une infection génitale dans le passé."
          value={exerciseText}
          onChange={(e) => setExerciseText(e.target.value)}
          className="min-h-[150px] resize-y"
        />

        <Button 
          onClick={analyzeExercise} 
          disabled={isAnalyzing || !exerciseText.trim()}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analyser avec l'IA
            </>
          )}
        </Button>

        {result && (
          <div className="mt-6 space-y-4 animate-in fade-in-50 duration-500">
            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">{result.studyTypeName}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(result.confidence)}`}>
                  {getConfidenceLabel(result.confidence)}
                </span>
              </div>
              
              <p className="text-sm text-muted-foreground">{result.explanation}</p>

              {result.values && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Valeurs extraites :</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-background rounded border">
                      <span className="text-xs text-muted-foreground">A:</span>
                      <span className="ml-2 font-mono font-bold">
                        {result.values.a ?? "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-xs text-muted-foreground">B:</span>
                      <span className="ml-2 font-mono font-bold">
                        {result.values.b ?? "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-xs text-muted-foreground">C:</span>
                      <span className="ml-2 font-mono font-bold">
                        {result.values.c ?? "N/A"}
                      </span>
                    </div>
                    <div className="p-2 bg-background rounded border">
                      <span className="text-xs text-muted-foreground">D:</span>
                      <span className="ml-2 font-mono font-bold">
                        {result.values.d ?? "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2 italic">
                {result.extractionDetails}
              </p>
            </div>

            <Button 
              onClick={goToCalculator}
              className="w-full"
              variant="secondary"
            >
              Aller au calculateur avec ces valeurs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
