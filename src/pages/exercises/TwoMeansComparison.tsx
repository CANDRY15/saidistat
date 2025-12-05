import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { toast } from "sonner";

interface ComparisonResult {
  mean1: number;
  mean2: number;
  sd1: number;
  sd2: number;
  n1: number;
  n2: number;
  pooledSD: number;
  tStatistic: number;
  df: number;
  criticalValue: number;
  pValue: string;
  conclusion: string;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
}

const TwoMeansComparison = () => {
  const [mean1, setMean1] = useState("");
  const [mean2, setMean2] = useState("");
  const [sd1, setSd1] = useState("");
  const [sd2, setSd2] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [alpha, setAlpha] = useState("0.05");
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const getTCritical = (df: number, alphaVal: number): number => {
    // Valeurs approximatives pour un test bilatéral
    const tTable: { [key: string]: { [key: string]: number } } = {
      "0.05": {
        "10": 2.228,
        "20": 2.086,
        "30": 2.042,
        "40": 2.021,
        "50": 2.009,
        "60": 2.000,
        "80": 1.990,
        "100": 1.984,
        "120": 1.980,
        "inf": 1.96
      },
      "0.01": {
        "10": 3.169,
        "20": 2.845,
        "30": 2.750,
        "40": 2.704,
        "50": 2.678,
        "60": 2.660,
        "80": 2.639,
        "100": 2.626,
        "120": 2.617,
        "inf": 2.576
      }
    };

    const alphaKey = alphaVal.toString();
    if (!tTable[alphaKey]) return 1.96;

    if (df >= 120) return tTable[alphaKey]["inf"];
    if (df >= 100) return tTable[alphaKey]["100"];
    if (df >= 80) return tTable[alphaKey]["80"];
    if (df >= 60) return tTable[alphaKey]["60"];
    if (df >= 50) return tTable[alphaKey]["50"];
    if (df >= 40) return tTable[alphaKey]["40"];
    if (df >= 30) return tTable[alphaKey]["30"];
    if (df >= 20) return tTable[alphaKey]["20"];
    return tTable[alphaKey]["10"];
  };

  const calculateComparison = () => {
    const m1 = parseFloat(mean1);
    const m2 = parseFloat(mean2);
    const s1 = parseFloat(sd1);
    const s2 = parseFloat(sd2);
    const size1 = parseInt(n1);
    const size2 = parseInt(n2);
    const alphaVal = parseFloat(alpha);

    if (isNaN(m1) || isNaN(m2) || isNaN(s1) || isNaN(s2) || isNaN(size1) || isNaN(size2)) {
      toast.error("Veuillez entrer des valeurs numériques valides");
      return;
    }

    if (size1 < 2 || size2 < 2) {
      toast.error("La taille de chaque échantillon doit être au moins 2");
      return;
    }

    // Calcul de l'écart-type poolé
    const pooledVariance = ((size1 - 1) * s1 * s1 + (size2 - 1) * s2 * s2) / (size1 + size2 - 2);
    const pooledSD = Math.sqrt(pooledVariance);

    // Calcul de la statistique t
    const standardError = pooledSD * Math.sqrt(1/size1 + 1/size2);
    const tStat = (m1 - m2) / standardError;

    // Degrés de liberté
    const df = size1 + size2 - 2;

    // Valeur critique
    const tCrit = getTCritical(df, alphaVal);

    // Intervalle de confiance à 95%
    const marginOfError = tCrit * standardError;
    const ciLower = (m1 - m2) - marginOfError;
    const ciUpper = (m1 - m2) + marginOfError;

    // Conclusion
    let conclusion = "";
    let pValue = "";
    
    if (Math.abs(tStat) > tCrit) {
      conclusion = `La différence entre les deux moyennes est statistiquement significative (|t| = ${Math.abs(tStat).toFixed(3)} > ${tCrit.toFixed(3)}). Nous rejetons l'hypothèse nulle H0.`;
      pValue = `p < ${alphaVal}`;
    } else {
      conclusion = `La différence entre les deux moyennes n'est pas statistiquement significative (|t| = ${Math.abs(tStat).toFixed(3)} ≤ ${tCrit.toFixed(3)}). Nous ne rejetons pas l'hypothèse nulle H0.`;
      pValue = `p ≥ ${alphaVal}`;
    }

    setResult({
      mean1: m1,
      mean2: m2,
      sd1: s1,
      sd2: s2,
      n1: size1,
      n2: size2,
      pooledSD: pooledSD,
      tStatistic: tStat,
      df: df,
      criticalValue: tCrit,
      pValue: pValue,
      conclusion: conclusion,
      confidenceInterval: {
        lower: ciLower,
        upper: ciUpper
      }
    });

    toast.success("Comparaison effectuée avec succès!");
  };

  const reset = () => {
    setMean1("");
    setMean2("");
    setSd1("");
    setSd2("");
    setN1("");
    setN2("");
    setResult(null);
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Comparaison de Deux Moyennes
            </h1>
            <p className="text-lg text-muted-foreground">
              Test t de Student pour échantillons indépendants
            </p>
          </div>

          {!result ? (
            <Card>
              <CardHeader>
                <CardTitle>Données des deux échantillons</CardTitle>
                <CardDescription>
                  Entrez les statistiques descriptives pour chaque groupe
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Groupe 1</h3>
                    <div className="space-y-2">
                      <Label htmlFor="mean1">Moyenne (x̄₁)</Label>
                      <Input
                        id="mean1"
                        type="number"
                        step="any"
                        placeholder="ex: 75"
                        value={mean1}
                        onChange={(e) => setMean1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sd1">Écart-type (s₁)</Label>
                      <Input
                        id="sd1"
                        type="number"
                        step="any"
                        placeholder="ex: 10"
                        value={sd1}
                        onChange={(e) => setSd1(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n1">Taille (n₁)</Label>
                      <Input
                        id="n1"
                        type="number"
                        placeholder="ex: 30"
                        value={n1}
                        onChange={(e) => setN1(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">Groupe 2</h3>
                    <div className="space-y-2">
                      <Label htmlFor="mean2">Moyenne (x̄₂)</Label>
                      <Input
                        id="mean2"
                        type="number"
                        step="any"
                        placeholder="ex: 80"
                        value={mean2}
                        onChange={(e) => setMean2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sd2">Écart-type (s₂)</Label>
                      <Input
                        id="sd2"
                        type="number"
                        step="any"
                        placeholder="ex: 12"
                        value={sd2}
                        onChange={(e) => setSd2(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="n2">Taille (n₂)</Label>
                      <Input
                        id="n2"
                        type="number"
                        placeholder="ex: 35"
                        value={n2}
                        onChange={(e) => setN2(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alpha">Niveau de signification (α)</Label>
                  <select
                    id="alpha"
                    className="w-full p-2 border rounded-md bg-background"
                    value={alpha}
                    onChange={(e) => setAlpha(e.target.value)}
                  >
                    <option value="0.05">0.05 (5%)</option>
                    <option value="0.01">0.01 (1%)</option>
                  </select>
                </div>

                <Button onClick={calculateComparison} className="w-full">
                  Effectuer la comparaison
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hypothèses</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>H₀:</strong> μ₁ = μ₂ (les moyennes sont égales)</p>
                  <p><strong>H₁:</strong> μ₁ ≠ μ₂ (les moyennes sont différentes)</p>
                  <p className="text-sm text-muted-foreground mt-2">Test bilatéral au seuil α = {alpha}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calculs intermédiaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold mb-2">1. Écart-type poolé (sp)</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      sp² = [(n₁-1)×s₁² + (n₂-1)×s₂²] / (n₁+n₂-2)
                    </div>
                    <div className="bg-muted p-3 rounded mt-2">
                      sp² = [({result.n1}-1)×{result.sd1}² + ({result.n2}-1)×{result.sd2}²] / ({result.n1}+{result.n2}-2)
                    </div>
                    <p className="mt-2">sp = <strong>{result.pooledSD.toFixed(4)}</strong></p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">2. Erreur standard</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      SE = sp × √(1/n₁ + 1/n₂)
                    </div>
                    <p className="mt-2">SE = <strong>{(result.pooledSD * Math.sqrt(1/result.n1 + 1/result.n2)).toFixed(4)}</strong></p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">3. Statistique t</p>
                    <div className="bg-muted p-3 rounded font-mono text-sm">
                      t = (x̄₁ - x̄₂) / SE
                    </div>
                    <div className="bg-muted p-3 rounded mt-2">
                      t = ({result.mean1} - {result.mean2}) / {(result.pooledSD * Math.sqrt(1/result.n1 + 1/result.n2)).toFixed(4)}
                    </div>
                    <p className="mt-2">t = <strong>{result.tStatistic.toFixed(4)}</strong></p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">4. Degrés de liberté</p>
                    <p>df = n₁ + n₂ - 2 = {result.n1} + {result.n2} - 2 = <strong>{result.df}</strong></p>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">5. Valeur critique</p>
                    <p>t critique (α={alpha}, df={result.df}) = <strong>±{result.criticalValue.toFixed(3)}</strong></p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary">
                <CardHeader>
                  <CardTitle>Résultats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Statistique t</p>
                      <p className="text-3xl font-bold">{result.tStatistic.toFixed(4)}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground mb-1">Valeur-p</p>
                      <p className="text-3xl font-bold">{result.pValue}</p>
                    </div>
                  </div>

                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-semibold mb-2">Intervalle de confiance à 95%</p>
                    <p className="text-center text-lg">
                      [{result.confidenceInterval.lower.toFixed(4)}, {result.confidenceInterval.upper.toFixed(4)}]
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Différence entre les moyennes (μ₁ - μ₂)
                    </p>
                  </div>

                  <div className="bg-primary/10 border border-primary p-4 rounded-lg">
                    <p className="font-semibold mb-2">Conclusion :</p>
                    <p>{result.conclusion}</p>
                  </div>
                </CardContent>
              </Card>

              <Button onClick={reset} variant="outline" className="w-full">
                Nouvelle comparaison
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TwoMeansComparison;
