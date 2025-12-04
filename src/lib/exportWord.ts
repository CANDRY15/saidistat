import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, convertInchesToTwip } from 'docx';
import { saveAs } from 'file-saver';

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

// Parse HTML and extract text with formatting info
const parseHtmlContent = (html: string): { text: string; bold?: boolean; italic?: boolean }[] => {
  const div = document.createElement('div');
  div.innerHTML = html;
  
  const results: { text: string; bold?: boolean; italic?: boolean }[] = [];
  
  const processNode = (node: Node, bold = false, italic = false) => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) {
        results.push({ text: node.textContent, bold, italic });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;
      const tagName = element.tagName.toLowerCase();
      
      const newBold = bold || tagName === 'strong' || tagName === 'b';
      const newItalic = italic || tagName === 'em' || tagName === 'i';
      
      if (tagName === 'br') {
        results.push({ text: '\n' });
      } else if (tagName === 'p' || tagName === 'div') {
        node.childNodes.forEach(child => processNode(child, newBold, newItalic));
        results.push({ text: '\n' });
      } else {
        node.childNodes.forEach(child => processNode(child, newBold, newItalic));
      }
    }
  };
  
  processNode(div);
  return results;
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

export const exportToWord = async (sections: Section[], title: string) => {
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
    
    // References if any
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
