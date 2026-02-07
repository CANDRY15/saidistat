import { Reference, ReferenceType } from '@/components/ReferenceManager';

/**
 * Parse RIS format (.ris files from Zotero, EndNote, etc.)
 */
export function parseRIS(content: string): Reference[] {
  const references: Reference[] = [];
  const entries = content.split(/\nER\s*-/);

  for (const entry of entries) {
    if (!entry.trim()) continue;

    const ref: Partial<Reference> = {
      id: crypto.randomUUID(),
      authors: [],
      type: 'article',
    };

    const lines = entry.split('\n');
    for (const line of lines) {
      const match = line.match(/^([A-Z][A-Z0-9])\s{2}-\s(.+)/);
      if (!match) continue;

      const [, tag, value] = match;
      const trimmed = value.trim();

      switch (tag) {
        case 'TY':
          ref.type = mapRISType(trimmed);
          break;
        case 'AU':
        case 'A1':
          ref.authors!.push(trimmed);
          break;
        case 'TI':
        case 'T1':
          ref.title = trimmed;
          break;
        case 'JO':
        case 'JF':
        case 'T2':
          if (!ref.journal) ref.journal = trimmed;
          break;
        case 'PY':
        case 'Y1':
          ref.year = trimmed.split('/')[0];
          break;
        case 'VL':
          ref.volume = trimmed;
          break;
        case 'IS':
          ref.issue = trimmed;
          break;
        case 'SP':
          ref.pages = trimmed;
          break;
        case 'EP':
          if (ref.pages) ref.pages += `-${trimmed}`;
          break;
        case 'DO':
          ref.doi = trimmed;
          break;
        case 'PB':
          ref.publisher = trimmed;
          break;
        case 'CY':
          ref.city = trimmed;
          break;
        case 'UR':
          ref.url = trimmed;
          break;
        case 'SN':
          // ISBN/ISSN - skip
          break;
        case 'ED':
          if (!ref.editors) ref.editors = [];
          ref.editors.push(trimmed);
          break;
        case 'BT':
          ref.bookTitle = trimmed;
          break;
      }
    }

    if (ref.title && ref.authors && ref.authors.length > 0) {
      references.push(ref as Reference);
    }
  }

  return references;
}

/**
 * Parse BibTeX format (.bib files)
 */
export function parseBibTeX(content: string): Reference[] {
  const references: Reference[] = [];
  // Match @type{key, ... }
  const entryRegex = /@(\w+)\s*\{([^,]*),([^@]*)\}/g;
  let match;

  while ((match = entryRegex.exec(content)) !== null) {
    const [, type, , fields] = match;
    
    if (type.toLowerCase() === 'comment' || type.toLowerCase() === 'preamble' || type.toLowerCase() === 'string') {
      continue;
    }

    const ref: Partial<Reference> = {
      id: crypto.randomUUID(),
      authors: [],
      type: mapBibTeXType(type),
    };

    // Parse fields
    const fieldRegex = /(\w+)\s*=\s*[{"]([^}"]*)[}"]/g;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(fields)) !== null) {
      const [, fieldName, fieldValue] = fieldMatch;
      const key = fieldName.toLowerCase();
      const value = fieldValue.trim().replace(/\{|\}/g, '');

      switch (key) {
        case 'author':
          ref.authors = value.split(/\s+and\s+/i).map(a => {
            // Convert "Last, First" to "First Last"
            const parts = a.trim().split(',');
            if (parts.length === 2) {
              return `${parts[1].trim()} ${parts[0].trim()}`;
            }
            return a.trim();
          });
          break;
        case 'title':
          ref.title = value;
          break;
        case 'journal':
        case 'journaltitle':
          ref.journal = value;
          break;
        case 'year':
          ref.year = value;
          break;
        case 'volume':
          ref.volume = value;
          break;
        case 'number':
          ref.issue = value;
          break;
        case 'pages':
          ref.pages = value.replace('--', '-');
          break;
        case 'doi':
          ref.doi = value;
          break;
        case 'publisher':
          ref.publisher = value;
          break;
        case 'address':
          ref.city = value;
          break;
        case 'url':
          ref.url = value;
          break;
        case 'editor':
          ref.editors = value.split(/\s+and\s+/i).map(e => e.trim());
          break;
        case 'booktitle':
          ref.bookTitle = value;
          break;
        case 'edition':
          ref.edition = value;
          break;
        case 'school':
        case 'institution':
          ref.university = value;
          break;
      }
    }

    if (ref.title && ref.authors && ref.authors.length > 0) {
      references.push(ref as Reference);
    }
  }

  return references;
}

function mapRISType(risType: string): ReferenceType {
  switch (risType) {
    case 'JOUR': return 'article';
    case 'BOOK': return 'book';
    case 'CHAP': return 'chapter';
    case 'ELEC':
    case 'ICOMM': return 'website';
    case 'THES': return 'thesis';
    default: return 'article';
  }
}

function mapBibTeXType(bibType: string): ReferenceType {
  switch (bibType.toLowerCase()) {
    case 'article': return 'article';
    case 'book': return 'book';
    case 'incollection':
    case 'inbook': return 'chapter';
    case 'online':
    case 'misc': return 'website';
    case 'phdthesis':
    case 'mastersthesis': return 'thesis';
    default: return 'article';
  }
}

/**
 * Auto-detect format and parse
 */
export function parseReferenceFile(content: string, fileName: string): Reference[] {
  const ext = fileName.toLowerCase().split('.').pop();
  
  if (ext === 'ris') {
    return parseRIS(content);
  } else if (ext === 'bib' || ext === 'bibtex') {
    return parseBibTeX(content);
  }
  
  // Try to auto-detect
  if (content.includes('TY  -') && content.includes('ER  -')) {
    return parseRIS(content);
  } else if (content.includes('@article') || content.includes('@book') || content.includes('@inproceedings')) {
    return parseBibTeX(content);
  }
  
  return [];
}
