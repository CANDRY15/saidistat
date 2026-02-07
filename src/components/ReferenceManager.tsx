import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, Trash2, Copy, BookOpen, FileText, Globe, 
  Users, Calendar, BookMarked, Edit2, Check, X, Search, Loader2, Download, Upload
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { parseReferenceFile } from "@/lib/zoteroParser";

export type ReferenceType = 'article' | 'book' | 'chapter' | 'website' | 'thesis';
export type CitationFormat = 'apa' | 'vancouver';

export interface Reference {
  id: string;
  type: ReferenceType;
  authors: string[];
  year: string;
  title: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  publisher?: string;
  city?: string;
  url?: string;
  accessDate?: string;
  doi?: string;
  edition?: string;
  editors?: string[];
  bookTitle?: string;
  university?: string;
  pmid?: string;
}

interface ReferenceManagerProps {
  references: Reference[];
  onReferencesChange: (references: Reference[]) => void;
  citationFormat: CitationFormat;
  onFormatChange: (format: CitationFormat) => void;
}

// Format author name for APA (Last, F. M.)
const formatAuthorAPA = (author: string): string => {
  const parts = author.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => n[0] + '.').join(' ');
  return `${lastName}, ${initials}`;
};

// Format author name for Vancouver (Last FM)
const formatAuthorVancouver = (author: string): string => {
  const parts = author.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, -1).map(n => n[0]).join('');
  return `${lastName} ${initials}`;
};

// Format multiple authors
const formatAuthors = (authors: string[], format: CitationFormat, maxAuthors = 6): string => {
  if (authors.length === 0) return '';
  
  const formatted = authors.map(a => 
    format === 'apa' ? formatAuthorAPA(a) : formatAuthorVancouver(a)
  );
  
  if (format === 'apa') {
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return `${formatted[0]} & ${formatted[1]}`;
    if (formatted.length <= maxAuthors) {
      return `${formatted.slice(0, -1).join(', ')}, & ${formatted[formatted.length - 1]}`;
    }
    return `${formatted.slice(0, maxAuthors).join(', ')}, ... ${formatted[formatted.length - 1]}`;
  } else {
    // Vancouver
    if (formatted.length <= 6) return formatted.join(', ');
    return `${formatted.slice(0, 6).join(', ')}, et al.`;
  }
};

// Format reference in APA style
export const formatReferenceAPA = (ref: Reference): string => {
  const authors = formatAuthors(ref.authors, 'apa');
  
  switch (ref.type) {
    case 'article':
      let article = `${authors} (${ref.year}). ${ref.title}. `;
      if (ref.journal) article += `*${ref.journal}*`;
      if (ref.volume) article += `, *${ref.volume}*`;
      if (ref.issue) article += `(${ref.issue})`;
      if (ref.pages) article += `, ${ref.pages}`;
      article += '.';
      if (ref.doi) article += ` https://doi.org/${ref.doi}`;
      return article;
    
    case 'book':
      let book = `${authors} (${ref.year}). *${ref.title}*`;
      if (ref.edition) book += ` (${ref.edition} éd.)`;
      book += '.';
      if (ref.publisher) book += ` ${ref.publisher}.`;
      return book;
    
    case 'chapter':
      let chapter = `${authors} (${ref.year}). ${ref.title}. `;
      if (ref.editors) chapter += `Dans ${formatAuthors(ref.editors, 'apa')} (Éds.), `;
      if (ref.bookTitle) chapter += `*${ref.bookTitle}*`;
      if (ref.pages) chapter += ` (pp. ${ref.pages})`;
      chapter += '.';
      if (ref.publisher) chapter += ` ${ref.publisher}.`;
      return chapter;
    
    case 'website':
      let web = `${authors} (${ref.year}). ${ref.title}. `;
      if (ref.publisher) web += `${ref.publisher}. `;
      if (ref.url) web += `Consulté le ${ref.accessDate || 'non spécifié'}, à l'adresse ${ref.url}`;
      return web;
    
    case 'thesis':
      let thesis = `${authors} (${ref.year}). *${ref.title}* `;
      thesis += `[Thèse de doctorat${ref.university ? `, ${ref.university}` : ''}].`;
      return thesis;
    
    default:
      return `${authors} (${ref.year}). ${ref.title}.`;
  }
};

