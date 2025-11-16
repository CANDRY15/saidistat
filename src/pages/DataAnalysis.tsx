import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Upload, Database, ArrowLeft, TrendingUp, FileText, FileSpreadsheet, Check, Link2, Save, FolderOpen, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import html2canvas from 'html2canvas';
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface FrequencyItem {
  value: string;
  count: number;
  percentage: number;
}

interface ColumnStats {
  name: string;
  type: 'numeric' | 'text' | 'age_groups';
  count: number;
  missing: number;
  unique?: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  mode?: string;
  frequencies?: FrequencyItem[];
}

type AnalysisType = 'frequency' | 'association' | 'advanced' | null;
type AnalysisSubType = 'chi2' | 'correlation' | 'ttest' | 'anova' | 'regression' | null;

const DataAnalysis = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType>(null);
  const [analysisSubType, setAnalysisSubType] = useState<AnalysisSubType>(null);
  const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [showRawData, setShowRawData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [analysisName, setAnalysisName] = useState("");
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const rowsPerPage = 10;

  useEffect(() => {
    if (user) {
      loadSavedAnalyses();
    }
  }, [user]);

  const loadSavedAnalyses = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_analyses')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error: any) {
      console.error('Error loading saved analyses:', error);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ['.csv', '.xlsx', '.xls', '.sav'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validTypes.includes(fileExtension)) {
        setSelectedFile(file);
        
        try {
          const formData = new FormData();
          formData.append('file', file);

          const { data, error } = await supabase.functions.invoke('analyze-data', {
            body: formData,
          });

          if (error) throw error;
          
          setUploadedData(data);
          toast({
            title: "Fichier chargé",
            description: `${file.name} - ${data.rowCount} lignes et ${data.columnCount} colonnes`,
          });
        } catch (error: any) {
          console.error('Error loading data:', error);
          toast({
            title: "Erreur de chargement",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Format non supporté",
          description: "Veuillez sélectionner un fichier CSV, Excel ou SPSS",
          variant: "destructive",
        });
      }
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadedData || !analysisType || selectedVariables.length === 0) return;
    
    setIsAnalyzing(true);
    setStep(4);
    
    toast({
      title: "Analyse en cours",
      description: "Traitement des données...",
    });

    try {
      let results: any = {};

      if (analysisType === 'frequency') {
        const filteredStats = uploadedData.statistics.filter((stat: ColumnStats) => 
          selectedVariables.includes(stat.name)
        );
        
        results = {
          type: 'frequency',
          statistics: filteredStats
        };
      } else if (analysisType === 'association') {
        if (!analysisSubType) {
          throw new Error('Veuillez sélectionner un type d\'analyse d\'association');
        }

        const { data, error } = await supabase.functions.invoke('association-analysis', {
          body: {
            data: uploadedData.preview,
            variables: selectedVariables,
            analysisSubType
          }
        });

        if (error) throw error;
        
        results = {
          type: 'association',
          subType: analysisSubType,
          ...data
        };
      } else if (analysisType === 'advanced') {
        if (!analysisSubType) {
          throw new Error('Veuillez sélectionner un type d\'analyse avancée');
        }

        const { data, error } = await supabase.functions.invoke('advanced-analysis', {
          body: {
            data: uploadedData.preview,
            variables: selectedVariables,
            analysisSubType
          }
        });

        if (error) throw error;
        
        results = {
          type: 'advanced',
          subType: analysisSubType,
          ...data
        };
      }
      
      setAnalysisResult(results);
      
      toast({
        title: "Analyse terminée",
        description: `${selectedVariables.length} variable(s) analysée(s) avec succès`,
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: "Erreur d'analyse",
        description: error.message,
        variant: "destructive",
      });
      setStep(3);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!analysisName.trim() || !analysisResult || !user) return;

    try {
      const { error } = await supabase
        .from('saved_analyses')
        .insert({
          user_id: user.id,
          analysis_name: analysisName.trim(),
          analysis_type: analysisType!,
          file_name: selectedFile?.name || 'Unknown',
          selected_variables: selectedVariables,
          results: analysisResult
        });

      if (error) throw error;

      toast({
        title: "Analyse sauvegardée",
        description: `"${analysisName}" a été sauvegardée avec succès`,
      });

      setShowSaveDialog(false);
      setAnalysisName("");
      loadSavedAnalyses();
    } catch (error: any) {
      toast({
        title: "Erreur de sauvegarde",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoadAnalysis = (analysis: any) => {
    setAnalysisResult(analysis.results);
    setAnalysisType(analysis.analysis_type);
    setSelectedVariables(analysis.selected_variables);
    setStep(4);
    setShowLoadDialog(false);
    
    toast({
      title: "Analyse chargée",
      description: `"${analysis.analysis_name}" a été chargée`,
    });
  };

  const handleVariableToggle = (variable: string) => {
    setSelectedVariables(prev => 
      prev.includes(variable) 
        ? prev.filter(v => v !== variable)
        : [...prev, variable]
    );
  };

  const resetAnalysis = () => {
    setStep(1);
    setSelectedFile(null);
    setUploadedData(null);
    setAnalysisType(null);
    setAnalysisSubType(null);
    setSelectedVariables([]);
    setAnalysisResult(null);
    setShowRawData(false);
    setCurrentPage(1);
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

  // Render raw data table with pagination
  const renderRawDataTable = () => {
    if (!uploadedData?.preview) return null;

    const startIdx = (currentPage - 1) * rowsPerPage;
    const endIdx = startIdx + rowsPerPage;
    const paginatedData = uploadedData.preview.slice(startIdx, endIdx);
    const totalPages = Math.ceil(uploadedData.preview.length / rowsPerPage);

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Données brutes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {uploadedData.columns.map((col: string) => (
                    <TableHead key={col}>{col}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((row: any, idx: number) => (
                  <TableRow key={idx}>
                    {uploadedData.columns.map((col: string) => (
                      <TableCell key={col}>{row[col]}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render frequency results
  const renderFrequencyResults = () => {
    if (!analysisResult || analysisResult.type !== 'frequency') return null;

    return analysisResult.statistics.map((stat: ColumnStats) => (
      <Card key={stat.name} className="mb-6">
        <CardHeader>
          <CardTitle>{stat.name}</CardTitle>
        </CardHeader>
        <CardContent>
          {stat.frequencies && (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stat.frequencies}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="value" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    ));
  };

  // Render association results
  const renderAssociationResults = () => {
    if (!analysisResult || analysisResult.type !== 'association') return null;

    if (analysisResult.chi2Tests) {
      return analysisResult.chi2Tests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Chi² Test: {test.variable1} × {test.variable2}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">χ²</p>
                <p className="text-xl font-bold">{test.chi2}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">p-value</p>
                <p className="text-xl font-bold">{test.pValue}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Significatif</p>
                <p className={`text-xl font-bold ${test.significant ? 'text-green-600' : 'text-red-600'}`}>
                  {test.significant ? 'Oui' : 'Non'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.correlations) {
      return analysisResult.correlations.map((corr: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Corrélation: {corr.variable1} × {corr.variable2}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">r</p>
                <p className="text-xl font-bold">{corr.correlation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">p-value</p>
                <p className="text-xl font-bold">{corr.pValue}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Significatif</p>
                <p className={`text-xl font-bold ${corr.significant ? 'text-green-600' : 'text-red-600'}`}>
                  {corr.significant ? 'Oui' : 'Non'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }
  };

  // Render advanced results
  const renderAdvancedResults = () => {
    if (!analysisResult || analysisResult.type !== 'advanced') return null;

    if (analysisResult.tTests) {
      return analysisResult.tTests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Test t: {test.group1} vs {test.group2}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm">Moyenne 1</p>
                <p className="font-bold">{test.mean1}</p>
              </div>
              <div>
                <p className="text-sm">Moyenne 2</p>
                <p className="font-bold">{test.mean2}</p>
              </div>
              <div>
                <p className="text-sm">t</p>
                <p className="font-bold">{test.tStatistic}</p>
              </div>
              <div>
                <p className="text-sm">p-value</p>
                <p className="font-bold">{test.pValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.anovaTests) {
      return analysisResult.anovaTests.map((test: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>ANOVA: {test.dependentVariable} par {test.independentVariable}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-sm">F</p>
                <p className="font-bold">{test.fStatistic}</p>
              </div>
              <div>
                <p className="text-sm">p-value</p>
                <p className="font-bold">{test.pValue}</p>
              </div>
              <div>
                <p className="text-sm">Significatif</p>
                <p className={test.significant ? 'font-bold text-green-600' : 'font-bold text-red-600'}>
                  {test.significant ? 'Oui' : 'Non'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }

    if (analysisResult.regressions) {
      return analysisResult.regressions.map((reg: any, idx: number) => (
        <Card key={idx} className="mb-6">
          <CardHeader>
            <CardTitle>Régression: {reg.dependentVariable}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm">R²</p>
                <p className="font-bold">{reg.rSquared}</p>
              </div>
              <div>
                <p className="text-sm">p-value</p>
                <p className="font-bold">{reg.pValue}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">BioStasmarT</span>
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
        <h1 className="text-4xl font-bold mb-8">Analyse de données</h1>

        {/* Step indicator */}
        <div className="mb-8 flex justify-center gap-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {s}
              </div>
              {s < 4 && <div className={`h-1 w-16 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 1 : Télécharger les données</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input type="file" accept=".csv,.xlsx,.xls,.sav" onChange={handleFileChange} />
              
              {uploadedData && (
                <div className="p-4 bg-muted rounded">
                  <p className="font-semibold">{uploadedData.fileName}</p>
                  <p className="text-sm">{uploadedData.rowCount} × {uploadedData.columnCount}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={() => setStep(2)} disabled={!uploadedData} className="flex-1">
                  Continuer
                </Button>
                <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Charger
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Analyses sauvegardées</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2">
                      {savedAnalyses.map(a => (
                        <Button key={a.id} variant="outline" className="w-full" onClick={() => handleLoadAnalysis(a)}>
                          {a.analysis_name}
                        </Button>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Analysis Type */}
        {step === 2 && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 2 : Type d'analyse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer ${analysisType === 'frequency' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('frequency')}>
                  <CardHeader>
                    <FileSpreadsheet className="w-12 h-12 mb-2" />
                    <CardTitle>Fréquence</CardTitle>
                  </CardHeader>
                </Card>
                <Card className={`cursor-pointer ${analysisType === 'association' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('association')}>
                  <CardHeader>
                    <Link2 className="w-12 h-12 mb-2" />
                    <CardTitle>Associations</CardTitle>
                  </CardHeader>
                </Card>
                <Card className={`cursor-pointer ${analysisType === 'advanced' ? 'ring-2 ring-primary' : ''}`} onClick={() => setAnalysisType('advanced')}>
                  <CardHeader>
                    <TrendingUp className="w-12 h-12 mb-2" />
                    <CardTitle>Avancées</CardTitle>
                  </CardHeader>
                </Card>
              </div>

              {analysisType === 'association' && (
                <Select value={analysisSubType || ''} onValueChange={(v) => setAnalysisSubType(v as AnalysisSubType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chi2">Test χ²</SelectItem>
                    <SelectItem value="correlation">Corrélation</SelectItem>
                  </SelectContent>
                </Select>
              )}

              {analysisType === 'advanced' && (
                <Select value={analysisSubType || ''} onValueChange={(v) => setAnalysisSubType(v as AnalysisSubType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ttest">Test t</SelectItem>
                    <SelectItem value="anova">ANOVA</SelectItem>
                    <SelectItem value="regression">Régression</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)}>Retour</Button>
                <Button onClick={() => setStep(3)} disabled={!analysisType} className="flex-1">Continuer</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Variables */}
        {step === 3 && uploadedData && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Étape 3 : Sélection des variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-3">
                {uploadedData.columns.map((col: string) => (
                  <div key={col} className="flex items-center gap-2">
                    <Checkbox checked={selectedVariables.includes(col)} onCheckedChange={() => handleVariableToggle(col)} />
                    <label className="text-sm">{col}</label>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)}>Retour</Button>
                <Button onClick={handleRunAnalysis} disabled={selectedVariables.length === 0} className="flex-1">
                  Analyser
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Results */}
        {step === 4 && analysisResult && (
          <div className="space-y-6">
            <div className="flex justify-between">
              <h2 className="text-2xl font-bold">Résultats</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowRawData(!showRawData)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Données brutes
                </Button>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Save className="w-4 h-4 mr-2" />
                      Sauvegarder
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Sauvegarder l'analyse</DialogTitle>
                    </DialogHeader>
                    <Input value={analysisName} onChange={(e) => setAnalysisName(e.target.value)} placeholder="Nom" />
                    <DialogFooter>
                      <Button onClick={handleSaveAnalysis}>Sauvegarder</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button onClick={resetAnalysis}>Nouvelle</Button>
              </div>
            </div>

            {showRawData && renderRawDataTable()}
            {renderFrequencyResults()}
            {renderAssociationResults()}
            {renderAdvancedResults()}
          </div>
        )}
      </main>
    </div>
  );
};

export default DataAnalysis;
