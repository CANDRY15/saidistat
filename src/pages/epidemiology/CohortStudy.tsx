import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";

export default function CohortStudy() {
  const [a, setA] = useState<string>("");
  const [b, setB] = useState<string>("");
  const [c, setC] = useState<string>("");
  const [d, setD] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const val_a = parseFloat(a);
    const val_b = parseFloat(b);
    const val_c = parseFloat(c);
    const val_d = parseFloat(d);

    const ice = val_a / (val_a + val_b);
    const icne = val_c / (val_c + val_d);
    const rr = ice / icne;
    
    let interpretation = "";
    let ra = null;
    let fere = null;
    let ferp = null;
    let pe = null;

    if (rr > 1) {
      interpretation = "L'exposition est un facteur de risque";
      ra = ice - icne;
      fere = ((rr - 1) / rr) * 100;
      pe = (val_a + val_b) / (val_a + val_b + val_c + val_d);
      ferp = (pe * (rr - 1)) / (pe * (rr - 1) + 1) * 100;
    } else if (rr < 1) {
      interpretation = "L'exposition est un facteur protecteur";
      ra = ice - icne;
      fere = ((1 - rr) / 1) * 100;
    } else {
      interpretation = "L'exposition est indépendante de la maladie (pas d'association)";
    }

    setResults({
      a: val_a, b: val_b, c: val_c, d: val_d,
      ice: ice * 100,
      icne: icne * 100,
      rr,
      interpretation,
      ra: ra ? ra * 100 : null,
      fere,
      ferp,
      pe: pe ? pe * 100 : null,
      exposes: val_a + val_b,
      nonExposes: val_c + val_d,
      malades: val_a + val_c,
      nonMalades: val_b + val_d,
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
          <h1 className="text-3xl font-bold text-primary">BioStasmarT</h1>
        </div>

        <div className="max-w-5xl mx-auto">
          <Card className="p-8 mb-8">
            <h2 className="text-3xl font-bold mb-4">Étude de Cohorte (Exposé/Non-Exposé)</h2>
            <p className="text-muted-foreground mb-6">
              Entrez les effectifs de la table de contingence pour une étude de cohorte.
            </p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="a">A - Exposés ET Malades (E+ M+)</Label>
                  <Input
                    id="a"
                    type="number"
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    placeholder="Ex: 80"
                  />
                </div>
                <div>
                  <Label htmlFor="b">B - Exposés ET Non Malades (E+ M-)</Label>
                  <Input
                    id="b"
                    type="number"
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    placeholder="Ex: 120"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="c">C - Non Exposés ET Malades (E- M+)</Label>
                  <Input
                    id="c"
                    type="number"
                    value={c}
                    onChange={(e) => setC(e.target.value)}
                    placeholder="Ex: 20"
                  />
                </div>
                <div>
                  <Label htmlFor="d">D - Non Exposés ET Non Malades (E- M-)</Label>
                  <Input
                    id="d"
                    type="number"
                    value={d}
                    onChange={(e) => setD(e.target.value)}
                    placeholder="Ex: 180"
                  />
                </div>
              </div>
            </div>

            <Button onClick={calculate} className="w-full">
              Calculer le RR et les mesures d'impact
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
                        <th className="border border-border p-3">Maladie Présente (M+)</th>
                        <th className="border border-border p-3">Maladie Absente (M-)</th>
                        <th className="border border-border p-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Exposés (E+)</td>
                        <td className="border border-border p-3 text-center bg-blue-100 dark:bg-blue-900/20">A = {results.a}</td>
                        <td className="border border-border p-3 text-center">B = {results.b}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.exposes}</td>
                      </tr>
                      <tr>
                        <td className="border border-border p-3 font-semibold">Non Exposés (E-)</td>
                        <td className="border border-border p-3 text-center bg-green-100 dark:bg-green-900/20">C = {results.c}</td>
                        <td className="border border-border p-3 text-center">D = {results.d}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.nonExposes}</td>
                      </tr>
                      <tr className="bg-muted">
                        <td className="border border-border p-3 font-semibold">Total</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.malades}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.nonMalades}</td>
                        <td className="border border-border p-3 text-center font-semibold">{results.total}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Calculs */}
              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">1. Incidence chez les Exposés (ICe)</h4>
                  <div className="font-mono text-sm mb-2">
                    ICe = A / (A + B)
                  </div>
                  <div className="font-mono text-sm mb-2">
                    ICe = {results.a} / ({results.a} + {results.b})
                  </div>
                  <div className="font-mono text-sm mb-2">
                    ICe = {results.a} / {results.exposes}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    ICe = {results.ice.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">2. Incidence chez les Non-Exposés (ICne)</h4>
                  <div className="font-mono text-sm mb-2">
                    ICne = C / (C + D)
                  </div>
                  <div className="font-mono text-sm mb-2">
                    ICne = {results.c} / ({results.c} + {results.d})
                  </div>
                  <div className="font-mono text-sm mb-2">
                    ICne = {results.c} / {results.nonExposes}
                  </div>
                  <div className="text-xl font-bold text-primary">
                    ICne = {results.icne.toFixed(2)}%
                  </div>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">3. Risque Relatif (RR)</h4>
                  <div className="font-mono text-sm mb-2">
                    RR = ICe / ICne
                  </div>
                  <div className="font-mono text-sm mb-2">
                    RR = {(results.ice / 100).toFixed(4)} / {(results.icne / 100).toFixed(4)}
                  </div>
                  <div className="text-xl font-bold text-primary mb-2">
                    RR = {results.rr.toFixed(2)}
                  </div>
                  <div className="p-3 bg-background rounded border-l-4 border-primary">
                    <p className="font-semibold">Interprétation:</p>
                    <p>{results.interpretation}</p>
                    {results.rr > 1 && (
                      <p className="mt-2">
                        Les sujets exposés ont {results.rr.toFixed(2)} fois plus de risque de développer la maladie que les sujets non-exposés.
                      </p>
                    )}
                    {results.rr < 1 && (
                      <p className="mt-2">
                        Les sujets exposés ont un risque réduit de {((1 - results.rr) * 100).toFixed(2)}% par rapport aux non-exposés.
                      </p>
                    )}
                  </div>
                </div>

                {results.ra !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">4. Risque Attribuable (RA)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Excès de risque dû à l'exposition
                    </p>
                    <div className="font-mono text-sm mb-2">
                      RA = ICe - ICne
                    </div>
                    <div className="font-mono text-sm mb-2">
                      RA = {results.ice.toFixed(2)}% - {results.icne.toFixed(2)}%
                    </div>
                    <div className="text-xl font-bold text-primary">
                      RA = {results.ra.toFixed(2)}%
                    </div>
                  </div>
                )}

                {results.fere !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">5. Fraction Étiologique du Risque chez les Exposés (FERe)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Proportion de cas attribuables à l'exposition chez les exposés
                    </p>
                    {results.rr > 1 ? (
                      <>
                        <div className="font-mono text-sm mb-2">
                          FERe = ((RR - 1) / RR) × 100
                        </div>
                        <div className="font-mono text-sm mb-2">
                          FERe = (({results.rr.toFixed(2)} - 1) / {results.rr.toFixed(2)}) × 100
                        </div>
                      </>
                    ) : (
                      <div className="font-mono text-sm mb-2">
                        FERe = ((1 - RR) / 1) × 100
                      </div>
                    )}
                    <div className="text-xl font-bold text-primary">
                      FERe = {results.fere.toFixed(2)}%
                    </div>
                  </div>
                )}

                {results.ferp !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">6. Fraction Étiologique du Risque dans la Population (FERp)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Proportion de cas dans la population attribuables à l'exposition
                    </p>
                    <div className="font-mono text-sm mb-2">
                      Pe = (A + B) / Total = {results.pe?.toFixed(4)}
                    </div>
                    <div className="font-mono text-sm mb-2">
                      FERp = [Pe × (RR - 1)] / [Pe × (RR - 1) + 1] × 100
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
