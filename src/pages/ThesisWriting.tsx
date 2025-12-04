import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  BarChart3, ArrowLeft, ArrowRight, BookOpen, FileText, 
  CheckCircle, Loader2, Copy, Download, Sparkles, GraduationCap,
  Target, FileSearch, Lightbulb, List, BookText, FlaskConical,
  Edit3, Save, FolderOpen, Plus, Trash2, FileType
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "@/components/RichTextEditor";
import { exportToWord } from "@/lib/exportWord";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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

interface ThesisProject {
  id: string;
  topic: string;
  domain: string;
  population: string | null;
  period: string | null;
  location: string | null;
  study_type: StudyTypeResult | null;
  study_type_approved: boolean;
  current_step: number;
  generated_sections: GeneratedSection[];
  created_at: string;
  updated_at: string;
}

const ThesisWriting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("Médecine");
  const [population, setPopulation] = useState("");
  const [period, setPeriod] = useState("");
  const [location, setLocation] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [studyType, setStudyType] = useState<StudyTypeResult | null>(null);
  const [studyTypeApproved, setStudyTypeApproved] = useState(false);
  
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  const [currentProject, setCurrentProject] = useState<ThesisProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<ThesisProject[]>([]);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);

  const introductionSections = [
    { id: 'context', title: 'Contexte et justification', icon: Lightbulb },
    { id: 'state_of_question', title: 'État de la question', icon: FileSearch },
    { id: 'problematic', title: 'Problématique', icon: Target },
    { id: 'choice_relevance', title: 'Choix et intérêt du sujet', icon: CheckCircle },
    { id: 'objectives', title: 'Objectifs', icon: List },
    { id: 'subdivision', title: 'Subdivision du travail', icon: BookText },
  ];

  // Check auth and load projects on mount
  useEffect(() => {
    if (!user) {
      toast.error("Veuillez vous connecter pour accéder à cette fonctionnalité");
      navigate('/auth');
      return;
    }
    loadProjects();
  }, [user, navigate]);

  const loadProjects = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('thesis_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      
      // Cast the data properly
      const projects = (data || []).map(p => ({
        ...p,
        study_type: p.study_type as unknown as StudyTypeResult | null,
        generated_sections: (p.generated_sections as unknown as GeneratedSection[]) || []
      }));
      
      setSavedProjects(projects);
    } catch (error: any) {
      console.error('Error loading projects:', error);
    }
  };

  const loadProject = (project: ThesisProject) => {
    setCurrentProject(project);
    setTopic(project.topic);
    setDomain(project.domain);
    setPopulation(project.population || '');
    setPeriod(project.period || '');
    setLocation(project.location || '');
    setStudyType(project.study_type);
    setStudyTypeApproved(project.study_type_approved);
    setGeneratedSections(project.generated_sections || []);
    setStep(project.current_step);
    setShowProjectsDialog(false);
    toast.success("Projet chargé");
  };

  const saveProject = async () => {
    if (!user || !topic.trim()) return;
    
    setIsSaving(true);
    try {
      const projectData = {
        user_id: user.id,
        topic,
        domain,
        population: population || null,
        period: period || null,
        location: location || null,
        study_type: studyType as any,
        study_type_approved: studyTypeApproved,
        current_step: step,
        generated_sections: generatedSections as any,
      };

      if (currentProject) {
        // Update existing
        const { error } = await supabase
          .from('thesis_projects')
          .update(projectData)
          .eq('id', currentProject.id);
        
        if (error) throw error;
        toast.success("Projet sauvegardé");
      } else {
        // Create new
        const { data, error } = await supabase
          .from('thesis_projects')
          .insert(projectData)
          .select()
          .single();
        
        if (error) throw error;
        
        setCurrentProject({
          ...data,
          study_type: data.study_type as unknown as StudyTypeResult | null,
          generated_sections: (data.generated_sections as unknown as GeneratedSection[]) || []
        });
        toast.success("Nouveau projet créé");
      }
      
      loadProjects();
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('thesis_projects')
        .delete()
        .eq('id', projectId);
      
      if (error) throw error;
      
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
        resetForm();
      }
      
      loadProjects();
      toast.success("Projet supprimé");
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setTopic('');
    setDomain('Médecine');
    setPopulation('');
    setPeriod('');
    setLocation('');
    setStudyType(null);
    setStudyTypeApproved(false);
    setGeneratedSections([]);
    setStep(1);
    setCurrentProject(null);
  };

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
      await saveProject();
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
      
      // Auto-save after generation
      setTimeout(() => saveProject(), 500);
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

  const updateSectionContent = (sectionId: string, newContent: string) => {
    setGeneratedSections(prev => 
      prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copié dans le presse-papiers");
  };

  const handleExportWord = async () => {
    try {
      await exportToWord(generatedSections, topic);
      toast.success("Document Word exporté avec formatage académique");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    }
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
            <div className="flex items-center gap-2">
              <Dialog open={showProjectsDialog} onOpenChange={setShowProjectsDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    Mes projets ({savedProjects.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Mes projets de thèse</DialogTitle>
                    <DialogDescription>
                      Continuez un projet existant ou créez-en un nouveau
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {savedProjects.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Aucun projet sauvegardé
                      </p>
                    ) : (
                      savedProjects.map(project => (
                        <div 
                          key={project.id} 
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => loadProject(project)}
                        >
                          <div className="flex-1">
                            <p className="font-medium line-clamp-1">{project.topic}</p>
                            <p className="text-xs text-muted-foreground">
                              Étape {project.current_step}/5 • {new Date(project.updated_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                  <Button onClick={resetForm} className="w-full">
                    <Plus className="w-4 h-4 mr-2" /> Nouveau projet
                  </Button>
                </DialogContent>
              </Dialog>
              
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={saveProject}
                disabled={isSaving || !topic.trim()}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Sauvegarder
              </Button>
              
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour
                </Button>
              </Link>
            </div>
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
            {currentProject ? `Projet: ${topic.substring(0, 50)}...` : 'Générez automatiquement les sections de votre travail scientifique'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-2 md:gap-4">
            {[
              { num: 1, label: "Sujet" },
              { num: 2, label: "Type d'étude" },
              { num: 3, label: "Informations" },
              { num: 4, label: "Introduction" },
              { num: 5, label: "Partie théorique" },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center">
                <button
                  onClick={() => {
                    if (s.num <= step || (s.num === 2 && studyType)) {
                      setStep(s.num);
                    }
                  }}
                  className={`flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full font-bold transition-colors ${
                    step >= s.num ? 'bg-primary text-primary-foreground cursor-pointer' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle className="w-4 h-4 md:w-5 md:h-5" /> : s.num}
                </button>
                <span className={`ml-1 md:ml-2 text-xs md:text-sm hidden sm:inline ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
                {i < 4 && <ArrowRight className="w-3 h-3 md:w-4 md:h-4 mx-1 md:mx-4 text-muted-foreground" />}
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
                <Button onClick={() => { setStudyTypeApproved(true); setStep(3); saveProject(); }} className="flex-1">
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
                <Button onClick={() => { setStep(4); saveProject(); }} className="flex-1">
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
                <CardDescription>Générez et éditez chaque section</CardDescription>
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
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Générer tout</>
                  )}
                </Button>

                {generatedSections.length > 0 && (
                  <Button onClick={handleExportWord} variant="outline" className="w-full">
                    <FileType className="w-4 h-4 mr-2" /> Export Word
                  </Button>
                )}

                <Button variant="outline" onClick={() => { setStep(5); saveProject(); }} className="w-full">
                  Partie théorique <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Generated Content with Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Contenu généré</span>
                  {generatedSections.length > 0 && (
                    <Badge>{generatedSections.length}/{introductionSections.length} sections</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Cliquez sur "Modifier" pour éditer une section comme dans Word
                </CardDescription>
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
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant={editingSectionId === section.id ? "secondary" : "ghost"}
                                onClick={() => setEditingSectionId(
                                  editingSectionId === section.id ? null : section.id
                                )}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => copyToClipboard(section.content)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {editingSectionId === section.id ? (
                            <div className="space-y-2">
                              <RichTextEditor
                                content={section.content}
                                onChange={(content) => updateSectionContent(section.id, content)}
                              />
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setEditingSectionId(null);
                                  saveProject();
                                }}
                              >
                                <Save className="w-4 h-4 mr-2" /> Enregistrer
                              </Button>
                            </div>
                          ) : (
                            <div 
                              className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                              style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: 1.5 }}
                            >
                              {section.content}
                            </div>
                          )}
                          
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
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant={editingSectionId === section.id ? "secondary" : "ghost"}
                        onClick={() => setEditingSectionId(
                          editingSectionId === section.id ? null : section.id
                        )}
                      >
                        <Edit3 className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => copyToClipboard(section.content)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {editingSectionId === section.id ? (
                    <div className="space-y-2">
                      <RichTextEditor
                        content={section.content}
                        onChange={(content) => updateSectionContent(section.id, content)}
                      />
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setEditingSectionId(null);
                          saveProject();
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" /> Enregistrer
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px]">
                      <div 
                        className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                        style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: 1.5 }}
                      >
                        {section.content}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ))}

              <div className="flex gap-4 pt-4">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'introduction
                </Button>
                <Button onClick={handleExportWord} disabled={generatedSections.length === 0}>
                  <FileType className="w-4 h-4 mr-2" /> Export Word
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