// Format reference in Vancouver style
export const formatReferenceVancouver = (ref: Reference, index: number): string => {
  const authors = formatAuthors(ref.authors, 'vancouver');
  
  switch (ref.type) {
    case 'article':
      let article = `${index}. ${authors}. ${ref.title}. `;
      if (ref.journal) article += `${ref.journal}. `;
      article += `${ref.year}`;
      if (ref.volume) article += `;${ref.volume}`;
      if (ref.issue) article += `(${ref.issue})`;
      if (ref.pages) article += `:${ref.pages}`;
      article += '.';
      return article;
    
    case 'book':
      let book = `${index}. ${authors}. ${ref.title}. `;
      if (ref.city) book += `${ref.city}: `;
      if (ref.publisher) book += `${ref.publisher}; `;
      book += `${ref.year}.`;
      return book;
    
    case 'chapter':
      let chapter = `${index}. ${authors}. ${ref.title}. `;
      chapter += `Dans: `;
      if (ref.editors) chapter += `${formatAuthors(ref.editors, 'vancouver')}, éditeurs. `;
      if (ref.bookTitle) chapter += `${ref.bookTitle}. `;
      if (ref.city) chapter += `${ref.city}: `;
      if (ref.publisher) chapter += `${ref.publisher}; `;
      chapter += `${ref.year}. `;
      if (ref.pages) chapter += `p. ${ref.pages}.`;
      return chapter;
    
    case 'website':
      let web = `${index}. ${authors}. ${ref.title} [Internet]. `;
      if (ref.publisher) web += `${ref.publisher}; `;
      web += `${ref.year} `;
      if (ref.accessDate) web += `[cité le ${ref.accessDate}]. `;
      if (ref.url) web += `Disponible sur: ${ref.url}`;
      return web;
    
    case 'thesis':
      let thesis = `${index}. ${authors}. ${ref.title} [thèse]. `;
      if (ref.city) thesis += `${ref.city}: `;
      if (ref.university) thesis += `${ref.university}; `;
      thesis += `${ref.year}.`;
      return thesis;
    
    default:
      return `${index}. ${authors}. ${ref.title}. ${ref.year}.`;
  }
};

export const formatReference = (ref: Reference, format: CitationFormat, index?: number): string => {
  return format === 'apa' 
    ? formatReferenceAPA(ref) 
    : formatReferenceVancouver(ref, index || 1);
};

// Format in-text citation
export const formatInTextCitation = (ref: Reference, format: CitationFormat, index?: number): string => {
  if (format === 'vancouver') {
    return `[${index || 1}]`;
  }
  
  // APA
  const firstAuthor = ref.authors[0]?.split(' ').pop() || 'Auteur';
  if (ref.authors.length === 1) {
    return `(${firstAuthor}, ${ref.year})`;
  } else if (ref.authors.length === 2) {
    const secondAuthor = ref.authors[1]?.split(' ').pop() || '';
    return `(${firstAuthor} & ${secondAuthor}, ${ref.year})`;
  } else {
    return `(${firstAuthor} et al., ${ref.year})`;
  }
};

