import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";

export default function DiagnosticTest() {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [d, setD] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const vp = parseFloat(a);
    const fp = parseFloat(b);
    const fn = parseFloat(c);
    const vn = parseFloat(d);

    const sensitivity = (vp / (vp + fn)) * 100;
    const specificity = (vn / (fp + vn)) * 100;
    const ppv = (vp / (vp + fp)) * 100;
    const npv = (vn / (fn + vn)) * 100;
    const accuracy = ((vp + vn) / (vp + fp + fn + vn)) * 100;

    setResults({
      vp, fp, fn, vn,
      sensitivity,
      specificity,
      ppv,
      npv,
      accuracy,
      total: vp + fp + fn + vn,
      malades: vp + fn,
      sains: fp + vn,
      testPositif: vp + fp,
      testNegatif: fn + vn,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link 
            to="/epidemiology" 
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Retour aux exercices
          </Link>
          <h1 className="text-3xl font-bold text-primary">BioStasmarT</h1>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8 mb-8">
            <h2 className="text-3xl font-bold mb-4">Test Diagnostique</h2>
            <p className="text-muted-foreground mb-6">
              Entrez les valeurs de la table de contingence pour calculer les performances du test diagnostique.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="a">A - Vrais Positifs (Test+ et Malade+)</Label>
                  <Input
                    id="a"
                    type="number"
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    placeholder="Ex: 85"
                  />
                </div>
                <div>
                  <Label htmlFor="b">B - Faux Positifs (Test+ et Malade-)</Label>
                  <Input
                    id="b"
                    type="number"
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    placeholder="Ex: 15"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="c">C - Faux Négatifs (Test- et Malade+)</Label>
                  <Input
                    id="c"
                    type="number"
                    value={c}
                    onChange={(e) => setC(e.target.value)}
                    placeholder="Ex: 10"
                  />
                </div>
                <div>
                  <Label htmlFor="d">D - Vrais Négatifs (Test- et Malade-)</Label>
                  <Input
                    id="d"
                    type="number"
                    value={d}
                    onChange={(e) => setD(e.target.value)}
                    placeholder="Ex: 90"
                  />
                </div>
              </div>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculer les performances du test
            </Button>
          </Card>

          {results && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Résultats</h3>

              {/* Table de contingence */}
              <div className="mb-8">
                <h4 className="text-xl font-semibold mb-4">Table de Contingence</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        <th className="border border-border p-3"></th>
                        <th className="border border-border p-3">Maladie Présente (M+)</th>
                        <th className="border border-border p-3">Maladie Absente (M-)</th>
                        <th className="border border-border p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Test Positif (T+)</td>
                        <td className="border border-border p-3 text-center bg-green-100 dark:bg-green-900/20">
                          A = {results.vp}<br/><span className="text-sm text-muted-foreground">Vrais Positifs</span>
                        </td>
                        <td className="border border-border p-3 text-center bg-red-100 dark:bg-red-900/20">
                          B = {results.fp}<br/><span className="text-sm text-muted-foreground">Faux Positifs</span>
                        </td>
                        <td className="border border-border p-3 text-center font-semibold">{results.testPositif}</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Test Négatif (T-)</td>
                        <td className="border border-border p-3 text-center bg-red-100 dark:bg-red-900/20">
                          C = {results.fn}<br/><span className="text-sm text-muted-foreground">Faux Négatifs</span>
                        </td>
                        <td className="border border-border p-3 text-center bg-green-100 dark:bg-green-900/20">
                          D = {results.vn}<br/><span className="text-sm text-muted-foreground">Vrais Négatifs</span>
                        </td>
                        <td className="border border-border p-3 text-center font-semibold">{results.testNegatif}</td>
                      </tr>
                      <tr className="bg-muted">
                        <td className="border border-border p-3 font-semibold">Total</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.malades}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.sains}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculs détaillés */}
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">1. Sensibilité (Se)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Proportion des tests positifs parmi les malades
                  </p>
                  <div className="font-mono text-sm mb-2">
                    Se = A / (A + C) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Se = {results.vp} / ({results.vp} + {results.fn}) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Se = {results.vp} / {results.malades} × 100
                  </div>
                  <div className="text-xl font-bold text-primary">
                    Se = {results.sensitivity.toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Interprétation: Le test détecte correctement {results.sensitivity.toFixed(2)}% des malades.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">2. Spécificité (Sp)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Proportion des tests négatifs parmi les sujets sains
                  </p>
                  <div className="font-mono text-sm mb-2">
                    Sp = D / (B + D) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Sp = {results.vn} / ({results.fp} + {results.vn}) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Sp = {results.vn} / {results.sains} × 100
                  </div>
                  <div className="text-xl font-bold text-primary">
                    Sp = {results.specificity.toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Interprétation: Le test identifie correctement {results.specificity.toFixed(2)}% des sujets sains.
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">3. Valeur Prédictive Positive (VPP)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Probabilité d'être malade si le test est positif
                  </p>
                  <div className="font-mono text-sm mb-2">
                    VPP = A / (A + B) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    VPP = {results.vp} / ({results.vp} + {results.fp}) × 100
                  </div>
                  <div className="text-xl font-bold text-primary">
                    VPP = {results.ppv.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">4. Valeur Prédictive Négative (VPN)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Probabilité d'être sain si le test est négatif
                  </p>
                  <div className="font-mono text-sm mb-2">
                    VPN = D / (C + D) × 100
                  </div>
                  <div className="font-mono text-sm mb-2">
                    VPN = {results.vn} / ({results.fn} + {results.vn}) × 100
                  </div>
                  <div className="text-xl font-bold text-primary">
                    VPN = {results.npv.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">5. Exactitude (Accuracy)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Proportion de résultats corrects
                  </p>
                  <div className="font-mono text-sm mb-2">
                    Accuracy = (A + D) / (A + B + C + D) × 100
                  </div>
                  <div className="text-xl font-bold text-primary">
                    Accuracy = {results.accuracy.toFixed(2)}%
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
