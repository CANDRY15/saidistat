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
  Plus, Minus, Trash2, Rows, Columns
} from 'lucide-react';
import { useEffect, useRef, useCallback } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

const RichTextEditor = ({ content, onChange, className }: RichTextEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const editor = useEditor({
    extensions: [
      StarterKit,
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
        class: 'prose prose-sm max-w-none dark:prose-invert focus:outline-none min-h-[200px] p-4',
        style: 'font-family: "Times New Roman", Times, serif; line-height: 1.5;',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const insertTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    }
  }, [editor]);

  const addColumnBefore = useCallback(() => {
    if (editor) {
      editor.chain().focus().addColumnBefore().run();
    }
  }, [editor]);

  const addColumnAfter = useCallback(() => {
    if (editor) {
      editor.chain().focus().addColumnAfter().run();
    }
  }, [editor]);

  const deleteColumn = useCallback(() => {
    if (editor) {
      editor.chain().focus().deleteColumn().run();
    }
  }, [editor]);

  const addRowBefore = useCallback(() => {
    if (editor) {
      editor.chain().focus().addRowBefore().run();
    }
  }, [editor]);

  const addRowAfter = useCallback(() => {
    if (editor) {
      editor.chain().focus().addRowAfter().run();
    }
  }, [editor]);

  const deleteRow = useCallback(() => {
    if (editor) {
      editor.chain().focus().deleteRow().run();
    }
  }, [editor]);

  const deleteTable = useCallback(() => {
    if (editor) {
      editor.chain().focus().deleteTable().run();
    }
  }, [editor]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner une image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string' && editor) {
        editor.chain().focus().setImage({ src: result }).run();
        toast.success("Image insérée");
      }
    };
    reader.readAsDataURL(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    const url = window.prompt("Entrez l'URL de l'image:");
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50">
        {/* Text formatting */}
        <Button
          type="button"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Souligné"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Alignment */}
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          title="Aligner à gauche"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          title="Centrer"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          title="Aligner à droite"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive({ textAlign: 'justify' }) ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          title="Justifier"
        >
          <AlignJustify className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Lists */}
        <Button
          type="button"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Table dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant={editor.isActive('table') ? 'secondary' : 'ghost'}
              size="sm"
              title="Tableau"
            >
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
            <Button
              type="button"
              variant="ghost"
              size="sm"
              title="Image"
            >
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
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
        
        <div className="w-px h-6 bg-border mx-1" />
        
        {/* Undo/Redo */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Annuler"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Rétablir"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Editor */}
      <EditorContent editor={editor} className="bg-background" />
      
      {/* Styles for tables and images */}
      <style>{`
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
          left: 0;
          right: 0;
          top: 0;
          bottom: 0;
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
      `}</style>
    </div>
  );
};

export default RichTextEditor;
