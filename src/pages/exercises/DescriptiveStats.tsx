import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator } from "lucide-react";
import { toast } from "sonner";

interface Stats {
  min: number;
  max: number;
  range: number;
  mean: number;
  median: number;
  mode: number[];
  stdDev: number;
  variance: number;
  cv: number;
  count: number;
}

const DescriptiveStats = () => {
  const [dataInput, setDataInput] = useState("");
  const [results, setResults] = useState<Stats | null>(null);

  const calculateStats = () => {
    try {
      // Parse input data
      const values = dataInput
        .trim()
        .split(/[\s,;]+/)
        .map(v => parseFloat(v))
        .filter(v => !isNaN(v));

      if (values.length === 0) {
        toast.error("Veuillez entrer des données valides");
        return;
      }

      // Sort values
      const sorted = [...values].sort((a, b) => a - b);

      // Calculate statistics
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const range = max - min;
      const count = values.length;

      // Mean
      const sum = values.reduce((acc, val) => acc + val, 0);
      const mean = sum / count;

      // Median
      const mid = Math.floor(count / 2);
      const median = count % 2 === 0 
        ? (sorted[mid - 1] + sorted[mid]) / 2 
        : sorted[mid];

      // Mode
      const frequency: { [key: number]: number } = {};
      values.forEach(val => {
        frequency[val] = (frequency[val] || 0) + 1;
      });
      const maxFreq = Math.max(...Object.values(frequency));
      const mode = Object.keys(frequency)
        .filter(key => frequency[parseFloat(key)] === maxFreq)
        .map(key => parseFloat(key));

      // Variance and Standard Deviation
      const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
      const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / count;
      const stdDev = Math.sqrt(variance);

      // Coefficient of Variation
      const cv = (stdDev / mean) * 100;

      setResults({
        min,
        max,
        range,
        mean,
        median,
        mode,
        stdDev,
        variance,
        cv,
        count
      });

      toast.success("Calculs effectués avec succès !");
    } catch (error) {
      toast.error("Erreur lors du calcul des statistiques");
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
              Statistiques Descriptives
            </h1>
            <p className="text-lg text-muted-foreground">
              Calculez automatiquement toutes les statistiques descriptives de vos données
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
                  placeholder="Exemple: 73 92 48 54 63 63 64 65 50 73..."
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  className="min-h-[200px] font-mono"
                />
                <div className="text-sm text-muted-foreground">
                  <p className="font-semibold mb-2">Exemple d'exercice (UNILU 2023-2024):</p>
                  <p className="italic">
                    Déterminez l'étendue, la moyenne, la classe médiane, la classe modale, 
                    le coefficient de variation, l'écart-type des Poids(kg) suivants.
                  </p>
                </div>
                <Button onClick={calculateStats} className="w-full" size="lg">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculer les statistiques
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résultats</CardTitle>
                <CardDescription>
                  Les statistiques calculées apparaîtront ici
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Nombre de valeurs</p>
                        <p className="text-2xl font-bold">{results.count}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Étendue</p>
                        <p className="text-2xl font-bold">{results.range.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Minimum</p>
                        <p className="text-2xl font-bold">{results.min.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Maximum</p>
                        <p className="text-2xl font-bold">{results.max.toFixed(2)}</p>
                      </div>
                      <div className="bg-primary/10 p-4 rounded-lg col-span-2">
                        <p className="text-sm text-muted-foreground">Moyenne (x̄)</p>
                        <p className="text-2xl font-bold">{results.mean.toFixed(4)}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Médiane</p>
                        <p className="text-2xl font-bold">{results.median.toFixed(2)}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Mode</p>
                        <p className="text-2xl font-bold">
                          {results.mode.length > 3 
                            ? `${results.mode.length} valeurs` 
                            : results.mode.join(", ")}
                        </p>
                      </div>
                      <div className="bg-secondary/10 p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Écart-type (σ)</p>
                        <p className="text-2xl font-bold">{results.stdDev.toFixed(4)}</p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Variance (σ²)</p>
                        <p className="text-2xl font-bold">{results.variance.toFixed(4)}</p>
                      </div>
                      <div className="bg-gradient-to-br from-primary/20 to-secondary/20 p-4 rounded-lg col-span-2">
                        <p className="text-sm text-muted-foreground">Coefficient de Variation (CV%)</p>
                        <p className="text-2xl font-bold">{results.cv.toFixed(2)}%</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg border border-border">
                      <h3 className="font-semibold mb-2">Formules utilisées:</h3>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        <p>• Moyenne: x̄ = Σx / n</p>
                        <p>• Écart-type: σ = √(Σ(x - x̄)² / n)</p>
                        <p>• Coefficient de variation: CV = (σ / x̄) × 100</p>
                        <p>• Étendue: max - min</p>
                      </div>
                    </div>
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

export default DescriptiveStats;
