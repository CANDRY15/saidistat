import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";

export default function CaseControl() {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [d, setD] = useState<string>("");
  const [results, setResults] = useState<any>(null);
  const [aiExercise, setAiExercise] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedValues = sessionStorage.getItem("epidemiology-ai-values");
    const storedExercise = sessionStorage.getItem("epidemiology-ai-exercise");
    
    if (storedValues) {
      try {
        const values = JSON.parse(storedValues);
        if (values.a !== null) setA(values.a.toString());
        if (values.b !== null) setB(values.b.toString());
        if (values.c !== null) setC(values.c.toString());
        if (values.d !== null) setD(values.d.toString());
        
        if (storedExercise) setAiExercise(storedExercise);
        
        sessionStorage.removeItem("epidemiology-ai-values");
        sessionStorage.removeItem("epidemiology-ai-exercise");
        
        toast({
          title: "Valeurs pré-remplies par l'IA",
          description: "Vérifiez les valeurs et cliquez sur Calculer",
        });
      } catch (e) {
        console.error("Error parsing AI values:", e);
      }
    }
  }, [toast]);

  const calculate = () => {
    const val_a = parseFloat(a);
    const val_b = parseFloat(b);
    const val_c = parseFloat(c);
    const val_d = parseFloat(d);

    const or = (val_a * val_d) / (val_c * val_b);
    
    let interpretation = "";
    let fere = null;
    let ferp = null;
    let pe = null;

    if (or > 1) {
      interpretation = "L'exposition est un facteur de risque";
      fere = ((or - 1) / or) * 100;
      pe = val_b / (val_b + val_d);
      ferp = (pe * (or - 1)) / (pe * (or - 1) + 1) * 100;
    } else if (or < 1) {
      interpretation = "L'exposition est un facteur protecteur";
    } else {
      interpretation = "L'exposition est indépendante de la maladie";
    }

    // Calcul IC95%
    const lnOR = Math.log(or);
    const varLnOR = (1/val_a) + (1/val_b) + (1/val_c) + (1/val_d);
    const seLnOR = Math.sqrt(varLnOR);
    const ic95Lower = Math.exp(lnOR - 1.96 * seLnOR);
    const ic95Upper = Math.exp(lnOR + 1.96 * seLnOR);

    setResults({
      a: val_a, b: val_b, c: val_c, d: val_d,
      or,
      interpretation,
      fere,
      ferp,
      pe: pe ? pe * 100 : null,
      lnOR,
      varLnOR,
      seLnOR,
      ic95Lower,
      ic95Upper,
      cas: val_a + val_c,
      temoins: val_b + val_d,
      exposes: val_a + val_b,
      nonExposes: val_c + val_d,
      total: val_a + val_b + val_c + val_d,
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
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
              <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-3xl font-bold text-primary">SaidiStat</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8 mb-8">
            <h2 className="text-3xl font-bold mb-4">Étude Cas-Témoins</h2>
            <p className="text-muted-foreground mb-6">
              Entrez les effectifs de la table de contingence pour une étude cas-témoins.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="a">A - Cas ET Exposés (M+ E+)</Label>
                  <Input
                    id="a"
                    type="number"
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    placeholder="Ex: 70"
                  />
                </div>
                <div>
                  <Label htmlFor="c">C - Cas ET Non Exposés (M+ E-)</Label>
                  <Input
                    id="c"
                    type="number"
                    value={c}
                    onChange={(e) => setC(e.target.value)}
                    placeholder="Ex: 30"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="b">B - Témoins ET Exposés (M- E+)</Label>
                  <Input
                    id="b"
                    type="number"
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    placeholder="Ex: 40"
                  />
                </div>
                <div>
                  <Label htmlFor="d">D - Témoins ET Non Exposés (M- E-)</Label>
                  <Input
                    id="d"
                    type="number"
                    value={d}
                    onChange={(e) => setD(e.target.value)}
                    placeholder="Ex: 160"
                  />
                </div>
              </div>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculer l'OR et l'IC95%
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
                        <th className="border border-border p-3">Exposition</th>
                        <th className="border border-border p-3">Cas (M+)</th>
                        <th className="border border-border p-3">Témoins (M-)</th>
                        <th className="border border-border p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Exposés (E+)</td>
                        <td className="border border-border p-3 text-center bg-blue-100 dark:bg-blue-900/20">A = {results.a}</td>
                        <td className="border border-border p-3 text-center bg-purple-100 dark:bg-purple-900/20">B = {results.b}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.exposes}</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Non Exposés (E-)</td>
                        <td className="border border-border p-3 text-center bg-green-100 dark:bg-green-900/20">C = {results.c}</td>
                        <td className="border border-border p-3 text-center bg-orange-100 dark:bg-orange-900/20">D = {results.d}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.nonExposes}</td>
                      </tr>
                      <tr className="bg-muted">
                        <td className="border border-border p-3 font-semibold">Total</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.cas}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.temoins}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculs */}
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">1. Odds Ratio (OR)</h4>
                  <div className="font-mono text-sm mb-2">
                    OR = (A × D) / (C × B)
                  </div>
                  <div className="font-mono text-sm mb-2">
                    OR = ({results.a} × {results.d}) / ({results.c} × {results.b})
                  </div>
                  <div className="font-mono text-sm mb-2">
                    OR = {results.a * results.d} / {results.c * results.b}
                  </div>
                  <div className="text-xl font-bold text-primary mb-2">
                    OR = {results.or.toFixed(2)}
                  </div>
                  <div className="p-3 bg-background rounded border-l-4 border-primary">
                    <p className="font-semibold">Interprétation:</p>
                    <p>{results.interpretation}</p>
                    {results.or > 1 && (
                      <p className="mt-2">
                        Les cas ont {results.or.toFixed(2)} fois plus de chances d'avoir été exposés que les témoins.
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">2. Intervalle de Confiance 95% de l'OR</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-semibold mb-1">Étape 1: Calcul du ln(OR)</p>
                      <div className="font-mono text-sm">
                        ln(OR) = ln({results.or.toFixed(2)}) = {results.lnOR.toFixed(4)}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Étape 2: Calcul de Var(ln(OR))</p>
                      <div className="font-mono text-sm mb-1">
                        Var(ln(OR)) = (1/A) + (1/B) + (1/C) + (1/D)
                      </div>
                      <div className="font-mono text-sm mb-1">
                        Var(ln(OR)) = (1/{results.a}) + (1/{results.b}) + (1/{results.c}) + (1/{results.d})
                      </div>
                      <div className="font-mono text-sm">
                        Var(ln(OR)) = {results.varLnOR.toFixed(4)}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Étape 3: Calcul de SE(ln(OR))</p>
                      <div className="font-mono text-sm mb-1">
                        SE(ln(OR)) = √Var(ln(OR)) = √{results.varLnOR.toFixed(4)}
                      </div>
                      <div className="font-mono text-sm">
                        SE(ln(OR)) = {results.seLnOR.toFixed(4)}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold mb-1">Étape 4: Calcul de l'IC95%</p>
                      <div className="font-mono text-sm mb-1">
                        IC95% = exp[ln(OR) ± 1.96 × SE(ln(OR))]
                      </div>
                      <div className="font-mono text-sm mb-1">
                        Borne inférieure = exp[{results.lnOR.toFixed(4)} - 1.96 × {results.seLnOR.toFixed(4)}]
                      </div>
                      <div className="font-mono text-sm mb-1">
                        Borne inférieure = exp[{(results.lnOR - 1.96 * results.seLnOR).toFixed(4)}]
                      </div>
                      <div className="font-mono text-sm mb-3">
                        Borne supérieure = exp[{(results.lnOR + 1.96 * results.seLnOR).toFixed(4)}]
                      </div>
                      
                      <div className="text-xl font-bold text-primary">
                        IC95% = [{results.ic95Lower.toFixed(2)} ; {results.ic95Upper.toFixed(2)}]
                      </div>
                    </div>

                    <div className="p-3 bg-background rounded border-l-4 border-primary mt-3">
                      <p className="font-semibold mb-2">Interprétation de l'IC95%:</p>
                      {results.ic95Lower > 1 ? (
                        <p className="text-green-600 dark:text-green-400">
                          ✓ L'association est statistiquement significative (IC ne contient pas 1).
                          L'exposition est un facteur de risque confirmé.
                        </p>
                      ) : results.ic95Upper < 1 ? (
                        <p className="text-blue-600 dark:text-blue-400">
                          ✓ L'association est statistiquement significative (IC ne contient pas 1).
                          L'exposition est un facteur protecteur confirmé.
                        </p>
                      ) : (
                        <p className="text-orange-600 dark:text-orange-400">
                          ✗ L'association n'est pas statistiquement significative (IC contient 1).
                          On ne peut pas conclure à une association entre l'exposition et la maladie.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {results.fere !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">3. Fraction Étiologique du Risque chez les Exposés (FERe)</h4>
                    <div className="font-mono text-sm mb-2">
                      FERe = ((OR - 1) / OR) × 100
                    </div>
                    <div className="font-mono text-sm mb-2">
                      FERe = (({results.or.toFixed(2)} - 1) / {results.or.toFixed(2)}) × 100
                    </div>
                    <div className="text-xl font-bold text-primary">
                      FERe = {results.fere.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {results.fere.toFixed(2)}% des cas chez les exposés sont attribuables à l'exposition.
                    </p>
                  </div>
                )}

                {results.ferp !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">4. Fraction Étiologique dans la Population (FERp)</h4>
                    <div className="font-mono text-sm mb-2">
                      Pe = B / (B + D) = {results.b} / ({results.b} + {results.d}) = {(results.pe! / 100).toFixed(4)}
                    </div>
                    <div className="font-mono text-sm mb-2">
                      FERp = [Pe × (OR - 1)] / [Pe × (OR - 1) + 1] × 100
                    </div>
                    <div className="text-xl font-bold text-primary">
                      FERp = {results.ferp.toFixed(2)}%
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
