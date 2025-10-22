import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Probability = () => {
  const [problemType, setProblemType] = useState("independent");
  const [prob1, setProb1] = useState("");
  const [prob2, setProb2] = useState("");
  const [n, setN] = useState("");
  const [k, setK] = useState("");
  const [result, setResult] = useState<number | null>(null);
  const [explanation, setExplanation] = useState("");

  const factorial = (num: number): number => {
    if (num <= 1) return 1;
    return num * factorial(num - 1);
  };

  const combination = (n: number, k: number): number => {
    return factorial(n) / (factorial(k) * factorial(n - k));
  };

  const calculateProbability = () => {
    try {
      const p1 = parseFloat(prob1);
      const p2 = prob2 ? parseFloat(prob2) : 0;
      const nVal = n ? parseInt(n) : 0;
      const kVal = k ? parseInt(k) : 0;

      if (isNaN(p1) || p1 < 0 || p1 > 1) {
        toast.error("La probabilité doit être entre 0 et 1");
        return;
      }

      let calcResult = 0;
      let exp = "";

      switch (problemType) {
        case "independent":
          if (!prob2) {
            toast.error("Veuillez entrer la deuxième probabilité");
            return;
          }
          if (isNaN(p2) || p2 < 0 || p2 > 1) {
            toast.error("La deuxième probabilité doit être entre 0 et 1");
            return;
          }
          calcResult = p1 * p2;
          exp = `Pour des événements indépendants, on multiplie les probabilités:\nP(A et B) = P(A) × P(B) = ${p1} × ${p2} = ${calcResult.toFixed(6)}`;
          break;

        case "multiple":
          if (!n) {
            toast.error("Veuillez entrer le nombre d'événements");
            return;
          }
          calcResult = Math.pow(p1, nVal);
          exp = `Pour ${nVal} événements indépendants identiques:\nP = p^n = ${p1}^${nVal} = ${calcResult.toFixed(6)}`;
          break;

        case "binomial":
          if (!n || !k) {
            toast.error("Veuillez entrer n et k");
            return;
          }
          const coef = combination(nVal, kVal);
          calcResult = coef * Math.pow(p1, kVal) * Math.pow(1 - p1, nVal - kVal);
          exp = `Loi binomiale:\nP(X = ${kVal}) = C(${nVal},${kVal}) × p^${kVal} × (1-p)^${nVal - kVal}\n= ${coef} × ${p1}^${kVal} × ${(1 - p1).toFixed(4)}^${nVal - kVal}\n= ${calcResult.toFixed(6)}`;
          break;

        case "complement":
          calcResult = 1 - p1;
          exp = `Probabilité complémentaire:\nP(A̅) = 1 - P(A) = 1 - ${p1} = ${calcResult.toFixed(6)}`;
          break;

        case "union":
          if (!prob2) {
            toast.error("Veuillez entrer la deuxième probabilité");
            return;
          }
          calcResult = p1 + p2 - (p1 * p2);
          exp = `Union de deux événements indépendants:\nP(A ou B) = P(A) + P(B) - P(A et B)\n= ${p1} + ${p2} - (${p1} × ${p2})\n= ${calcResult.toFixed(6)}`;
          break;
      }

      setResult(calcResult);
      setExplanation(exp);
      toast.success("Probabilité calculée avec succès !");
    } catch (error) {
      toast.error("Erreur lors du calcul");
      console.error(error);
    }
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
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Calcul de Probabilités
            </h1>
            <p className="text-lg text-muted-foreground">
              Résolvez vos problèmes de probabilités
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration du problème</CardTitle>
                <CardDescription>
                  Sélectionnez le type de problème et entrez les valeurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de problème</Label>
                  <Select value={problemType} onValueChange={setProblemType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Événements indépendants (A et B)</SelectItem>
                      <SelectItem value="multiple">Événements multiples identiques</SelectItem>
                      <SelectItem value="binomial">Loi binomiale</SelectItem>
                      <SelectItem value="complement">Probabilité complémentaire</SelectItem>
                      <SelectItem value="union">Union (A ou B)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Probabilité 1 (p)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 0.30 ou 30%"
                    value={prob1}
                    onChange={(e) => setProb1(e.target.value)}
                    step="0.01"
                    min="0"
                    max="1"
                  />
                </div>

                {(problemType === "independent" || problemType === "union") && (
                  <div className="space-y-2">
                    <Label>Probabilité 2 (p2)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 0.70 ou 70%"
                      value={prob2}
                      onChange={(e) => setProb2(e.target.value)}
                      step="0.01"
                      min="0"
                      max="1"
                    />
                  </div>
                )}

                {(problemType === "multiple" || problemType === "binomial") && (
                  <div className="space-y-2">
                    <Label>Nombre d'essais (n)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 4"
                      value={n}
                      onChange={(e) => setN(e.target.value)}
                      min="1"
                    />
                  </div>
                )}

                {problemType === "binomial" && (
                  <div className="space-y-2">
                    <Label>Nombre de succès souhaités (k)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 2"
                      value={k}
                      onChange={(e) => setK(e.target.value)}
                      min="0"
                    />
                  </div>
                )}

                <div className="text-sm bg-muted p-3 rounded-lg">
                  <p className="font-semibold mb-2">Exemple (UNILU 2023-2024):</p>
                  <p className="italic text-muted-foreground">
                    Une consultation médicale est fréquentée par 70% d'hommes et 30% de femmes. 
                    Quatre personnes sont dans la salle d'attente. Quelle est la probabilité que 
                    ces quatre personnes soient des femmes ?
                  </p>
                  <p className="mt-2 text-xs">
                    Solution: Type "Événements multiples", p = 0.30, n = 4
                  </p>
                </div>

                <Button onClick={calculateProbability} className="w-full" size="lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculer la probabilité
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résultat</CardTitle>
                <CardDescription>
                  La probabilité calculée apparaîtra ici
                </CardDescription>
              </CardHeader>
              <CardContent>
                {result !== null ? (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-6 rounded-lg text-center border-2 border-primary/30">
                      <p className="text-sm text-muted-foreground mb-2">Probabilité</p>
                      <p className="text-4xl font-bold">{result.toFixed(6)}</p>
                      <p className="text-2xl font-semibold mt-2 text-primary">
                        {(result * 100).toFixed(4)}%
                      </p>
                    </div>

                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-semibold mb-2">Explication du calcul:</h3>
                      <pre className="text-sm whitespace-pre-wrap text-muted-foreground font-mono">
                        {explanation}
                      </pre>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <h3 className="font-semibold mb-2">Formules de base:</h3>
                      <div className="text-sm space-y-2 text-muted-foreground">
                        <p>• <strong>Indépendants:</strong> P(A∩B) = P(A) × P(B)</p>
                        <p>• <strong>Complémentaire:</strong> P(A̅) = 1 - P(A)</p>
                        <p>• <strong>Union:</strong> P(A∪B) = P(A) + P(B) - P(A∩B)</p>
                        <p>• <strong>Binomiale:</strong> P(X=k) = C(n,k) × p^k × (1-p)^(n-k)</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Configurez votre problème et cliquez sur "Calculer"</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Probability;
