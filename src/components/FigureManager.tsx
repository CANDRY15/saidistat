import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Image, Table2, Plus, List } from 'lucide-react';
import { toast } from 'sonner';

export interface Figure {
  id: string;
  type: 'figure' | 'table';
  number: number;
  caption: string;
  source?: string;
  content?: string; // For tables: HTML content, for figures: image URL/base64
}

interface FigureManagerProps {
  figures: Figure[];
  onFiguresChange: (figures: Figure[]) => void;
  onInsertFigure: (figure: Figure) => void;
  onInsertTable: (figure: Figure) => void;
}

const FigureManager = ({ figures, onFiguresChange, onInsertFigure, onInsertTable }: FigureManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isListDialogOpen, setIsListDialogOpen] = useState(false);
  const [newType, setNewType] = useState<'figure' | 'table'>('figure');
  const [newCaption, setNewCaption] = useState('');
  const [newSource, setNewSource] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const getNextNumber = useCallback((type: 'figure' | 'table') => {
    const typeItems = figures.filter(f => f.type === type);
    return typeItems.length + 1;
  }, [figures]);

  const handleAddFigure = useCallback(async () => {
    if (!newCaption.trim()) {
      toast.error('Veuillez entrer une légende');
      return;
    }

    const number = getNextNumber(newType);
    const id = `${newType}-${Date.now()}`;

    if (newType === 'figure') {
      let content = imageUrl;
      
      if (imageFile) {
        // Convert file to base64
        const reader = new FileReader();
        content = await new Promise((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(imageFile);
        });
      }

      if (!content) {
        toast.error('Veuillez sélectionner une image ou entrer une URL');
        return;
      }

      const newFigure: Figure = {
        id,
        type: 'figure',
        number,
        caption: newCaption,
        source: newSource,
        content,
      };

      onFiguresChange([...figures, newFigure]);
      onInsertFigure(newFigure);
      toast.success(`Figure ${number} ajoutée`);
    } else {
      // Generate empty table HTML
      let tableHtml = '<table class="thesis-table numbered-table">';
      tableHtml += '<thead><tr>';
      for (let c = 0; c < tableCols; c++) {
        tableHtml += `<th>Colonne ${c + 1}</th>`;
      }
      tableHtml += '</tr></thead><tbody>';
      for (let r = 0; r < tableRows - 1; r++) {
        tableHtml += '<tr>';
        for (let c = 0; c < tableCols; c++) {
          tableHtml += '<td></td>';
        }
        tableHtml += '</tr>';
      }
      tableHtml += '</tbody></table>';

      const newTable: Figure = {
        id,
        type: 'table',
        number,
        caption: newCaption,
        source: newSource,
        content: tableHtml,
      };

      onFiguresChange([...figures, newTable]);
      onInsertTable(newTable);
      toast.success(`Tableau ${number} ajouté`);
    }

    // Reset form
    setNewCaption('');
    setNewSource('');
    setImageFile(null);
    setImageUrl('');
    setTableRows(3);
    setTableCols(3);
    setIsAddDialogOpen(false);
  }, [newType, newCaption, newSource, imageFile, imageUrl, tableRows, tableCols, figures, getNextNumber, onFiguresChange, onInsertFigure, onInsertTable]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 5MB");
        return;
      }
      setImageFile(file);
      setImageUrl('');
    }
  };

  const handleRemoveFigure = (id: string) => {
    const updatedFigures = figures.filter(f => f.id !== id);
    // Renumber
    let figNum = 1;
    let tabNum = 1;
    const renumbered = updatedFigures.map(f => ({
      ...f,
      number: f.type === 'figure' ? figNum++ : tabNum++
    }));
    onFiguresChange(renumbered);
    toast.success('Élément supprimé');
  };

  const figuresList = figures.filter(f => f.type === 'figure');
  const tablesList = figures.filter(f => f.type === 'table');

  return (
    <div className="flex items-center gap-2">
      {/* Add new figure/table */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Figure/Tableau
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un élément numéroté</DialogTitle>
            <DialogDescription>
              Insérez une figure ou un tableau avec légende automatique
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type d'élément</Label>
              <Select value={newType} onValueChange={(v: 'figure' | 'table') => setNewType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="figure">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Figure (Image)
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4" />
                      Tableau
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Légende *</Label>
              <Textarea
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder={newType === 'figure' 
                  ? "Ex: Répartition des patients selon l'âge" 
                  : "Ex: Caractéristiques sociodémographiques de l'échantillon"}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Sera affiché comme: {newType === 'figure' ? 'Figure' : 'Tableau'} {getNextNumber(newType)}: [votre légende]
              </p>
            </div>

            <div className="space-y-2">
              <Label>Source (optionnel)</Label>
              <Input
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="Ex: Données de l'enquête, 2024"
              />
            </div>

            {newType === 'figure' ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {imageFile && (
                    <p className="text-sm text-muted-foreground">
                      Fichier sélectionné: {imageFile.name}
                    </p>
                  )}
                </div>
                <div className="text-center text-sm text-muted-foreground">ou</div>
                <div className="space-y-2">
                  <Label>URL de l'image</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setImageFile(null);
                    }}
                    placeholder="https://..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre de lignes</Label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={tableRows}
                    onChange={(e) => setTableRows(parseInt(e.target.value) || 3)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nombre de colonnes</Label>
                  <Input
                    type="number"
                    min={2}
                    max={10}
                    value={tableCols}
                    onChange={(e) => setTableCols(parseInt(e.target.value) || 3)}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddFigure}>
              Insérer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View list of figures/tables */}
      <Dialog open={isListDialogOpen} onOpenChange={setIsListDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <List className="w-4 h-4" />
            Liste ({figures.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Liste des figures et tableaux</DialogTitle>
            <DialogDescription>
              Gérez les éléments numérotés de votre document
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto">
            {figures.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun élément numéroté pour le moment
              </p>
            ) : (
              <>
                {figuresList.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Figures ({figuresList.length})
                    </h4>
                    <div className="space-y-2">
                      {figuresList.map((fig) => (
                        <div key={fig.id} className="flex items-start justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Figure {fig.number}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{fig.caption}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFigure(fig.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Supprimer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tablesList.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Table2 className="w-4 h-4" />
                      Tableaux ({tablesList.length})
                    </h4>
                    <div className="space-y-2">
                      {tablesList.map((tab) => (
                        <div key={tab.id} className="flex items-start justify-between p-2 rounded-lg bg-muted/50">
                          <div className="flex-1">
                            <p className="font-medium text-sm">Tableau {tab.number}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2">{tab.caption}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFigure(tab.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            Supprimer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FigureManager;
