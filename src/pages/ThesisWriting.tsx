import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, ArrowRight, BookOpen, FileText, 
  CheckCircle, Loader2, Copy, Download, Sparkles, GraduationCap,
  Edit3, Save, FolderOpen, Plus, Trash2, FileType, BookMarked,
  Upload, BarChart3, FileSpreadsheet
} from "lucide-react";
import saidistatLogo from "@/assets/saidistat-logo.jpg";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import RichTextEditor from "@/components/RichTextEditor";
import ReferenceManager, { Reference, CitationFormat } from "@/components/ReferenceManager";
import { exportToWord } from "@/lib/exportWord";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

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
  study_type: any | null;
  study_type_approved: boolean;
  current_step: number;
  generated_sections: GeneratedSection[];
  bibliography?: Reference[];
  citation_format?: CitationFormat;
  created_at: string;
  updated_at: string;
}

const ThesisWriting = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Steps: 1=Topic, 2=Introduction, 3=Theoretical, 4=Methodology, 5=Results, 6=Discussion, 7=Conclusion
  const [step, setStep] = useState(1);
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("Médecine");
  const [population, setPopulation] = useState("");
  const [period, setPeriod] = useState("");
  const [location, setLocation] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const [generatedSections, setGeneratedSections] = useState<GeneratedSection[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  
  const [currentProject, setCurrentProject] = useState<ThesisProject | null>(null);
  const [savedProjects, setSavedProjects] = useState<ThesisProject[]>([]);
  const [showProjectsDialog, setShowProjectsDialog] = useState(false);
  
  // Bibliography state
  const [bibliography, setBibliography] = useState<Reference[]>([]);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>('apa');
  const [showReferences, setShowReferences] = useState(false);
  
  // Excel data for results
  const [excelData, setExcelData] = useState<any>(null);

  const stepLabels = [
    { num: 1, label: "Sujet", icon: BookOpen },
    { num: 2, label: "Introduction", icon: FileText },
    { num: 3, label: "Théorie", icon: BookMarked },
    { num: 4, label: "Méthodologie", icon: BarChart3 },
    { num: 5, label: "Résultats", icon: FileSpreadsheet },
    { num: 6, label: "Discussion", icon: Edit3 },
    { num: 7, label: "Conclusion", icon: CheckCircle },
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
      
      const projects = (data || []).map(p => ({
        ...p,
        study_type: p.study_type as any,
        generated_sections: (p.generated_sections as unknown as GeneratedSection[]) || [],
        bibliography: (p.bibliography as unknown as Reference[]) || [],
        citation_format: (p.citation_format as CitationFormat) || 'apa'
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
    setGeneratedSections(project.generated_sections || []);
    setBibliography(project.bibliography || []);
    setCitationFormat(project.citation_format || 'apa');
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
        study_type: null,
        study_type_approved: false,
        current_step: step,
        generated_sections: generatedSections as any,
        bibliography: bibliography as any,
        citation_format: citationFormat,
      };

      if (currentProject) {
        const { error } = await supabase
          .from('thesis_projects')
          .update(projectData)
          .eq('id', currentProject.id);
        
        if (error) throw error;
        toast.success("Projet sauvegardé");
      } else {
        const { data, error } = await supabase
          .from('thesis_projects')
          .insert(projectData)
          .select()
          .single();
        
        if (error) throw error;
        
        setCurrentProject({
          ...data,
          study_type: null,
          generated_sections: [],
          bibliography: [],
          citation_format: 'apa'
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
    setGeneratedSections([]);
    setBibliography([]);
    setCitationFormat('apa');
    setStep(1);
    setCurrentProject(null);
    setExcelData(null);
  };
  // Helper: auto-add real references from AI generation to bibliography
  const autoAddReferences = (realRefs: any[] | undefined) => {
    if (!realRefs || realRefs.length === 0) return;
    
    const newRefs = [...bibliography];
    let addedCount = 0;
    for (const ref of realRefs) {
      const isDuplicate = newRefs.some(
        r => (ref.doi && r.doi === ref.doi) || 
             (ref.pmid && r.pmid === ref.pmid) ||
             (ref.title && r.title?.toLowerCase() === ref.title.toLowerCase())
      );
      if (!isDuplicate) {
        newRefs.push(ref);
        addedCount++;
      }
    }
    if (addedCount > 0) {
      setBibliography(newRefs);
      toast.success(`${addedCount} références réelles ajoutées à la bibliographie`);
    }
  };

  // Generate Introduction (complete)
  const generateIntroduction = async () => {
    if (!topic.trim()) {
      toast.error("Veuillez entrer un sujet de recherche");
      return;
    }

    setIsLoading(true);
    setGenerationProgress(10);
    
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'generate_introduction', 
          topic,
          context: { domain, population, period, location }
        }
      });

      setGenerationProgress(80);

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const content = data.content || '';
      
      // Auto-add real references to bibliography
      autoAddReferences(data.realReferences);
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'introduction');
        const newSection = { 
          id: 'introduction', 
          title: 'Introduction', 
          content,
          references: data.references?.map((r: any) => r.fullReference || r.citation) || []
        };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      setGenerationProgress(100);
      toast.success("Introduction générée avec références réelles (4+ pages)");
      setStep(2);
      
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  };

  // Generate Theoretical Part
  const generateTheoretical = async () => {
    setIsLoading(true);
    setGenerationProgress(10);
    
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'generate_theoretical', 
          topic,
          context: { domain, population, period, location }
        }
      });

      setGenerationProgress(80);

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      let content = data.content || '';
      if (data.sections) {
        content = data.sections.map((s: any) => `<h3>${s.title}</h3>\n${s.content}`).join('\n\n');
      }

      // Auto-add real references to bibliography
      autoAddReferences(data.realReferences);
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'theoretical');
        const newSection = { 
          id: 'theoretical', 
          title: 'Considérations Théoriques', 
          content,
          references: data.references?.map((r: any) => r.fullReference || r.citation) || []
        };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      setGenerationProgress(100);
      toast.success("Partie théorique générée avec références réelles (15+ pages)");
      
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
      setGenerationProgress(0);
    }
  };

  // Generate Methodology
  const generateMethodology = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'generate_methodology', 
          topic,
          studyType: 'Étude descriptive transversale',
          context: { domain, population, period, location }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      let content = data.content || '';
      if (data.sections) {
        content = data.sections.map((s: any) => `<h3>${s.title}</h3>\n${s.content}`).join('\n\n');
      }
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'methodology');
        const newSection = { id: 'methodology', title: 'Matériel et Méthodes', content };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      toast.success("Méthodologie générée");
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Excel upload for results
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // For now, we'll read CSV/Excel as text and parse it
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (text) {
        // Simple CSV parsing
        const lines = text.split('\n').filter(l => l.trim());
        const headers = lines[0]?.split(',').map(h => h.trim());
        const rows = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const row: any = {};
          headers?.forEach((h, i) => {
            row[h] = values[i] || '';
          });
          return row;
        });
        
        setExcelData({ headers, rows, rowCount: rows.length });
        toast.success(`Données chargées: ${rows.length} lignes`);
      }
    };
    reader.readAsText(file);
  };

  // Analyze data and generate results
  const analyzeDataAndGenerateResults = async () => {
    if (!excelData) {
      toast.error("Veuillez d'abord téléverser vos données");
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'analyze_data', 
          topic,
          excelData,
          context: { domain, population, period, location }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      let content = data.content || '';
      if (data.tables) {
        // Add tables to content
        data.tables.forEach((table: any) => {
          content += `\n\n<h4>Tableau ${table.number}: ${table.title}</h4>\n`;
          // Format table as HTML
          if (table.data && table.data.length > 0) {
            content += '<table border="1" style="width:100%; border-collapse: collapse;">';
            content += '<tr>' + table.data[0].map((h: string) => `<th style="padding:8px; background:#f5f5f5;">${h}</th>`).join('') + '</tr>';
            table.data.slice(1).forEach((row: string[]) => {
              content += '<tr>' + row.map((c: string) => `<td style="padding:8px;">${c}</td>`).join('') + '</tr>';
            });
            content += '</table>';
          }
        });
      }
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'results');
        const newSection = { id: 'results', title: 'Résultats', content };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      toast.success("Résultats générés (sans références)");
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de l'analyse");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Discussion
  const generateDiscussion = async () => {
    setIsLoading(true);
    
    try {
      const resultsSection = generatedSections.find(s => s.id === 'results');
      
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'generate_discussion', 
          topic,
          context: { 
            domain, 
            population, 
            period, 
            location,
            existingSections: [resultsSection?.content || '']
          }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      let content = data.content || '';
      if (data.sections) {
        content = data.sections.map((s: any) => `<h3>${s.title}</h3>\n${s.content}`).join('\n\n');
      }
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'discussion');
        const newSection = { 
          id: 'discussion', 
          title: 'Discussion', 
          content,
          references: data.references?.map((r: any) => r.fullReference || r.citation) || []
        };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      toast.success("Discussion générée");
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate Conclusion
  const generateConclusion = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { 
          action: 'generate_conclusion', 
          topic,
          context: { 
            domain, 
            population, 
            objective: `Étude sur ${topic}`
          }
        }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      const content = data.content || '';
      
      setGeneratedSections(prev => {
        const existing = prev.findIndex(s => s.id === 'conclusion');
        const newSection = { id: 'conclusion', title: 'Conclusion', content };
        
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = newSection;
          return updated;
        }
        return [...prev, newSection];
      });

      toast.success("Conclusion générée");
      setTimeout(() => saveProject(), 500);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || "Erreur lors de la génération");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSectionContent = (sectionId: string, newContent: string) => {
    setGeneratedSections(prev => 
      prev.map(s => s.id === sectionId ? { ...s, content: newContent } : s)
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text.replace(/<[^>]*>/g, ''));
    toast.success("Copié dans le presse-papiers");
  };

  const handleExportWord = async () => {
    try {
      await exportToWord(generatedSections, topic, bibliography, citationFormat);
      toast.success("Document Word exporté");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Erreur lors de l'export");
    }
  };

  const getCurrentSection = () => {
    switch (step) {
      case 2: return generatedSections.find(s => s.id === 'introduction');
      case 3: return generatedSections.find(s => s.id === 'theoretical');
      case 4: return generatedSections.find(s => s.id === 'methodology');
      case 5: return generatedSections.find(s => s.id === 'results');
      case 6: return generatedSections.find(s => s.id === 'discussion');
      case 7: return generatedSections.find(s => s.id === 'conclusion');
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img src={saidistatLogo} alt="SaidiStat Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SaidiStat
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
                              Étape {project.current_step}/7 • {new Date(project.updated_at).toLocaleDateString('fr-FR')}
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
            {currentProject ? `Projet: ${topic.substring(0, 50)}...` : 'Entrez votre sujet et laissez l\'IA générer votre travail'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8 overflow-x-auto pb-2">
          <div className="flex items-center gap-1 md:gap-2">
            {stepLabels.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.num} className="flex items-center">
                  <button
                    onClick={() => {
                      if (s.num <= step || (s.num === 2 && generatedSections.some(sec => sec.id === 'introduction'))) {
                        setStep(s.num);
                      }
                    }}
                    className={`flex flex-col items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full font-bold transition-colors ${
                      step >= s.num ? 'bg-primary text-primary-foreground cursor-pointer' : 'bg-muted text-muted-foreground'
                    } ${step === s.num ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    {step > s.num ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </button>
                  <span className={`ml-1 text-xs hidden lg:inline ${step >= s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {s.label}
                  </span>
                  {i < stepLabels.length - 1 && (
                    <ArrowRight className="w-3 h-3 mx-1 md:mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 1: Topic Input - Simplified */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Entrez votre sujet de recherche
              </CardTitle>
              <CardDescription>
                L'IA va générer directement l'introduction complète (4+ pages) de votre mémoire
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sujet de recherche / Titre du mémoire *</Label>
                <Textarea 
                  placeholder="Ex: Pré-éclampsie à la maternité de l'HGPR Janson Sendwe : Prévalence, profil épidémiologique et issues materno-fœtales"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Domaine</Label>
                  <Input 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="Médecine, Gynécologie-Obstétrique..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lieu d'étude</Label>
                  <Input 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: HGPR Janson Sendwe, Lubumbashi"
                  />
                </div>
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
                    placeholder="Ex: Janvier 2023 - Décembre 2023"
                  />
                </div>
              </div>
              
              {isLoading && generationProgress > 0 && (
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <p className="text-sm text-center text-muted-foreground">
                    Génération de l'introduction en cours...
                  </p>
                </div>
              )}
              
              <Button 
                onClick={generateIntroduction} 
                disabled={isLoading || !topic.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Génération en cours...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Générer l'Introduction (4+ pages)</>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Steps 2-7: Section Editor */}
        {step >= 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Tabs value={showReferences ? 'refs' : 'sections'} onValueChange={(v) => setShowReferences(v === 'refs')}>
                  <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="sections">Sections</TabsTrigger>
                    <TabsTrigger value="refs">Réf. ({bibliography.length})</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sections" className="space-y-2">
                    {/* Section buttons */}
                    {[
                      { id: 'introduction', step: 2, label: 'Introduction', action: generateIntroduction },
                      { id: 'theoretical', step: 3, label: 'Partie Théorique', action: generateTheoretical },
                      { id: 'methodology', step: 4, label: 'Méthodologie', action: generateMethodology },
                      { id: 'results', step: 5, label: 'Résultats', action: analyzeDataAndGenerateResults },
                      { id: 'discussion', step: 6, label: 'Discussion', action: generateDiscussion },
                      { id: 'conclusion', step: 7, label: 'Conclusion', action: generateConclusion },
                    ].map((section) => {
                      const hasContent = generatedSections.some(s => s.id === section.id);
                      return (
                        <Button
                          key={section.id}
                          variant={step === section.step ? 'default' : hasContent ? 'secondary' : 'outline'}
                          className="w-full justify-start"
                          onClick={() => setStep(section.step)}
                        >
                          {hasContent && <CheckCircle className="w-4 h-4 mr-2 text-green-500" />}
                          {section.label}
                        </Button>
                      );
                    })}
                    
                    <Separator className="my-4" />
                    
                    {generatedSections.length > 0 && (
                      <Button onClick={handleExportWord} variant="outline" className="w-full">
                        <FileType className="w-4 h-4 mr-2" /> Export Word
                      </Button>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="refs">
                    <ReferenceManager
                      references={bibliography}
                      onReferencesChange={(refs) => {
                        setBibliography(refs);
                        setTimeout(() => saveProject(), 500);
                      }}
                      citationFormat={citationFormat}
                      onFormatChange={(format) => {
                        setCitationFormat(format);
                        setTimeout(() => saveProject(), 500);
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Main Content */}
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{stepLabels[step - 1]?.label || 'Section'}</span>
                  <div className="flex gap-2">
                    {step > 1 && (
                      <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                        <ArrowLeft className="w-4 h-4 mr-1" /> Précédent
                      </Button>
                    )}
                    {step < 7 && (
                      <Button variant="outline" size="sm" onClick={() => setStep(step + 1)}>
                        Suivant <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Step 5 special: Excel upload for results */}
                {step === 5 && (
                  <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-primary" />
                      <Label className="font-semibold">Téléversez votre base de données</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Téléversez votre fichier Excel ou CSV, l'IA analysera les données et générera les résultats
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleExcelUpload}
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                      />
                      <Button 
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {excelData ? `${excelData.rowCount} lignes chargées` : 'Téléverser Excel/CSV'}
                      </Button>
                      {excelData && (
                        <Button onClick={analyzeDataAndGenerateResults} disabled={isLoading}>
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                          Analyser
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Generation button for current step */}
                {!getCurrentSection() && step !== 5 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground mb-4">
                      Cette section n'a pas encore été générée
                    </p>
                    <Button 
                      onClick={() => {
                        switch (step) {
                          case 2: generateIntroduction(); break;
                          case 3: generateTheoretical(); break;
                          case 4: generateMethodology(); break;
                          case 6: generateDiscussion(); break;
                          case 7: generateConclusion(); break;
                        }
                      }}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Générer cette section
                    </Button>
                  </div>
                )}

                {/* Display generated content */}
                {getCurrentSection() && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">
                        {getCurrentSection()?.content.split(' ').length || 0} mots
                      </Badge>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant={editingSectionId === getCurrentSection()?.id ? 'secondary' : 'ghost'}
                          onClick={() => setEditingSectionId(
                            editingSectionId === getCurrentSection()?.id ? null : getCurrentSection()?.id || null
                          )}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          {editingSectionId === getCurrentSection()?.id ? 'Aperçu' : 'Modifier'}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => copyToClipboard(getCurrentSection()?.content || '')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {editingSectionId === getCurrentSection()?.id ? (
                      <div className="space-y-2">
                        <RichTextEditor
                          content={getCurrentSection()?.content || ''}
                          onChange={(content) => updateSectionContent(getCurrentSection()?.id || '', content)}
                        />
                        <Button 
                          onClick={() => {
                            setEditingSectionId(null);
                            saveProject();
                          }}
                        >
                          <Save className="w-4 h-4 mr-2" /> Enregistrer
                        </Button>
                      </div>
                    ) : (
                      <ScrollArea className="h-[500px] border rounded-lg p-4">
                        <div 
                          className="prose prose-sm max-w-none dark:prose-invert"
                          style={{ fontFamily: '"Times New Roman", Times, serif', lineHeight: 1.5 }}
                          dangerouslySetInnerHTML={{ __html: getCurrentSection()?.content || '' }}
                        />
                      </ScrollArea>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default ThesisWriting;
