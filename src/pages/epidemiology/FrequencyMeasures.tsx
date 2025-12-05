import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import saidistatLogo from "@/assets/saidistat-logo.jpg";

export default function FrequencyMeasures() {
  // Prevalence
  const [prevCas, setPrevCas] = useState<string>("");
  const [prevPopulation, setPrevPopulation] = useState<string>("");
  const [prevResults, setPrevResults] = useState<any>(null);

  // Incidence
  const [incNouvCas, setIncNouvCas] = useState<string>("");
  const [incPopRisque, setIncPopRisque] = useState<string>("");
  const [incResults, setIncResults] = useState<any>(null);

  // Densité d'incidence
  const [diNouvCas, setDiNouvCas] = useState<string>("");
  const [diPersonnesAnnees, setDiPersonnesAnnees] = useState<string>("");
  const [diResults, setDiResults] = useState<any>(null);

  const calculatePrevalence = () => {
    const cas = parseFloat(prevCas);
    const pop = parseFloat(prevPopulation);
    const prevalence = (cas / pop) * 100;

    setPrevResults({ cas, pop, prevalence });
  };

  const calculateIncidence = () => {
    const nouvCas = parseFloat(incNouvCas);
    const popRisque = parseFloat(incPopRisque);
    const incidence = (nouvCas / popRisque) * 100;

    setIncResults({ nouvCas, popRisque, incidence });
  };

  const calculateDensity = () => {
    const nouvCas = parseFloat(diNouvCas);
    const personnesAnnees = parseFloat(diPersonnesAnnees);
    const densite = (nouvCas / personnesAnnees) * 1000;

    setDiResults({ nouvCas, personnesAnnees, densite });
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
          <Card className="p-8">
            <h2 className="text-3xl font-bold mb-4">Mesures de Fréquence</h2>
            <p className="text-muted-foreground mb-6">
              Calculez la prévalence, l'incidence cumulée et la densité d'incidence.
            </p>

            <Tabs defaultValue="prevalence" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="prevalence">Prévalence</TabsTrigger>
                <TabsTrigger value="incidence">Incidence Cumulée</TabsTrigger>
                <TabsTrigger value="density">Densité d'Incidence</TabsTrigger>
              </TabsList>

              {/* Prévalence Tab */}
              <TabsContent value="prevalence" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="prevCas">Nombre de cas présents</Label>
                    <Input
                      id="prevCas"
                      type="number"
                      value={prevCas}
                      onChange={(e) => setPrevCas(e.target.value)}
                      placeholder="Ex: 300"
                    />
                  </div>
                  <div>
                    <Label htmlFor="prevPopulation">Population totale</Label>
                    <Input
                      id="prevPopulation"
                      type="number"
                      value={prevPopulation}
                      onChange={(e) => setPrevPopulation(e.target.value)}
                      placeholder="Ex: 3000"
                    />
                  </div>
                  <Button onClick={calculatePrevalence} className="w-full">
                    Calculer la prévalence
                  </Button>
                </div>

                {prevResults && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-xl font-bold">Résultats</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">Prévalence (P)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Proportion de personnes malades dans une population à un moment donné
                      </p>
                      <div className="font-mono text-sm mb-2">
                        P = (Nombre de cas / Population totale) × 100
                      </div>
                      <div className="font-mono text-sm mb-2">
                        P = ({prevResults.cas} / {prevResults.pop}) × 100
                      </div>
                      <div className="text-xl font-bold text-primary">
                        P = {prevResults.prevalence.toFixed(2)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {prevResults.prevalence.toFixed(2)}% de la population est malade au moment de l'observation.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Incidence Tab */}
              <TabsContent value="incidence" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="incNouvCas">Nombre de nouveaux cas</Label>
                    <Input
                      id="incNouvCas"
                      type="number"
                      value={incNouvCas}
                      onChange={(e) => setIncNouvCas(e.target.value)}
                      placeholder="Ex: 900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="incPopRisque">Population à risque (sans les cas prévalents)</Label>
                    <Input
                      id="incPopRisque"
                      type="number"
                      value={incPopRisque}
                      onChange={(e) => setIncPopRisque(e.target.value)}
                      placeholder="Ex: 2700"
                    />
                  </div>
                  <Button onClick={calculateIncidence} className="w-full">
                    Calculer l'incidence cumulée
                  </Button>
                </div>

                {incResults && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-xl font-bold">Résultats</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">Incidence Cumulée (IC)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Proportion de nouveaux cas survenant pendant une période donnée
                      </p>
                      <div className="font-mono text-sm mb-2">
                        IC = (Nouveaux cas / Population à risque) × 100
                      </div>
                      <div className="font-mono text-sm mb-2">
                        IC = ({incResults.nouvCas} / {incResults.popRisque}) × 100
                      </div>
                      <div className="text-xl font-bold text-primary">
                        IC = {incResults.incidence.toFixed(2)}%
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {incResults.incidence.toFixed(2)}% de la population à risque a développé la maladie pendant la période de suivi.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Densité d'incidence Tab */}
              <TabsContent value="density" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="diNouvCas">Nombre de nouveaux cas</Label>
                    <Input
                      id="diNouvCas"
                      type="number"
                      value={diNouvCas}
                      onChange={(e) => setDiNouvCas(e.target.value)}
                      placeholder="Ex: 30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="diPersonnesAnnees">Personnes-années de suivi</Label>
                    <Input
                      id="diPersonnesAnnees"
                      type="number"
                      value={diPersonnesAnnees}
                      onChange={(e) => setDiPersonnesAnnees(e.target.value)}
                      placeholder="Ex: 2300"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Somme du temps de suivi de chaque personne jusqu'à l'événement ou la fin de l'étude
                    </p>
                  </div>
                  <Button onClick={calculateDensity} className="w-full">
                    Calculer la densité d'incidence
                  </Button>
                </div>

                {diResults && (
                  <div className="space-y-4 mt-6">
                    <h3 className="text-xl font-bold">Résultats</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold text-lg mb-2">Densité d'Incidence (DI)</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Taux de survenue de nouveaux cas par unité de temps-personne
                      </p>
                      <div className="font-mono text-sm mb-2">
                        DI = (Nouveaux cas / Personnes-années) × 1000
                      </div>
                      <div className="font-mono text-sm mb-2">
                        DI = ({diResults.nouvCas} / {diResults.personnesAnnees}) × 1000
                      </div>
                      <div className="text-xl font-bold text-primary">
                        DI = {diResults.densite.toFixed(2)} pour 1000 personnes-années
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Il y a {diResults.densite.toFixed(2)} nouveaux cas pour 1000 personnes suivies pendant un an.
                      </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h5 className="font-semibold mb-2">Note importante:</h5>
                      <p className="text-sm">
                        La densité d'incidence est utilisée quand la durée de suivi n'est pas la même pour tous les participants.
                        Elle prend en compte le temps exact de suivi de chaque personne.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
