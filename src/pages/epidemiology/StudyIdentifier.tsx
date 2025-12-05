import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "react-router-dom";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function StudyIdentifier() {
  const [step, setStep] = useState(1);
  const [studyType, setStudyType] = useState<string>("");
  const [analyticalType, setAnalyticalType] = useState<string>("");
  const [result, setResult] = useState<string>("");

  const handleNext = () => {
    if (step === 1 && studyType) {
      if (studyType === "descriptive") {
        setStep(3);
      } else {
        setStep(2);
      }
    } else if (step === 2 && analyticalType) {
      setStep(3);
    }
  };

  const handleReset = () => {
    setStep(1);
    setStudyType("");
    setAnalyticalType("");
    setResult("");
  };

  const getStudyDescription = () => {
    if (studyType === "descriptive") {
      return {
        type: "Étude Descriptive",
        description: "Étudie la distribution d'un phénomène de santé dans une population sans chercher à établir de relations causales.",
        subtypes: [
          "Étude transversale: Mesure à un moment donné",
          "Étude longitudinale: Mesures répétées dans le temps",
          "Série de cas: Description détaillée de cas cliniques"
        ]
      };
    } else if (studyType === "analytical") {
      if (analyticalType === "cohort") {
        return {
          type: "Étude de Cohorte (Exposé/Non-Exposé)",
          description: "Suit dans le temps des groupes exposés et non-exposés pour observer l'apparition de la maladie.",
          characteristics: [
            "✓ Point de départ: Exposition connue",
            "✓ Direction: Exposition → Maladie (prospectif)",
            "✓ Mesure: Risque Relatif (RR)",
            "✓ Avantage: Calcul direct du risque",
            "✓ Inconvénient: Long et coûteux pour maladies rares"
          ]
        };
      } else if (analyticalType === "case-control") {
        return {
          type: "Étude Cas-Témoins",
          description: "Compare les antécédents d'exposition entre des cas malades et des témoins sains.",
          characteristics: [
            "✓ Point de départ: Maladie connue",
            "✓ Direction: Maladie → Exposition (rétrospectif)",
            "✓ Mesure: Odds Ratio (OR)",
            "✓ Avantage: Rapide, adapté aux maladies rares",
            "✓ Inconvénient: Biais de mémorisation"
          ]
        };
      } else if (analyticalType === "intervention") {
        return {
          type: "Étude d'Intervention (Expérimentale)",
          description: "Le chercheur manipule l'exposition (traitement, prévention) et observe les effets.",
          characteristics: [
            "✓ Intervention active du chercheur",
            "✓ Randomisation des groupes",
            "✓ Mesure: Efficacité du traitement (RR, FRP)",
            "✓ Avantage: Meilleure preuve de causalité",
            "✓ Exemple: Essais cliniques randomisés"
          ]
        };
      }
    }
    return null;
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

        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <h2 className="text-3xl font-bold mb-4">Assistant d'Identification d'Étude</h2>
            <p className="text-muted-foreground mb-8">
              Répondez aux questions pour identifier le type d'étude épidémiologique.
            </p>

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    1. Le chercheur intervient-il activement ou observe-t-il simplement?
                  </h3>
                  <RadioGroup value={studyType} onValueChange={setStudyType}>
                    <div className="flex items-center space-x-2 p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="descriptive" id="descriptive" />
                      <Label htmlFor="descriptive" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-semibold">Observation pure (Descriptive)</p>
                          <p className="text-sm text-muted-foreground">
                            Le chercheur observe et décrit sans manipuler
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="analytical" id="analytical" />
                      <Label htmlFor="analytical" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-semibold">Observation avec recherche de causalité (Analytique/Expérimentale)</p>
                          <p className="text-sm text-muted-foreground">
                            Cherche à établir des relations de cause à effet
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleNext} disabled={!studyType} className="w-full">
                  Suivant
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">
                    2. Quel est le point de départ de l'étude?
                  </h3>
                  <RadioGroup value={analyticalType} onValueChange={setAnalyticalType}>
                    <div className="flex items-center space-x-2 p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="cohort" id="cohort" />
                      <Label htmlFor="cohort" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-semibold">On connaît l'exposition au départ</p>
                          <p className="text-sm text-muted-foreground">
                            On suit les exposés et non-exposés pour voir qui développe la maladie
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="case-control" id="case-control" />
                      <Label htmlFor="case-control" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-semibold">On connaît la maladie au départ</p>
                          <p className="text-sm text-muted-foreground">
                            On compare les cas malades et témoins sains pour leurs expositions passées
                          </p>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-4 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value="intervention" id="intervention" />
                      <Label htmlFor="intervention" className="cursor-pointer flex-1">
                        <div>
                          <p className="font-semibold">Le chercheur manipule l'exposition</p>
                          <p className="text-sm text-muted-foreground">
                            Essai clinique, intervention thérapeutique ou préventive
                          </p>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="flex gap-4">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Retour
                  </Button>
                  <Button onClick={handleNext} disabled={!analyticalType} className="flex-1">
                    Voir le résultat
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                {(() => {
                  const info = getStudyDescription();
                  if (!info) return null;

                  return (
                    <>
                      <div className="bg-primary/10 border-l-4 border-primary p-6 rounded-lg">
                        <h3 className="text-2xl font-bold text-primary mb-2">{info.type}</h3>
                        <p className="text-lg">{info.description}</p>
                      </div>

                      {'subtypes' in info && (
                        <div className="bg-muted/50 p-6 rounded-lg">
                          <h4 className="text-lg font-semibold mb-3">Sous-types:</h4>
                          <ul className="space-y-2">
                            {info.subtypes.map((subtype, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-primary">•</span>
                                <span>{subtype}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {'characteristics' in info && (
                        <div className="bg-muted/50 p-6 rounded-lg">
                          <h4 className="text-lg font-semibold mb-3">Caractéristiques:</h4>
                          <ul className="space-y-2">
                            {info.characteristics.map((char, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span>{char}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold mb-2">Conseil:</h4>
                        <p className="text-sm">
                          Pour ce type d'étude, utilisez l'outil de calcul approprié dans la section "Exercices d'Épidémiologie" pour analyser vos données.
                        </p>
                      </div>

                      <Button onClick={handleReset} className="w-full">
                        Recommencer l'identification
                      </Button>
                    </>
                  );
                })()}
              </div>
            )}
          </Card>

          {/* Guide de référence */}
          <Card className="p-8 mt-8">
            <h3 className="text-2xl font-bold mb-4">Guide de Référence Rapide</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-lg mb-2">Quand utiliser chaque type d'étude?</h4>
                <div className="grid md:grid-cols-2 gap-4 mt-3">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-2">Cohorte (E+/E-)</p>
                    <ul className="text-sm space-y-1">
                      <li>• Maladie fréquente</li>
                      <li>• Exposition rare</li>
                      <li>• Budget et temps disponibles</li>
                    </ul>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mb-2">Cas-Témoins</p>
                    <ul className="text-sm space-y-1">
                      <li>• Maladie rare</li>
                      <li>• Exposition fréquente</li>
                      <li>• Résultats rapides nécessaires</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                <h4 className="font-semibold mb-2">Astuce mémorisation:</h4>
                <p className="text-sm mb-2">
                  <strong>Cohorte:</strong> On part de l'EXPOSITION et on observe qui tombe MALADE
                </p>
                <p className="text-sm">
                  <strong>Cas-Témoins:</strong> On part de la MALADIE et on cherche qui était EXPOSÉ
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
