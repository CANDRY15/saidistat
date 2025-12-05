import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { ArrowLeft, Calculator, Printer } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface FrequencyClass {
  lower: number;
  upper: number;
  midpoint: number;
  frequency: number;
  relativeFrequency: number;
  cumulativeFrequency: number;
  interval: string;
}

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
  k: number;
  classWidth: number;
  frequencyTable: FrequencyClass[];
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

      // Calculate number of classes using Sturges' rule: K = 1 + 3.322 log(n)
      const k = Math.ceil(1 + 3.322 * Math.log10(count));

      // Calculate class width: h = (max - min) / K
      const classWidth = range / k;

      // Build frequency table
      const frequencyTable: FrequencyClass[] = [];
      let cumulativeFreq = 0;

      for (let i = 0; i < k; i++) {
        const lower = min + i * classWidth;
        const upper = min + (i + 1) * classWidth;
        const midpoint = (lower + upper) / 2;

        // Count values in this class
        const freq = sorted.filter(v => {
          if (i === k - 1) {
            // Last class includes upper bound
            return v >= lower && v <= upper;
          }
          return v >= lower && v < upper;
        }).length;

        const relativeFreq = (freq / count) * 100;
        cumulativeFreq += freq;

        frequencyTable.push({
          lower,
          upper,
          midpoint,
          frequency: freq,
          relativeFrequency: relativeFreq,
          cumulativeFrequency: cumulativeFreq,
          interval: `[${lower.toFixed(2)} - ${upper.toFixed(2)}${i === k - 1 ? ']' : '['}`
        });
      }

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
        count,
        k,
        classWidth,
        frequencyTable
      });

      toast.success("Calculs effectués avec succès !");
    } catch (error) {
      toast.error("Erreur lors du calcul des statistiques");
      console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border print:hidden">
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

      <main className="container mx-auto px-4 pt-24 pb-12 print:pt-0">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 print:mb-4">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent print:text-foreground print:text-3xl">
              Statistiques Descriptives
            </h1>
            <p className="text-lg text-muted-foreground print:text-sm">
              Calculez automatiquement toutes les statistiques descriptives de vos données
            </p>
          </div>

          {!results && (
            <div className="grid lg:grid-cols-2 gap-6 print:hidden">
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
                  <CardTitle>Instructions</CardTitle>
                  <CardDescription>
                    Comment utiliser cet outil
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Calculator className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Entrez vos données et cliquez sur "Calculer" pour générer un rapport complet avec:</p>
                    <ul className="mt-4 text-left space-y-2">
                      <li>• Tableau de distribution des fréquences</li>
                      <li>• Calculs détaillés avec formules</li>
                      <li>• Histogramme de fréquences</li>
                      <li>• Toutes les statistiques descriptives</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {results && (
            <div className="space-y-6">
              <div className="flex justify-end gap-2 print:hidden mb-4">
                <Button onClick={handlePrint} variant="outline">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer le rapport
                </Button>
                <Button onClick={() => setResults(null)} variant="outline">
                  Nouveau calcul
                </Button>
              </div>

              {/* A4 Printable Section */}
              <div className="bg-card p-8 rounded-lg shadow-lg print:shadow-none print:p-0 print:bg-white">
                {/* Header */}
                <div className="text-center mb-6 pb-4 border-b border-border print:mb-4">
                  <h2 className="text-2xl font-bold mb-2 print:text-xl">Rapport d'Analyse Statistique Descriptive</h2>
                  <p className="text-sm text-muted-foreground">Nombre d'observations: {results.count}</p>
                </div>

                {/* 1. Calcul du nombre de classes */}
                <Card className="mb-6 print:shadow-none print:border print:mb-4">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">1. Détermination du nombre de classes (K)</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">Formule de Sturges:</p>
                      <p className="font-mono bg-muted p-3 rounded">K = 1 + 3.322 × log₁₀(n)</p>
                      <p className="font-semibold mt-4">Calcul:</p>
                      <p className="font-mono bg-muted p-3 rounded">
                        K = 1 + 3.322 × log₁₀({results.count})<br/>
                        K = 1 + 3.322 × {Math.log10(results.count).toFixed(4)}<br/>
                        K = {(1 + 3.322 * Math.log10(results.count)).toFixed(4)}<br/>
                        K ≈ {results.k} classes
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 2. Calcul de l'amplitude des classes */}
                <Card className="mb-6 print:shadow-none print:border print:mb-4">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">2. Calcul de l'amplitude des classes (h)</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="space-y-2 text-sm">
                      <p className="font-semibold">Formule:</p>
                      <p className="font-mono bg-muted p-3 rounded">h = (Max - Min) / K</p>
                      <p className="font-semibold mt-4">Calcul:</p>
                      <p className="font-mono bg-muted p-3 rounded">
                        Étendue = Max - Min = {results.max.toFixed(2)} - {results.min.toFixed(2)} = {results.range.toFixed(2)}<br/>
                        h = {results.range.toFixed(2)} / {results.k}<br/>
                        h = {results.classWidth.toFixed(4)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 3. Tableau de distribution des fréquences */}
                <Card className="mb-6 print:shadow-none print:border print:mb-4 print:break-inside-avoid">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">3. Tableau de distribution des fréquences</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border-collapse">
                        <thead>
                          <tr className="bg-muted">
                            <th className="border border-border p-2 text-left">Classes</th>
                            <th className="border border-border p-2 text-center">Xᵢ (Centre)</th>
                            <th className="border border-border p-2 text-center">fᵢ (Effectif)</th>
                            <th className="border border-border p-2 text-center">Xᵢ × fᵢ</th>
                            <th className="border border-border p-2 text-center">Fréq. relative (%)</th>
                            <th className="border border-border p-2 text-center">Effectif cumulé</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.frequencyTable.map((row, idx) => (
                            <tr key={idx} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                              <td className="border border-border p-2 font-mono text-xs">{row.interval}</td>
                              <td className="border border-border p-2 text-center font-mono">{row.midpoint.toFixed(2)}</td>
                              <td className="border border-border p-2 text-center font-bold">{row.frequency}</td>
                              <td className="border border-border p-2 text-center font-mono">{(row.midpoint * row.frequency).toFixed(2)}</td>
                              <td className="border border-border p-2 text-center">{row.relativeFrequency.toFixed(2)}%</td>
                              <td className="border border-border p-2 text-center">{row.cumulativeFrequency}</td>
                            </tr>
                          ))}
                          <tr className="bg-primary/10 font-bold">
                            <td className="border border-border p-2">Total</td>
                            <td className="border border-border p-2 text-center">-</td>
                            <td className="border border-border p-2 text-center">{results.count}</td>
                            <td className="border border-border p-2 text-center font-mono">{results.frequencyTable.reduce((sum, row) => sum + (row.midpoint * row.frequency), 0).toFixed(2)}</td>
                            <td className="border border-border p-2 text-center">100%</td>
                            <td className="border border-border p-2 text-center">-</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* 4. Calculs statistiques détaillés */}
                <Card className="mb-6 print:shadow-none print:border print:mb-4">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">4. Statistiques descriptives</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold mb-1">Moyenne (x̄):</p>
                          <p className="font-mono bg-muted p-2 rounded text-xs">
                            x̄ = Σx / n = Σx / {results.count}
                          </p>
                          <p className="font-bold text-lg mt-1">x̄ = {results.mean.toFixed(4)}</p>
                        </div>

                        <div>
                          <p className="font-semibold mb-1">Médiane:</p>
                          <p className="text-muted-foreground text-xs">Position: n/2 = {results.count}/2 = {results.count/2}</p>
                          <p className="font-bold text-lg mt-1">Me = {results.median.toFixed(2)}</p>
                        </div>

                        <div>
                          <p className="font-semibold mb-1">Mode:</p>
                          <p className="text-muted-foreground text-xs">Valeur(s) la plus fréquente</p>
                          <p className="font-bold text-lg mt-1">
                            Mo = {results.mode.length > 3 ? `${results.mode.length} valeurs` : results.mode.map(m => m.toFixed(2)).join(", ")}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <p className="font-semibold mb-1">Variance (σ²):</p>
                          <p className="font-mono bg-muted p-2 rounded text-xs">
                            σ² = Σ(xᵢ - x̄)² / n
                          </p>
                          <p className="font-bold text-lg mt-1">σ² = {results.variance.toFixed(4)}</p>
                        </div>

                        <div>
                          <p className="font-semibold mb-1">Écart-type (σ):</p>
                          <p className="font-mono bg-muted p-2 rounded text-xs">
                            σ = √(σ²) = √{results.variance.toFixed(4)}
                          </p>
                          <p className="font-bold text-lg mt-1">σ = {results.stdDev.toFixed(4)}</p>
                        </div>

                        <div>
                          <p className="font-semibold mb-1">Coefficient de Variation (CV):</p>
                          <p className="font-mono bg-muted p-2 rounded text-xs">
                            CV = (σ / x̄) × 100 = ({results.stdDev.toFixed(4)} / {results.mean.toFixed(4)}) × 100
                          </p>
                          <p className="font-bold text-lg mt-1">CV = {results.cv.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-muted/50 rounded text-xs">
                      <p className="font-semibold mb-1">Interprétation du CV:</p>
                      <p>
                        {results.cv < 15 && "CV < 15% : Distribution homogène (faible dispersion)"}
                        {results.cv >= 15 && results.cv < 30 && "15% ≤ CV < 30% : Distribution moyennement dispersée"}
                        {results.cv >= 30 && "CV ≥ 30% : Distribution hétérogène (forte dispersion)"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* 5. Histogramme */}
                <Card className="mb-6 print:shadow-none print:border print:mb-4 print:break-inside-avoid">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">5. Histogramme des fréquences</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={results.frequencyTable}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="interval" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis label={{ value: 'Effectif', angle: -90, position: 'insideLeft' }} />
                          <Tooltip />
                          <Bar dataKey="frequency" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary */}
                <Card className="print:shadow-none print:border">
                  <CardHeader className="print:py-2">
                    <CardTitle className="print:text-base">Résumé des résultats</CardTitle>
                  </CardHeader>
                  <CardContent className="print:py-2">
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Étendue</p>
                        <p className="font-bold text-lg">{results.range.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Min - Max</p>
                        <p className="font-bold text-lg">{results.min.toFixed(2)} - {results.max.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-muted rounded">
                        <p className="text-xs text-muted-foreground">Nombre de classes</p>
                        <p className="font-bold text-lg">{results.k}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 1.5cm;
          }
          
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:pt-0 {
            padding-top: 0 !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:py-2 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          
          .print\\:text-base {
            font-size: 1rem !important;
          }
          
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          
          .print\\:text-foreground {
            color: #000 !important;
            background: transparent !important;
            -webkit-background-clip: unset !important;
            background-clip: unset !important;
          }
          
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DescriptiveStats;
