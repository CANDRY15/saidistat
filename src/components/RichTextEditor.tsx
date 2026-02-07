import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Underline } from '@tiptap/extension-underline';
import { Button } from '@/components/ui/button';
import { 
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Table as TableIcon, Image as ImageIcon, 
  Plus, Minus, Trash2, Rows, Columns, Type
} from 'lucide-react';
import { useEffect, useRef, useCallback, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import FigureManager, { Figure } from './FigureManager';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
  figures?: Figure[];
  onFiguresChange?: (figures: Figure[]) => void;
  pageView?: boolean;
}

const RichTextEditor = ({ content, onChange, className, figures = [], onFiguresChange, pageView = false }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localFigures, setLocalFigures] = useState<Figure[]>(figures);

  useEffect(() => {
    setLocalFigures(figures);
  }, [figures]);

  const handleFiguresChange = useCallback((newFigures: Figure[]) => {
    setLocalFigures(newFigures);
    onFiguresChange?.(newFigures);
  }, [onFiguresChange]);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'thesis-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({
        HTMLAttributes: {
          class: 'thesis-image',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: pageView 
          ? 'prose prose-sm max-w-none dark:prose-invert focus:outline-none thesis-page-content'
          : 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[200px] p-4',
        style: 'font-family: "Times New Roman", Times, serif; line-height: 1.5;',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Get current heading level for the dropdown
  const getCurrentHeadingLevel = useCallback((): string => {
    if (!editor) return 'paragraph';
    if (editor.isActive('heading', { level: 1 })) return '1';
    if (editor.isActive('heading', { level: 2 })) return '2';
    if (editor.isActive('heading', { level: 3 })) return '3';
    if (editor.isActive('heading', { level: 4 })) return '4';
    return 'paragraph';
  }, [editor]);

  const setHeadingLevel = useCallback((value: string) => {
    if (!editor) return;
    if (value === 'paragraph') {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = parseInt(value) as 1 | 2 | 3 | 4;
      editor.chain().focus().toggleHeading({ level }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    if (editor) editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  const addColumnBefore = useCallback(() => { editor?.chain().focus().addColumnBefore().run(); }, [editor]);
  const addColumnAfter = useCallback(() => { editor?.chain().focus().addColumnAfter().run(); }, [editor]);
  const deleteColumn = useCallback(() => { editor?.chain().focus().deleteColumn().run(); }, [editor]);
  const addRowBefore = useCallback(() => { editor?.chain().focus().addRowBefore().run(); }, [editor]);
  const addRowAfter = useCallback(() => { editor?.chain().focus().addRowAfter().run(); }, [editor]);
  const deleteRow = useCallback(() => { editor?.chain().focus().deleteRow().run(); }, [editor]);
  const deleteTable = useCallback(() => { editor?.chain().focus().deleteTable().run(); }, [editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error("Veuillez sélectionner une image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("L'image ne doit pas dépasser 5MB"); return; }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string' && editor) {
        editor.chain().focus().setImage({ src: result }).run();
        toast.success("Image insérée");
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    const url = window.prompt("Entrez l'URL de l'image:");
    if (url && editor) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleInsertFigure = useCallback((figure: Figure) => {
    if (!editor) return;
    const figureHtml = `
      <div class="numbered-figure" data-figure-id="${figure.id}">
        <img src="${figure.content}" alt="${figure.caption}" class="thesis-figure-img" />
        <p class="figure-caption">
          <strong>Figure ${figure.number}:</strong> ${figure.caption}
          ${figure.source ? `<br/><em>Source: ${figure.source}</em>` : ''}
        </p>
      </div>
    `;
    editor.chain().focus().insertContent(figureHtml).run();
  }, [editor]);

  const handleInsertTable = useCallback((figure: Figure) => {
    if (!editor) return;
    const tableHtml = `
      <div class="numbered-table-container" data-table-id="${figure.id}">
        <p class="table-caption">
          <strong>Tableau ${figure.number}:</strong> ${figure.caption}
        </p>
        ${figure.content}
        ${figure.source ? `<p class="table-source"><em>Source: ${figure.source}</em></p>` : ''}
      </div>
    `;
    editor.chain().focus().insertContent(tableHtml).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50 sticky top-0 z-10">
        {/* Heading level selector */}
        <Select value={getCurrentHeadingLevel()} onValueChange={setHeadingLevel}>
          <SelectTrigger className="w-[130px] h-8 text-xs">
            <SelectValue placeholder="Style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="paragraph">
              <span className="text-sm">Normal</span>
            </SelectItem>
            <SelectItem value="1">
              <span className="text-lg font-bold">Titre 1</span>
            </SelectItem>
            <SelectItem value="2">
              <span className="text-base font-bold">Titre 2</span>
            </SelectItem>
            <SelectItem value="3">
              <span className="text-sm font-bold">Titre 3</span>
            </SelectItem>
            <SelectItem value="4">
              <span className="text-xs font-bold">Titre 4</span>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Text formatting */}
        <Button type="button" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()} title="Gras (Ctrl+B)">
          <Bold className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()} title="Italique (Ctrl+I)">
          <Italic className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive('underline') ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()} title="Souligné (Ctrl+U)">
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Alignment */}
        <Button type="button" variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Aligner à gauche">
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Centrer">
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Aligner à droite">
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()} title="Justifier">
          <AlignJustify className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Lists */}
        <Button type="button" variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()} title="Liste à puces">
          <List className="w-4 h-4" />
        </Button>
        <Button type="button" variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Liste numérotée">
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Table dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant={editor.isActive('table') ? 'secondary' : 'ghost'} size="sm" title="Tableau">
              <TableIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={insertTable}>
              <Plus className="w-4 h-4 mr-2" /> Insérer un tableau
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={addColumnBefore} disabled={!editor.isActive('table')}>
              <Columns className="w-4 h-4 mr-2" /> Colonne avant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addColumnAfter} disabled={!editor.isActive('table')}>
              <Columns className="w-4 h-4 mr-2" /> Colonne après
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteColumn} disabled={!editor.isActive('table')}>
              <Minus className="w-4 h-4 mr-2" /> Supprimer colonne
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={addRowBefore} disabled={!editor.isActive('table')}>
              <Rows className="w-4 h-4 mr-2" /> Ligne avant
            </DropdownMenuItem>
            <DropdownMenuItem onClick={addRowAfter} disabled={!editor.isActive('table')}>
              <Rows className="w-4 h-4 mr-2" /> Ligne après
            </DropdownMenuItem>
            <DropdownMenuItem onClick={deleteRow} disabled={!editor.isActive('table')}>
              <Minus className="w-4 h-4 mr-2" /> Supprimer ligne
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={deleteTable} disabled={!editor.isActive('table')} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer tableau
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Image dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" title="Image">
              <ImageIcon className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Plus className="w-4 h-4 mr-2" /> Téléverser une image
            </DropdownMenuItem>
            <DropdownMenuItem onClick={insertImageFromUrl}>
              <ImageIcon className="w-4 h-4 mr-2" /> Depuis URL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
        
        <div className="w-px h-6 bg-border mx-1" />

        {/* Numbered Figures and Tables */}
        {onFiguresChange && (
          <>
            <FigureManager
              figures={localFigures}
              onFiguresChange={handleFiguresChange}
              onInsertFigure={handleInsertFigure}
              onInsertTable={handleInsertTable}
            />
            <div className="w-px h-6 bg-border mx-1" />
          </>
        )}
        
        {/* Undo/Redo */}
        <Button type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()} title="Annuler (Ctrl+Z)">
          <Undo className="w-4 h-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()} title="Rétablir (Ctrl+Y)">
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Editor with optional A4 page view */}
      {pageView ? (
        <div className="thesis-page-wrapper bg-muted/30 overflow-auto" style={{ maxHeight: '70vh' }}>
          <div className="thesis-page">
            <EditorContent editor={editor} />
          </div>
        </div>
      ) : (
        <EditorContent editor={editor} className="bg-background" />
      )}
      
      {/* Styles */}
      <style>{`
        /* A4 Page View */
        .thesis-page-wrapper {
          padding: 24px;
          display: flex;
          justify-content: center;
        }
        .thesis-page {
          background: white;
          width: 210mm;
          min-height: 297mm;
          padding: 25mm 25mm 30mm 30mm;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
          border-radius: 2px;
        }
        .dark .thesis-page {
          background: hsl(210, 35%, 15%);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .thesis-page-content {
          font-family: "Times New Roman", Times, serif;
          line-height: 1.5;
          font-size: 12pt;
          min-height: 240mm;
        }
        .thesis-page-content h1 {
          font-size: 18pt;
          font-weight: bold;
          margin: 24pt 0 12pt 0;
          text-transform: uppercase;
        }
        .thesis-page-content h2 {
          font-size: 16pt;
          font-weight: bold;
          margin: 20pt 0 10pt 0;
        }
        .thesis-page-content h3 {
          font-size: 14pt;
          font-weight: bold;
          margin: 16pt 0 8pt 0;
        }
        .thesis-page-content h4 {
          font-size: 12pt;
          font-weight: bold;
          font-style: italic;
          margin: 12pt 0 6pt 0;
        }
        .thesis-page-content p {
          text-align: justify;
          text-indent: 0;
          margin-bottom: 6pt;
        }
        
        /* Table styles */
        .thesis-table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .thesis-table td,
        .thesis-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          min-width: 50px;
        }
        .thesis-table th {
          background-color: hsl(var(--muted));
          font-weight: bold;
          text-align: left;
        }
        .thesis-image {
          max-width: 100%;
          height: auto;
          margin: 1rem auto;
          display: block;
        }
        .ProseMirror table {
          border-collapse: collapse;
          margin: 0;
          overflow: hidden;
          table-layout: fixed;
          width: 100%;
        }
        .ProseMirror td,
        .ProseMirror th {
          border: 2px solid hsl(var(--border));
          box-sizing: border-box;
          min-width: 1em;
          padding: 6px 8px;
          position: relative;
          vertical-align: top;
        }
        .ProseMirror th {
          background-color: hsl(var(--muted));
          font-weight: bold;
        }
        .ProseMirror .selectedCell:after {
          background: hsl(var(--primary) / 0.1);
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          pointer-events: none;
          position: absolute;
          z-index: 2;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          cursor: pointer;
        }
        .ProseMirror img.ProseMirror-selectednode {
          outline: 3px solid hsl(var(--primary));
        }
        
        /* Numbered figures */
        .numbered-figure {
          margin: 1.5rem 0;
          text-align: center;
          page-break-inside: avoid;
        }
        .thesis-figure-img {
          max-width: 80%;
          height: auto;
          margin: 0 auto;
          display: block;
          border: 1px solid hsl(var(--border));
        }
        .figure-caption {
          margin-top: 0.5rem;
          font-size: 0.9em;
          text-align: center;
        }
        .figure-caption strong { font-weight: bold; }
        .figure-caption em { font-size: 0.85em; color: hsl(var(--muted-foreground)); }
        
        /* Numbered tables */
        .numbered-table-container {
          margin: 1.5rem 0;
          page-break-inside: avoid;
        }
        .table-caption {
          margin-bottom: 0.5rem;
          font-size: 0.9em;
          text-align: center;
        }
        .table-caption strong { font-weight: bold; }
        .numbered-table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 auto;
        }
        .numbered-table td,
        .numbered-table th {
          border: 1px solid hsl(var(--border));
          padding: 0.5rem;
          text-align: left;
        }
        .numbered-table th {
          background-color: hsl(var(--muted));
          font-weight: bold;
        }
        .table-source {
          margin-top: 0.25rem;
          font-size: 0.85em;
          text-align: left;
          color: hsl(var(--muted-foreground));
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
