import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import { Reference, CitationFormat, formatReference } from '@/components/ReferenceManager';
import { Figure } from '@/components/FigureManager';

interface Section {
  id: string;
  title: string;
  content: string;
  references?: string[];
}

// Convert HTML to plain text with basic formatting preserved
const htmlToText = (html: string): string => {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
};

// Extract table data from HTML table
const extractTableData = (tableHtml: string): string[][] => {
  const div = document.createElement('div');
  div.innerHTML = tableHtml;
  const table = div.querySelector('table');
  if (!table) return [];
  
  const rows: string[][] = [];
  table.querySelectorAll('tr').forEach(tr => {
    const cells: string[] = [];
    tr.querySelectorAll('td, th').forEach(cell => {
      cells.push(cell.textContent || '');
    });
    if (cells.length > 0) rows.push(cells);
  });
  return rows;
};

// Create a Word table from data
const createWordTable = (data: string[][], hasHeader: boolean = true): Table => {
  const rows = data.map((rowData, rowIndex) => {
    const cells = rowData.map(cellText => {
      return new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cellText,
                font: 'Times New Roman',
                size: 22,
                bold: hasHeader && rowIndex === 0,
              }),
            ],
          }),
        ],
        shading: hasHeader && rowIndex === 0 ? { fill: 'E8E8E8' } : undefined,
      });
    });
    return new TableRow({ children: cells });
  });

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
};

// Create paragraphs for numbered figures and tables
const createFigureParagraphs = (figures: Figure[]): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  if (figures.length === 0) return paragraphs;

  // Title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LISTE DES FIGURES ET TABLEAUX',
          bold: true,
          font: 'Times New Roman',
          size: 28,
        }),
      ],
      spacing: { before: 480, after: 240, line: 360 },
      alignment: AlignmentType.LEFT,
    })
  );

  // Figures list
  const figuresList = figures.filter(f => f.type === 'figure');
  if (figuresList.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Figures',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 120, line: 360 },
      })
    );
    
    figuresList.forEach(fig => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Figure ${fig.number}: ${fig.caption}`,
              font: 'Times New Roman',
              size: 22,
            }),
          ],
          spacing: { before: 60, after: 60, line: 360 },
          indent: { left: convertInchesToTwip(0.25) },
        })
      );
    });
  }

  // Tables list
  const tablesList = figures.filter(f => f.type === 'table');
  if (tablesList.length > 0) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Tableaux',
            bold: true,
            font: 'Times New Roman',
            size: 24,
          }),
        ],
        spacing: { before: 200, after: 120, line: 360 },
      })
    );
    
    tablesList.forEach(tab => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tableau ${tab.number}: ${tab.caption}`,
              font: 'Times New Roman',
              size: 22,
            }),
          ],
          spacing: { before: 60, after: 60, line: 360 },
          indent: { left: convertInchesToTwip(0.25) },
        })
      );
    });
  }

  return paragraphs;
};

// Create paragraphs from content
const createParagraphsFromContent = (content: string): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  const lines = content.split('\n\n').filter(Boolean);
  
  lines.forEach(line => {
    const cleanLine = htmlToText(line);
    if (cleanLine.trim()) {
      // Check if it's a subtitle (starts with ### or **)
      if (line.startsWith('###') || line.startsWith('**')) {
        const title = cleanLine.replace(/^\*\*|\*\*$/g, '').replace(/^###\s*/, '');
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: title,
                bold: true,
                font: 'Times New Roman',
                size: 24, // 12pt
              }),
            ],
            spacing: { before: 240, after: 120, line: 360 }, // 1.5 line spacing
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: cleanLine,
                font: 'Times New Roman',
                size: 24, // 12pt
              }),
            ],
            spacing: { before: 120, after: 120, line: 360 }, // 1.5 line spacing
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      }
    }
  });
  
  return paragraphs;
};

// Create reference paragraphs with proper formatting
const createReferenceParagraphs = (
  references: Reference[], 
  format: CitationFormat
): Paragraph[] => {
  const paragraphs: Paragraph[] = [];
  
  // Section title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'RÉFÉRENCES BIBLIOGRAPHIQUES',
          bold: true,
          font: 'Times New Roman',
          size: 28, // 14pt
        }),
      ],
      spacing: { before: 480, after: 240, line: 360 },
      alignment: AlignmentType.LEFT,
    })
  );
  
  // Each reference
  references.forEach((ref, i) => {
    const formattedRef = formatReference(ref, format, i + 1);
    
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: formattedRef,
            font: 'Times New Roman',
            size: 24, // 12pt
          }),
        ],
        spacing: { before: 120, after: 120, line: 360 },
        alignment: AlignmentType.JUSTIFIED,
        indent: format === 'apa' ? {
          left: convertInchesToTwip(0.5),
          hanging: convertInchesToTwip(0.5),
        } : undefined,
      })
    );
  });
  
  return paragraphs;
};

export const exportToWord = async (
  sections: Section[], 
  title: string,
  references?: Reference[],
  citationFormat: CitationFormat = 'apa',
  figures?: Figure[]
) => {
  const children: Paragraph[] = [];
  
  // Main title
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          font: 'Times New Roman',
          size: 32, // 16pt
        }),
      ],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Add list of figures and tables if any
  if (figures && figures.length > 0) {
    const figureParagraphs = createFigureParagraphs(figures);
    children.push(...figureParagraphs);
  }
  
  // Add each section
  sections.forEach(section => {
    // Section title (bold)
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: section.title.toUpperCase(),
            bold: true,
            font: 'Times New Roman',
            size: 28, // 14pt
          }),
        ],
        spacing: { before: 400, after: 200, line: 360 },
        alignment: AlignmentType.LEFT,
      })
    );
    
    // Section content
    const contentParagraphs = createParagraphsFromContent(section.content);
    children.push(...contentParagraphs);
    
    // Legacy references (inline in section) if any
    if (section.references && section.references.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Références:',
              bold: true,
              font: 'Times New Roman',
              size: 24,
            }),
          ],
          spacing: { before: 240, after: 120, line: 360 },
        })
      );
      
      section.references.forEach(ref => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `• ${ref}`,
                font: 'Times New Roman',
                size: 20, // 10pt for references
              }),
            ],
            spacing: { line: 360 },
            alignment: AlignmentType.JUSTIFIED,
          })
        );
      });
    }
  });
  
  // Add bibliography section if references provided
  if (references && references.length > 0) {
    const refParagraphs = createReferenceParagraphs(references, citationFormat);
    children.push(...refParagraphs);
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      },
    ],
  });
  
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${title.substring(0, 50).replace(/[^a-zA-Z0-9]/g, '_')}.docx`);
};
