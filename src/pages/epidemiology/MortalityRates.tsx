import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";

export default function MortalityRates() {
  const [population, setPopulation] = useState<string>("");
  const [decesTotal, setDecesTotal] = useState<string>("");
  const [decesCause1, setDecesCause1] = useState<string>("");
  const [decesCause2, setDecesCause2] = useState<string>("");
  const [decesCause3, setDecesCause3] = useState<string>("");
  const [casMaladie, setCasMaladie] = useState<string>("");
  const [results, setResults] = useState<any>(null);

  const calculate = () => {
    const pop = parseFloat(population);
    const decesTot = parseFloat(decesTotal);
    const deces1 = parseFloat(decesCause1 || "0");
    const deces2 = parseFloat(decesCause2 || "0");
    const deces3 = parseFloat(decesCause3 || "0");
    const cas = parseFloat(casMaladie || "0");

    // Mortalité brute
    const popMoyenne = ((pop - decesTot) + pop) / 2;
    const mortaliteBrute = (decesTot / popMoyenne) * 1000;

    // Mortalités spécifiques
    const mortSpecif1 = deces1 ? (deces1 / pop) * 1000 : null;
    const mortSpecif2 = deces2 ? (deces2 / pop) * 1000 : null;
    const mortSpecif3 = deces3 ? (deces3 / pop) * 1000 : null;

    // Mortalités proportionnelles
    const mortProp1 = deces1 ? (deces1 / decesTot) * 100 : null;
    const mortProp2 = deces2 ? (deces2 / decesTot) * 100 : null;
    const mortProp3 = deces3 ? (deces3 / decesTot) * 100 : null;

    // Létalité
    const letalite = (cas && deces1) ? (deces1 / cas) * 100 : null;

    setResults({
      pop,
      decesTot,
      deces1,
      deces2,
      deces3,
      cas,
      popMoyenne,
      mortaliteBrute,
      mortSpecif1,
      mortSpecif2,
      mortSpecif3,
      mortProp1,
      mortProp2,
      mortProp3,
      letalite,
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
            <h2 className="text-3xl font-bold mb-4">Taux de Mortalité</h2>
            <p className="text-muted-foreground mb-6">
              Calculez la mortalité brute, spécifique, proportionnelle et la létalité.
            </p>

            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="population">Population de départ</Label>
                  <Input
                    id="population"
                    type="number"
                    value={population}
                    onChange={(e) => setPopulation(e.target.value)}
                    placeholder="Ex: 21500"
                  />
                </div>
                <div>
                  <Label htmlFor="decesTotal">Décès total</Label>
                  <Input
                    id="decesTotal"
                    type="number"
                    value={decesTotal}
                    onChange={(e) => setDecesTotal(e.target.value)}
                    placeholder="Ex: 116"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Décès par cause (optionnel)</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="decesCause1">Cause 1 (ex: Diarrhée)</Label>
                    <Input
                      id="decesCause1"
                      type="number"
                      value={decesCause1}
                      onChange={(e) => setDecesCause1(e.target.value)}
                      placeholder="Ex: 47"
                    />
                  </div>
                  <div>
                    <Label htmlFor="decesCause2">Cause 2 (ex: Paludisme)</Label>
                    <Input
                      id="decesCause2"
                      type="number"
                      value={decesCause2}
                      onChange={(e) => setDecesCause2(e.target.value)}
                      placeholder="Ex: 28"
                    />
                  </div>
                  <div>
                    <Label htmlFor="decesCause3">Cause 3 (ex: Autres)</Label>
                    <Input
                      id="decesCause3"
                      type="number"
                      value={decesCause3}
                      onChange={(e) => setDecesCause3(e.target.value)}
                      placeholder="Ex: 41"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Pour calculer la létalité (optionnel)</h3>
                <div>
                  <Label htmlFor="casMaladie">Nombre de cas de la maladie (cause 1)</Label>
                  <Input
                    id="casMaladie"
                    type="number"
                    value={casMaladie}
                    onChange={(e) => setCasMaladie(e.target.value)}
                    placeholder="Ex: 377"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Nombre total de personnes ayant contracté la maladie (pour la cause 1)
                  </p>
                </div>
              </div>

              <Button onClick={calculate} className="w-full">
                Calculer tous les taux
              </Button>
            </div>
          </Card>

          {results && (
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-6">Résultats</h3>

              <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold text-lg mb-2">1. Taux Brut de Mortalité (TBM)</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Rapport entre le nombre de décès et la population moyenne
                  </p>
                  <div className="font-mono text-sm mb-2">
                    Population moyenne = [(Population - Décès) + Population] / 2
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Population moyenne = [({results.pop} - {results.decesTot}) + {results.pop}] / 2
                  </div>
                  <div className="font-mono text-sm mb-2">
                    Population moyenne = {results.popMoyenne.toFixed(2)}
                  </div>
                  <div className="font-mono text-sm mb-2 mt-3">
                    TBM = (Décès total / Population moyenne) × 1000
                  </div>
                  <div className="font-mono text-sm mb-2">
                    TBM = ({results.decesTot} / {results.popMoyenne.toFixed(2)}) × 1000
                  </div>
                  <div className="text-xl font-bold text-primary">
                    TBM = {results.mortaliteBrute.toFixed(2)}‰
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Il y a {results.mortaliteBrute.toFixed(2)} décès pour 1000 habitants.
                  </p>
                </div>

                {results.mortSpecif1 !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">2. Taux de Mortalité Spécifique (TMS)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Rapport entre les décès d'une cause donnée et la population totale
                    </p>
                    
                    {results.deces1 > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <p className="font-semibold mb-2">Cause 1:</p>
                        <div className="font-mono text-sm mb-2">
                          TMS = (Décès cause 1 / Population) × 1000
                        </div>
                        <div className="font-mono text-sm mb-2">
                          TMS = ({results.deces1} / {results.pop}) × 1000
                        </div>
                        <div className="text-lg font-bold text-primary">
                          TMS = {results.mortSpecif1.toFixed(2)}‰
                        </div>
                      </div>
                    )}

                    {results.deces2 > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <p className="font-semibold mb-2">Cause 2:</p>
                        <div className="text-lg font-bold text-primary">
                          TMS = {results.mortSpecif2?.toFixed(2)}‰
                        </div>
                      </div>
                    )}

                    {results.deces3 > 0 && (
                      <div>
                        <p className="font-semibold mb-2">Cause 3:</p>
                        <div className="text-lg font-bold text-primary">
                          TMS = {results.mortSpecif3?.toFixed(2)}‰
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {results.mortProp1 !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">3. Mortalité Proportionnelle (MP)</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Proportion des décès dus à une cause spécifique par rapport au total des décès
                    </p>

                    {results.deces1 > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <p className="font-semibold mb-2">Cause 1:</p>
                        <div className="font-mono text-sm mb-2">
                          MP = (Décès cause 1 / Décès total) × 100
                        </div>
                        <div className="font-mono text-sm mb-2">
                          MP = ({results.deces1} / {results.decesTot}) × 100
                        </div>
                        <div className="text-lg font-bold text-primary">
                          MP = {results.mortProp1.toFixed(2)}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {results.mortProp1.toFixed(2)}% des décès sont dus à cette cause.
                        </p>
                      </div>
                    )}

                    {results.deces2 > 0 && (
                      <div className="mb-4 pb-4 border-b">
                        <p className="font-semibold mb-2">Cause 2:</p>
                        <div className="text-lg font-bold text-primary">
                          MP = {results.mortProp2?.toFixed(2)}%
                        </div>
                      </div>
                    )}

                    {results.deces3 > 0 && (
                      <div>
                        <p className="font-semibold mb-2">Cause 3:</p>
                        <div className="text-lg font-bold text-primary">
                          MP = {results.mortProp3?.toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {results.letalite !== null && (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <h4 className="font-semibold text-lg mb-2">4. Létalité (L)</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Proportion de décès parmi les personnes atteintes de la maladie
                    </p>
                    <div className="font-mono text-sm mb-2">
                      L = (Décès cause 1 / Cas de maladie) × 100
                    </div>
                    <div className="font-mono text-sm mb-2">
                      L = ({results.deces1} / {results.cas}) × 100
                    </div>
                    <div className="text-xl font-bold text-primary">
                      L = {results.letalite.toFixed(2)}%
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      {results.letalite.toFixed(2)}% des personnes atteintes de cette maladie en sont décédées.
                    </p>
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
