import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { toast } from "sonner";

interface PercentileResults {
  [key: string]: number;
}

const Percentiles = () => {
  const [dataInput, setDataInput] = useState("");
  const [customPercentile, setCustomPercentile] = useState("");
  const [results, setResults] = useState<PercentileResults | null>(null);

  const calculatePercentile = (sortedData: number[], p: number): number => {
    const n = sortedData.length;
    const rank = (p / 100) * (n + 1);
    
    if (rank <= 1) return sortedData[0];
    if (rank >= n) return sortedData[n - 1];
    
    const lower = Math.floor(rank) - 1;
    const upper = Math.ceil(rank) - 1;
    const fraction = rank - Math.floor(rank);
    
    return sortedData[lower] + fraction * (sortedData[upper] - sortedData[lower]);
  };

  const calculatePercentiles = () => {
    try {
      const values = dataInput
        .trim()
        .split(/[\s,;]+/)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (values.length === 0) {
        toast.error("Veuillez entrer des données valides");
        return;
      }

      const sorted = [...values].sort((a, b) => a - b);
      
      const percentilesToCalculate = [10, 25, 50, 75, 90];
      if (customPercentile) {
        const custom = parseFloat(customPercentile);
        if (!isNaN(custom) && custom > 0 && custom < 100) {
          percentilesToCalculate.push(custom);
        }
      }

      const results: PercentileResults = {};
      percentilesToCalculate.forEach(p => {
        results[`P${p}`] = calculatePercentile(sorted, p);
      });

      setResults(results);
      toast.success("Percentiles calculés avec succès !");
    } catch (error) {
      toast.error("Erreur lors du calcul des percentiles");
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
              Calcul de Percentiles
            </h1>
            <p className="text-lg text-muted-foreground">
              Calculez les percentiles de vos données (P25, P50, P75, etc.)
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Entrez vos données</CardTitle>
                <CardDescription>
                  Saisissez vos valeurs séparées par des espaces, virgules ou points-virgules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Exemple: 7 8.2 9 10 10 11 11.5 12 14 16 20 20.5"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="min-h-[150px] font-mono"
                />
                
                <div className="space-y-2">
                  <Label>Percentile personnalisé (optionnel)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 33 pour P33"
                    value={customPercentile}
                    onChange={(e) => setCustomPercentile(e.target.value)}
                    min="1"
                    max="99"
                  />
                </div>

                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Exemple d'exercice (UNILU 2023-2024):</p>
                  <p className="italic">
                    Calculez les percentiles P25, P50 et P75 des valeurs du périmètre brachial (en cm).
                  </p>
                  <p className="mt-2 font-mono text-xs bg-muted p-2 rounded">
                    Série 1: 7, 8.2, 9, 10, 10, 11, 11.5, 12, 14, 16, 20, 20.5
                  </p>
                </div>

                <Button onClick={calculatePercentiles} className="w-full" size="lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculer les percentiles
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
                <CardDescription>
                  Les percentiles calculés apparaîtront ici
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {Object.entries(results)
                        .sort((a, b) => {
                          const numA = parseFloat(a[0].substring(1));
                          const numB = parseFloat(b[0].substring(1));
                          return numA - numB;
                        })
                        .map(([percentile, value]) => {
                          const isQuartile = ["P25", "P50", "P75"].includes(percentile);
                          return (
                            <div 
                              key={percentile}
                              className={`p-4 rounded-lg ${
                                isQuartile 
                                  ? "bg-gradient-to-r from-primary/20 to-secondary/20 border-2 border-primary/30" 
                                  : "bg-muted"
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm text-muted-foreground">
                                    {percentile}
                                    {percentile === "P50" && " (Médiane)"}
                                    {percentile === "P25" && " (Q1)"}
                                    {percentile === "P75" && " (Q3)"}
                                  </p>
                                  <p className="text-2xl font-bold">{value.toFixed(4)}</p>
                                </div>
                                {isQuartile && (
                                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                                    <span className="text-2xl">📊</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <h3 className="font-semibold mb-2">Interprétation:</h3>
                      <div className="text-sm space-y-2 text-muted-foreground">
                        <p>• <strong>P25 (Q1):</strong> 25% des valeurs sont inférieures à ce seuil</p>
                        <p>• <strong>P50 (Médiane):</strong> 50% des valeurs sont inférieures à ce seuil</p>
                        <p>• <strong>P75 (Q3):</strong> 75% des valeurs sont inférieures à ce seuil</p>
                        <p className="mt-3 pt-3 border-t border-border">
                          <strong>Formule:</strong> Rang = (P/100) × (n + 1)
                        </p>
                      </div>
                    </div>

                    {results["P25"] && results["P75"] && (
                      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Écart interquartile (IQR):</h3>
                        <p className="text-2xl font-bold">
                          {(results["P75"] - results["P25"]).toFixed(4)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          IQR = Q3 - Q1 = P75 - P25
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Entrez vos données et cliquez sur "Calculer" pour voir les résultats</p>
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

export default Percentiles;
