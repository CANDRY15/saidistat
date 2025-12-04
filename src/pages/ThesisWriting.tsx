import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, ArrowLeft, ArrowRight, BookOpen, FileText, 
  CheckCircle, Loader2, Copy, Download, Sparkles, GraduationCap,
  Target, FileSearch, Lightbulb, List, BookText, FlaskConical
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudyTypeResult {
  studyType: string;
  justification: string;
  characteristics: string[];
  suggestedObjectives: {
    general: string;
    specific: string[];
  };
}

interface GeneratedSection {
  id: string;
  title: string;
  content: string;
  references?: string[];
}

const ThesisWriting = () => {
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("Médecine");
  const [population, setPopulation] = useState("");
  const [period, setPeriod] = useState("");
  const [location, setLocation] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [studyType, setStudyType] = useState<StudyTypeResult | null>(null);
  const [studyTypeApproved, setStudyTypeApproved] = useState(false);
  
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  const introductionSections = [
    { id: 'context', title: 'Contexte et justification', icon: Lightbulb },
    { id: 'state_of_question', title: 'État de la question', icon: FileSearch },
    { id: 'problematic', title: 'Problématique', icon: Target },
    { id: 'choice_relevance', title: 'Choix et intérêt du sujet', icon: CheckCircle },
    { id: 'objectives', title: 'Objectifs', icon: List },
    { id: 'subdivision', title: 'Subdivision du travail', icon: BookText },
  ];

  const identifyStudyType = async () => {
    if (!topic.trim()) {
      toast.error("Veuillez entrer un sujet de recherche");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { action: 'identify_study', topic }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setStudyType(data);
      setStep(2);
      toast.success("Type d'étude identifié");
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de l'identification du type d'étude");
    } finally {
      setIsLoading(false);
    }
  };

  const generateSection = async (sectionId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: {
          action: 'generate_section',
          topic,
          studyType: studyType?.studyType,
          section: sectionId,
          context: {
            domain,
            population,
            period,
            location,
            objective: studyType?.suggestedObjectives.general
          }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      // Format the content based on section type
      let content = '';
      let references: string[] = [];

      if (data.content) {
        content = data.content;
      } else if (data.generalObjective) {
        content = `**Objectif général:**\n${data.generalObjective}\n\n**Objectifs spécifiques:**\n${data.specificObjectives?.map((obj: string, i: number) => `${i + 1}. ${obj}`).join('\n')}`;
      } else if (data.sections) {
        content = data.sections.map((s: any) => `### ${s.title}\n\n${s.content}`).join('\n\n');
      }

      if (data.references) {
        references = data.references;
      }

      const sectionTitle = introductionSections.find(s => s.id === sectionId)?.title || sectionId;
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === sectionId);
        const newSection = { id: sectionId, title: sectionTitle, content, references };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      toast.success(`Section "${sectionTitle}" générée`);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

  const generateAllIntroduction = async () => {
    for (const section of introductionSections) {
      await generateSection(section.id);
    }
    toast.success("Introduction complète générée!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const exportDocument = () => {
    const content = generatedSections.map(s => 
      `## ${s.title}\n\n${s.content}\n\n${s.references?.length ? `**Références:**\n${s.references.join('\n')}` : ''}`
    ).join('\n\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.substring(0, 30)}_introduction.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Document exporté");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                BioStasmarT
              </span>
            </Link>
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Title */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <GraduationCap className="w-5 h-5" />
            <span className="font-medium">Assistant de rédaction scientifique</span>
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Rédaction de Thèse / Mémoire
          </h1>
          <p className="text-xl text-muted-foreground">
            Générez automatiquement les sections de votre travail scientifique
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-4">
            {[
              { num: 1, label: "Sujet" },
              { num: 2, label: "Type d'étude" },
              { num: 3, label: "Informations" },
              { num: 4, label: "Introduction" },
              { num: 5, label: "Partie théorique" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`ml-2 text-sm ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < 4 && <ArrowRight className="w-4 h-4 mx-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Topic Input */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Étape 1: Entrez votre sujet de recherche
              </CardTitle>
              <CardDescription>
                L'IA va identifier le type d'étude approprié pour votre sujet
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sujet de recherche / Titre du mémoire</Label>
                <Textarea 
                  placeholder="Ex: Pré-éclampsie à la maternité de l'HGPR Jason Sendwe : Prévalence, épidémiologie et complications"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Domaine</Label>
                <Input 
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Médecine, Gynécologie-Obstétrique, etc."
                />
              </div>
              <Button 
                onClick={identifyStudyType} 
                disabled={isLoading || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyse en cours...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Identifier le type d'étude</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Study Type Confirmation */}
        {step === 2 && studyType && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSearch className="w-5 h-5 text-primary" />
                Étape 2: Type d'étude identifié
              </CardTitle>
              <CardDescription>
                Confirmez ou modifiez le type d'étude suggéré
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <h3 className="font-bold text-lg text-primary mb-2">{studyType.studyType}</h3>
                <p className="text-muted-foreground">{studyType.justification}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Caractéristiques:</h4>
                <div className="flex flex-wrap gap-2">
                  {studyType.characteristics.map((char, i) => (
                    <Badge key={i} variant="secondary">{char}</Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">Objectifs suggérés:</h4>
                <div className="space-y-2">
                  <p><strong>Général:</strong> {studyType.suggestedObjectives.general}</p>
                  <div>
                    <strong>Spécifiques:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {studyType.suggestedObjectives.specific.map((obj, i) => (
                        <li key={i} className="text-muted-foreground">{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Modifier le sujet
                </Button>
                <Button onClick={() => { setStudyTypeApproved(true); setStep(3); }} className="flex-1">
                  Approuver et continuer <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Additional Information */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Étape 3: Informations complémentaires
              </CardTitle>
              <CardDescription>
                Ces informations enrichiront la génération du contenu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Population d'étude</Label>
                <Input 
                  value={population}
                  onChange={(e) => setPopulation(e.target.value)}
                  placeholder="Ex: Gestantes avec pré-éclampsie"
                />
              </div>
              <div className="space-y-2">
                <Label>Période d'étude</Label>
                <Input 
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  placeholder="Ex: Du 1er janvier 2022 au 31 décembre 2022"
                />
              </div>
              <div className="space-y-2">
                <Label>Lieu d'étude</Label>
                <Input 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Maternité de l'HGPR Jason Sendwe, Lubumbashi"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
                <Button onClick={() => setStep(4)} className="flex-1">
                  Générer l'introduction <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Introduction Generation */}
        {step === 4 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sections Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Sections de l'Introduction</CardTitle>
                <CardDescription>Générez chaque section individuellement ou toutes à la fois</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {introductionSections.map((section) => {
                  const isGenerated = generatedSections.some(s => s.id === section.id);
                  const Icon = section.icon;
                  return (
                    <Button
                      key={section.id}
                      variant={isGenerated ? "secondary" : "outline"}
                      className="w-full justify-start"
                      onClick={() => generateSection(section.id)}
                      disabled={isLoading}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {section.title}
                      {isGenerated && <CheckCircle className="w-4 h-4 ml-auto text-green-500" />}
                    </Button>
                  );
                })}

                <Separator className="my-4" />

                <Button 
                  onClick={generateAllIntroduction} 
                  disabled={isLoading}
                  className="w-full"
                  variant="hero"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Générer tout</>
                  )}
                </Button>

                {generatedSections.length > 0 && (
                  <Button onClick={exportDocument} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" /> Exporter
                  </Button>
                )}

                <Button variant="outline" onClick={() => setStep(5)} className="w-full">
                  Partie théorique <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contenu généré</span>
                  {generatedSections.length > 0 && (
                    <Badge>{generatedSections.length}/{introductionSections.length} sections</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {generatedSections.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Cliquez sur une section pour la générer</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {generatedSections.map((section) => (
                        <div key={section.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-lg">{section.title}</h3>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => copyToClipboard(section.content)}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                            {section.content}
                          </div>
                          {section.references && section.references.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium mb-2">Références utilisées:</p>
                              <ul className="text-xs text-muted-foreground space-y-1">
                                {section.references.map((ref, i) => (
                                  <li key={i}>• {ref}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 5: Theoretical Part */}
        {step === 5 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-primary" />
                Étape 5: Partie Théorique
              </CardTitle>
              <CardDescription>
                Générez les considérations théoriques de votre travail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  onClick={() => generateSection('theoretical_part')} 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                  ) : (
                    <><BookText className="w-4 h-4 mr-2" /> Généralités sur le sujet</>
                  )}
                </Button>
              </div>

              {generatedSections.filter(s => s.id === 'theoretical_part').map((section) => (
                <div key={section.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">{section.title}</h3>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => copyToClipboard(section.content)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px]">
                    <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </ScrollArea>
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'introduction
                </Button>
                <Button onClick={exportDocument} disabled={generatedSections.length === 0}>
                  <Download className="w-4 h-4 mr-2" /> Exporter tout
                </Button>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> La section Méthodologie sera générée après avoir analysé votre base de données 
                  dans le module d'analyse de données. Les résultats et la discussion seront également basés sur vos 
                  analyses statistiques réelles.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ThesisWriting;