const ReferenceManager = ({ 
  references, 
  onReferencesChange, 
  citationFormat, 
  onFormatChange 
}: ReferenceManagerProps) => {
  const [editingRef, setEditingRef] = useState<Reference | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const zoteroInputRef = useRef<HTMLInputElement>(null);
  
  // DOI/PubMed import states
  const [doiInput, setDoiInput] = useState('');
  const [pubmedQuery, setPubmedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Reference[]>([]);
  const [doiPreview, setDoiPreview] = useState<Reference | null>(null);
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set());
  
  const [newRef, setNewRef] = useState<Partial<Reference>>({
    type: 'article',
    authors: [''],
    year: new Date().getFullYear().toString(),
    title: ''
  });

  const typeIcons: Record<ReferenceType, React.ReactNode> = {
    article: <FileText className="w-4 h-4" />,
    book: <BookOpen className="w-4 h-4" />,
    chapter: <BookMarked className="w-4 h-4" />,
    website: <Globe className="w-4 h-4" />,
    thesis: <Users className="w-4 h-4" />,
  };

  const typeLabels: Record<ReferenceType, string> = {
    article: 'Article de journal',
    book: 'Livre',
    chapter: 'Chapitre de livre',
    website: 'Site web',
    thesis: 'Thèse',
  };

  // Fetch reference from DOI with preview
  const fetchFromDOI = async (addDirectly = false) => {
    if (!doiInput.trim()) {
      toast.error("Veuillez entrer un DOI");
      return;
    }

    setIsSearching(true);
    setDoiPreview(null);
    try {
      // Support multiple DOIs separated by newlines or commas
      const dois = doiInput.split(/[\n,]/).map(d => d.trim()).filter(Boolean);
      
      for (const doi of dois) {
        const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
          body: { action: 'fetch_doi', doi: doi }
        });

        if (error) throw error;
        
        if (data.error) {
          toast.error(`DOI ${doi}: ${data.error}`);
          continue;
        }

        if (data.reference) {
          if (addDirectly || dois.length > 1) {
            // Check for duplicates
            if (!references.some(r => r.doi === data.reference.doi)) {
              onReferencesChange([...references, data.reference]);
              toast.success(`Référence importée: ${data.reference.title?.substring(0, 50)}...`);
            } else {
              toast.info(`DOI ${doi} déjà dans la liste`);
            }
          } else {
            // Show preview for single DOI
            setDoiPreview(data.reference);
          }
        }
      }
      
      if (addDirectly || dois.length > 1) {
        setDoiInput('');
      }
    } catch (error: any) {
      console.error('DOI fetch error:', error);
      toast.error("Erreur lors de l'import du DOI");
    } finally {
      setIsSearching(false);
    }
  };

  // Add DOI preview to references
  const addDoiPreview = () => {
    if (doiPreview) {
      if (!references.some(r => r.doi === doiPreview.doi)) {
        onReferencesChange([...references, doiPreview]);
        toast.success("Référence ajoutée");
      } else {
        toast.info("Cette référence est déjà dans la liste");
      }
      setDoiPreview(null);
      setDoiInput('');
    }
  };

  // Search PubMed
  const searchPubMed = async () => {
    if (!pubmedQuery.trim()) {
      toast.error("Veuillez entrer une recherche");
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('thesis-writing-ai', {
        body: { action: 'search_pubmed', pubmedQuery: pubmedQuery.trim() }
      });

      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.references && data.references.length > 0) {
        setSearchResults(data.references);
        toast.success(`${data.references.length} références trouvées`);
      } else {
        toast.info("Aucune référence trouvée");
      }
    } catch (error: any) {
      console.error('PubMed search error:', error);
      toast.error("Erreur lors de la recherche PubMed");
    } finally {
      setIsSearching(false);
    }
  };

  const addSearchResult = (ref: Reference) => {
    // Check if already added
    if (references.some(r => r.pmid === ref.pmid || (ref.doi && r.doi === ref.doi))) {
      toast.info("Cette référence est déjà dans votre liste");
      return;
    }
    onReferencesChange([...references, { ...ref, id: crypto.randomUUID() }]);
    toast.success("Référence ajoutée");
  };

  const addReference = () => {
    if (!newRef.title?.trim() || !newRef.authors?.[0]?.trim()) {
      toast.error("Veuillez remplir au moins le titre et un auteur");
      return;
    }

    const ref: Reference = {
      id: crypto.randomUUID(),
      type: newRef.type || 'article',
      authors: newRef.authors?.filter(a => a.trim()) || [],
      year: newRef.year || new Date().getFullYear().toString(),
      title: newRef.title || '',
      journal: newRef.journal,
      volume: newRef.volume,
      issue: newRef.issue,
      pages: newRef.pages,
      publisher: newRef.publisher,
      city: newRef.city,
      url: newRef.url,
      accessDate: newRef.accessDate,
      doi: newRef.doi,
      edition: newRef.edition,
      editors: newRef.editors?.filter(e => e.trim()),
      bookTitle: newRef.bookTitle,
      university: newRef.university,
    };

    onReferencesChange([...references, ref]);
    setNewRef({
      type: 'article',
      authors: [''],
      year: new Date().getFullYear().toString(),
      title: ''
    });
    setShowForm(false);
    toast.success("Référence ajoutée");
  };

  const updateReference = (updatedRef: Reference) => {
    onReferencesChange(references.map(r => r.id === updatedRef.id ? updatedRef : r));
    setEditingRef(null);
    toast.success("Référence modifiée");
  };

  const deleteReference = (id: string) => {
    onReferencesChange(references.filter(r => r.id !== id));
    toast.success("Référence supprimée");
  };

  const copyFormattedReferences = () => {
    const formatted = references
      .map((ref, i) => formatReference(ref, citationFormat, i + 1))
      .join('\n\n');
    navigator.clipboard.writeText(formatted);
    toast.success("Références copiées");
  };

  const addAuthor = () => {
    setNewRef(prev => ({
      ...prev,
      authors: [...(prev.authors || []), '']
    }));
  };

  const updateAuthor = (index: number, value: string) => {
    setNewRef(prev => ({
      ...prev,
      authors: prev.authors?.map((a, i) => i === index ? value : a) || []
    }));
  };

  const removeAuthor = (index: number) => {
    setNewRef(prev => ({
      ...prev,
      authors: prev.authors?.filter((_, i) => i !== index) || []
    }));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookMarked className="w-5 h-5" />
            Références bibliographiques
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={citationFormat} onValueChange={(v) => onFormatChange(v as CitationFormat)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apa">Format APA</SelectItem>
                <SelectItem value="vancouver">Vancouver</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="secondary">{references.length} réf.</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Liste</TabsTrigger>
            <TabsTrigger value="import">Import DOI</TabsTrigger>
            <TabsTrigger value="pubmed">PubMed</TabsTrigger>
            <TabsTrigger value="formatted">Aperçu</TabsTrigger>
          </TabsList>

          {/* Import DOI Tab */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-3">
              <Label>Importer depuis DOI</Label>
              <p className="text-sm text-muted-foreground">
                Entrez un ou plusieurs DOI (séparés par des virgules ou retours à la ligne) pour importer automatiquement
              </p>
              <div className="flex gap-2">
                <Input
                  value={doiInput}
                  onChange={(e) => setDoiInput(e.target.value)}
                  placeholder="10.1016/j.xxx.2023.xxx ou https://doi.org/..."
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && fetchFromDOI(false)}
                />
                <Button onClick={() => fetchFromDOI(false)} disabled={isSearching} title="Aperçu">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
                <Button onClick={() => fetchFromDOI(true)} disabled={isSearching} variant="secondary" title="Ajouter directement">
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* DOI Preview */}
            {doiPreview && (
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{doiPreview.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {doiPreview.authors?.join(', ')} ({doiPreview.year})
                    </p>
                    {doiPreview.journal && (
                      <p className="text-sm italic text-muted-foreground">{doiPreview.journal}</p>
                    )}
                    {doiPreview.doi && (
                      <p className="text-xs text-muted-foreground">DOI: {doiPreview.doi}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addDoiPreview} className="flex-1">
                    <Plus className="w-4 h-4 mr-2" /> Ajouter à la bibliographie
                  </Button>
                  <Button variant="outline" onClick={() => setDoiPreview(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* PubMed Search Tab */}
          <TabsContent value="pubmed" className="space-y-4">
            <div className="space-y-3">
              <Label>Rechercher sur PubMed</Label>
              <p className="text-sm text-muted-foreground">
                Recherchez des articles sur PubMed et sélectionnez ceux à importer
              </p>
              <div className="flex gap-2">
                <Input
                  value={pubmedQuery}
                  onChange={(e) => setPubmedQuery(e.target.value)}
                  placeholder="ex: preeclampsia africa 2023"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && searchPubMed()}
                />
                <Button onClick={searchPubMed} disabled={isSearching}>
                  {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    {searchResults.length} résultat(s) - {selectedResults.size} sélectionné(s)
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        if (selectedResults.size === searchResults.length) {
                          setSelectedResults(new Set());
                        } else {
                          setSelectedResults(new Set(searchResults.map(r => r.id)));
                        }
                      }}
                    >
                      {selectedResults.size === searchResults.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                    </Button>
                    <Button 
                      size="sm"
                      disabled={selectedResults.size === 0}
                      onClick={() => {
                        const toAdd = searchResults.filter(r => selectedResults.has(r.id));
                        let addedCount = 0;
                        const newRefs = [...references];
                        toAdd.forEach(ref => {
                          if (!newRefs.some(r => r.pmid === ref.pmid || (ref.doi && r.doi === ref.doi))) {
                            newRefs.push({ ...ref, id: crypto.randomUUID() });
                            addedCount++;
                          }
                        });
                        onReferencesChange(newRefs);
                        toast.success(`${addedCount} référence(s) ajoutée(s)`);
                        setSelectedResults(new Set());
                        setSearchResults([]);
                        setPubmedQuery('');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter ({selectedResults.size})
                    </Button>
                  </div>
                </div>
                <ScrollArea className="h-[300px] border rounded-lg p-3">
                  <div className="space-y-2">
                    {searchResults.map((ref, index) => {
                      const isSelected = selectedResults.has(ref.id);
                      const isAlreadyAdded = references.some(r => r.pmid === ref.pmid || (ref.doi && r.doi === ref.doi));
                      
                      return (
                        <div 
                          key={ref.id || index} 
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            isAlreadyAdded 
                              ? 'bg-muted/20 opacity-50' 
                              : isSelected 
                                ? 'bg-primary/10 border-primary' 
                                : 'bg-muted/30 hover:bg-muted/50'
                          }`}
                          onClick={() => {
                            if (isAlreadyAdded) return;
                            const newSelected = new Set(selectedResults);
                            if (isSelected) {
                              newSelected.delete(ref.id);
                            } else {
                              newSelected.add(ref.id);
                            }
                            setSelectedResults(newSelected);
                          }}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm line-clamp-2">{ref.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {ref.authors?.slice(0, 3).join(', ')}{ref.authors && ref.authors.length > 3 ? ' et al.' : ''} ({ref.year})
                              </p>
                              {ref.journal && (
                                <p className="text-xs text-muted-foreground italic">{ref.journal}</p>
                              )}
                              {ref.pmid && (
                                <p className="text-xs text-muted-foreground">PMID: {ref.pmid}</p>
                              )}
                            </div>
                            {isAlreadyAdded ? (
                              <Badge variant="secondary" className="text-xs">Déjà ajouté</Badge>
                            ) : (
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                              }`}>
                                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="list" className="space-y-3">
            {!showForm ? (
              <Button onClick={() => setShowForm(true)} className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" /> Ajouter manuellement
              </Button>
            ) : (
              <Card className="p-4 space-y-4 bg-muted/30">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Nouvelle référence</Label>
                  <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type de source</Label>
                    <Select 
                      value={newRef.type} 
                      onValueChange={(v) => setNewRef(prev => ({ ...prev, type: v as ReferenceType }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              {typeIcons[key as ReferenceType]} {label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Année</Label>
                    <Input
                      value={newRef.year || ''}
                      onChange={(e) => setNewRef(prev => ({ ...prev, year: e.target.value }))}
                      placeholder="2024"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Auteurs</Label>
                  {newRef.authors?.map((author, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        value={author}
                        onChange={(e) => updateAuthor(i, e.target.value)}
                        placeholder="Prénom Nom"
                      />
                      {newRef.authors && newRef.authors.length > 1 && (
                        <Button size="icon" variant="ghost" onClick={() => removeAuthor(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" onClick={addAuthor}>
                    <Plus className="w-4 h-4 mr-1" /> Ajouter un auteur
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Titre</Label>
                  <Input
                    value={newRef.title || ''}
                    onChange={(e) => setNewRef(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Titre de l'article ou du livre"
                  />
                </div>

                {(newRef.type === 'article') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Journal</Label>
                      <Input
                        value={newRef.journal || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, journal: e.target.value }))}
                        placeholder="Nom du journal"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>DOI</Label>
                      <Input
                        value={newRef.doi || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, doi: e.target.value }))}
                        placeholder="10.xxxx/xxxxx"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Volume</Label>
                      <Input
                        value={newRef.volume || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, volume: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro</Label>
                      <Input
                        value={newRef.issue || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, issue: e.target.value }))}
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>Pages</Label>
                      <Input
                        value={newRef.pages || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, pages: e.target.value }))}
                        placeholder="12-24"
                      />
                    </div>
                  </div>
                )}

                {(newRef.type === 'book' || newRef.type === 'thesis') && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{newRef.type === 'thesis' ? 'Université' : 'Éditeur'}</Label>
                      <Input
                        value={newRef.type === 'thesis' ? (newRef.university || '') : (newRef.publisher || '')}
                        onChange={(e) => setNewRef(prev => ({ 
                          ...prev, 
                          [newRef.type === 'thesis' ? 'university' : 'publisher']: e.target.value 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input
                        value={newRef.city || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, city: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {newRef.type === 'website' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>URL</Label>
                      <Input
                        value={newRef.url || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, url: e.target.value }))}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date d'accès</Label>
                      <Input
                        value={newRef.accessDate || ''}
                        onChange={(e) => setNewRef(prev => ({ ...prev, accessDate: e.target.value }))}
                        placeholder="15 janvier 2024"
                      />
                    </div>
                  </div>
                )}

                <Button onClick={addReference} className="w-full">
                  <Check className="w-4 h-4 mr-2" /> Ajouter la référence
                </Button>
              </Card>
            )}

            {/* Reference List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {references.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune référence ajoutée
                  </p>
                ) : (
                  references.map((ref, index) => (
                    <div key={ref.id} className="flex items-start gap-2 p-3 border rounded-lg hover:bg-muted/50">
                      <Badge variant="outline" className="shrink-0">
                        {citationFormat === 'vancouver' ? index + 1 : typeIcons[ref.type]}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{ref.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ref.authors.slice(0, 2).join(', ')}{ref.authors.length > 2 ? ' et al.' : ''} ({ref.year})
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="icon" variant="ghost" onClick={() => setEditingRef(ref)}>
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteReference(ref.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="formatted" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={copyFormattedReferences}>
                <Copy className="w-4 h-4 mr-2" /> Copier tout
              </Button>
            </div>
            <ScrollArea className="h-[350px] border rounded-lg p-4">
              <div className="space-y-3">
                {references.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Aucune référence à afficher
                  </p>
                ) : (
                  references.map((ref, i) => (
                    <div key={ref.id} className="text-sm leading-relaxed pb-2 border-b last:border-0">
                      {formatReference(ref, citationFormat, i + 1)}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ReferenceManager;
