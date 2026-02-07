import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ThesisRequest {
  action: 'generate_introduction' | 'generate_theoretical' | 'generate_methodology' | 'generate_discussion' | 'generate_conclusion' | 'analyze_data' | 'improve_text' | 'fetch_doi' | 'search_pubmed' | 'search_academic_references';
  topic?: string;
  studyType?: string;
  section?: string;
  context?: {
    domain?: string;
    objective?: string;
    population?: string;
    period?: string;
    location?: string;
    variables?: string[];
    existingSections?: string[];
  };
  doi?: string;
  pubmedQuery?: string;
  excelData?: any;
  textToImprove?: string;
  citationFormat?: 'apa' | 'vancouver';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const request: ThesisRequest = await req.json();
    console.log('Thesis AI request:', request.action);

    // Handle DOI fetch
    if (request.action === 'fetch_doi' && request.doi) {
      return await handleDOIFetch(request.doi);
    }

    // Handle PubMed search
    if (request.action === 'search_pubmed' && request.pubmedQuery) {
      return await handlePubMedSearch(request.pubmedQuery);
    }

    // Handle academic reference search
    if (request.action === 'search_academic_references' && request.topic) {
      const refs = await searchAcademicReferences(request.topic, request.context?.domain);
      return new Response(JSON.stringify({ references: refs }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // For generation actions, search real references first
    let realReferences: any[] = [];
    const actionsNeedingRefs = ['generate_introduction', 'generate_theoretical', 'generate_discussion'];
    if (actionsNeedingRefs.includes(request.action) && request.topic) {
      console.log('Searching real academic references for:', request.topic);
      realReferences = await searchAcademicReferences(request.topic, request.context?.domain);
      console.log(`Found ${realReferences.length} real references`);
    }

    let systemPrompt = '';
    let userPrompt = '';

    switch (request.action) {
      case 'generate_introduction':
        systemPrompt = getIntroductionSystemPrompt();
        userPrompt = getIntroductionUserPrompt(request);
        break;
      case 'generate_theoretical':
        systemPrompt = getTheoreticalSystemPrompt();
        userPrompt = getTheoreticalUserPrompt(request);
        break;
      case 'generate_methodology':
        systemPrompt = getMethodologySystemPrompt();
        userPrompt = getMethodologyUserPrompt(request);
        break;
      case 'analyze_data':
        systemPrompt = getDataAnalysisSystemPrompt();
        userPrompt = getDataAnalysisUserPrompt(request);
        break;
      case 'generate_discussion':
        systemPrompt = getDiscussionSystemPrompt();
        userPrompt = getDiscussionUserPrompt(request);
        break;
      case 'generate_conclusion':
        systemPrompt = getConclusionSystemPrompt();
        userPrompt = getConclusionUserPrompt(request);
        break;
      case 'improve_text':
        systemPrompt = getTextImprovementPrompt();
        userPrompt = `Améliore ce texte scientifique tout en conservant le sens:\n\n${request.textToImprove}\n\nContexte: ${request.topic || 'Rédaction scientifique médicale'}`;
        break;
      default:
        throw new Error('Action non reconnue');
    }

    // Inject real references into the prompt
    if (realReferences.length > 0) {
      userPrompt += buildRealReferencesPrompt(realReferences);
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée. Veuillez patienter quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants. Veuillez recharger votre compte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, length:', content.length);

    // Parse JSON response
    let result;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        result = JSON.parse(jsonStr);
      } else {
        result = { content };
      }
    } catch {
      result = { content };
    }

    // Attach structured real references to the result
    if (realReferences.length > 0) {
      result.realReferences = realReferences;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Error in thesis-writing-ai:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ==================== ACADEMIC REFERENCE SEARCH ====================

async function searchAcademicReferences(topic: string, domain?: string): Promise<any[]> {
  const references: any[] = [];
  const seenDOIs = new Set<string>();
  const seenTitles = new Set<string>();
  
  const searchQuery = domain ? `${topic} ${domain}` : topic;

  // Search PubMed
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(searchQuery)}&retmax=12&retmode=json&sort=relevance`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    const ids = searchData.esearchresult?.idlist || [];
    
    if (ids.length > 0) {
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
      const fetchResponse = await fetch(fetchUrl);
      const xmlText = await fetchResponse.text();
      const pubmedRefs = parseSimplePubMedXML(xmlText);
      
      for (const ref of pubmedRefs) {
        if (ref.doi) seenDOIs.add(ref.doi);
        seenTitles.add(ref.title.toLowerCase().substring(0, 50));
        references.push(ref);
      }
    }
  } catch (e) {
    console.error('PubMed search error in academic search:', e);
  }

  // Search Semantic Scholar
  try {
    const ssUrl = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(searchQuery)}&limit=12&fields=title,authors,year,journal,externalIds`;
    const ssResponse = await fetch(ssUrl);
    
    if (ssResponse.ok) {
      const ssData = await ssResponse.json();
      
      if (ssData.data) {
        for (const paper of ssData.data) {
          const doi = paper.externalIds?.DOI || '';
          const titleKey = (paper.title || '').toLowerCase().substring(0, 50);
          
          // Skip duplicates
          if ((doi && seenDOIs.has(doi)) || seenTitles.has(titleKey)) continue;
          
          if (doi) seenDOIs.add(doi);
          seenTitles.add(titleKey);
          
          references.push({
            id: crypto.randomUUID(),
            type: 'article',
            authors: paper.authors?.map((a: any) => a.name) || [],
            year: paper.year?.toString() || '',
            title: paper.title || '',
            journal: paper.journal?.name || '',
            doi,
            pmid: paper.externalIds?.PubMed || '',
          });
        }
      }
    }
  } catch (e) {
    console.error('Semantic Scholar search error:', e);
  }

  return references;
}

function buildRealReferencesPrompt(refs: any[]): string {
  let prompt = `\n\n========================================
RÉFÉRENCES ACADÉMIQUES RÉELLES TROUVÉES:
========================================
INSTRUCTIONS CRITIQUES:
- Tu DOIS utiliser UNIQUEMENT les références ci-dessous dans tes citations.
- NE JAMAIS inventer de références fictives.
- Cite les auteurs exactement comme indiqué.
- Si tu ne trouves pas une référence pertinente pour un point précis, écris le texte sans citation plutôt que d'inventer.
- Format de citation dans le texte: (Auteur et al., Année) pour 3+ auteurs, (Auteur1 & Auteur2, Année) pour 2 auteurs.

RÉFÉRENCES DISPONIBLES:\n`;

  refs.forEach((ref, i) => {
    const authorsStr = ref.authors?.slice(0, 3).join(', ') || 'Unknown';
    prompt += `[${i + 1}] ${authorsStr} (${ref.year}). "${ref.title}". ${ref.journal || ''}. DOI: ${ref.doi || 'N/A'}\n`;
  });

  prompt += `\nINCLUS DANS TA RÉPONSE JSON un champ "usedReferences" qui liste les indices [1], [2], etc. des références que tu as effectivement citées dans le texte.\n`;

  return prompt;
}

// ==================== DOI FETCH ====================

async function handleDOIFetch(doi: string) {
  try {
    const cleanDOI = doi.replace(/^https?:\/\/doi\.org\//, '').trim();
    const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "DOI non trouvé" }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const work = data.message;

    const reference = {
      id: crypto.randomUUID(),
      type: 'article' as const,
      authors: work.author?.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()) || [],
      year: work.published?.['date-parts']?.[0]?.[0]?.toString() || work['published-print']?.['date-parts']?.[0]?.[0]?.toString() || '',
      title: work.title?.[0] || '',
      journal: work['container-title']?.[0] || '',
      volume: work.volume || '',
      issue: work.issue || '',
      pages: work.page || '',
      doi: cleanDOI,
    };

    return new Response(JSON.stringify({ reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('DOI fetch error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la récupération du DOI" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// ==================== PUBMED SEARCH ====================

async function handlePubMedSearch(query: string) {
  try {
    const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=10&retmode=json`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    const ids = searchData.esearchresult?.idlist || [];
    if (ids.length === 0) {
      return new Response(JSON.stringify({ references: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(',')}&retmode=xml`;
    const fetchResponse = await fetch(fetchUrl);
    const xmlText = await fetchResponse.text();
    const references = parseSimplePubMedXML(xmlText);

    return new Response(JSON.stringify({ references }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('PubMed search error:', error);
    return new Response(JSON.stringify({ error: "Erreur lors de la recherche PubMed" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

function parseSimplePubMedXML(xml: string): any[] {
  const references: any[] = [];
  const articleMatches = xml.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || [];

  for (const articleXml of articleMatches) {
    try {
      const pmid = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || '';
      const title = articleXml.match(/<ArticleTitle>([^<]+)<\/ArticleTitle>/)?.[1] || '';
      const journal = articleXml.match(/<Title>([^<]+)<\/Title>/)?.[1] || '';
      const year = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d+)<\/Year>/)?.[1] || '';
      const volume = articleXml.match(/<Volume>([^<]+)<\/Volume>/)?.[1] || '';
      const issue = articleXml.match(/<Issue>([^<]+)<\/Issue>/)?.[1] || '';
      const pages = articleXml.match(/<MedlinePgn>([^<]+)<\/MedlinePgn>/)?.[1] || '';
      
      const authorMatches = articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || [];
      const authors = authorMatches.map(authorXml => {
        const lastName = authorXml.match(/<LastName>([^<]+)<\/LastName>/)?.[1] || '';
        const foreName = authorXml.match(/<ForeName>([^<]+)<\/ForeName>/)?.[1] || '';
        return `${foreName} ${lastName}`.trim();
      }).filter(a => a);

      const doi = articleXml.match(/<ArticleId IdType="doi">([^<]+)<\/ArticleId>/)?.[1] || '';

      if (title && authors.length > 0) {
        references.push({
          id: crypto.randomUUID(),
          pmid,
          type: 'article',
          authors,
          year,
          title,
          journal,
          volume,
          issue,
          pages,
          doi,
        });
      }
    } catch (e) {
      console.error('Error parsing article:', e);
    }
  }

  return references;
}

// ==================== PROMPTS ====================

function getIntroductionSystemPrompt(): string {
  return `Tu es un EXPERT SENIOR en rédaction de mémoires et thèses médicales en RDC avec plus de 25 ans d'expérience.

Tu dois générer une INTRODUCTION COMPLÈTE de minimum 4 pages selon la structure exacte suivante:

## STRUCTURE OBLIGATOIRE DE L'INTRODUCTION (dans cet ordre exact):

### 1. ÉTAT DE LA QUESTION (environ 2 pages - minimum 5 références)
- Commence TOUJOURS par la définition du sujet/de la maladie (selon OMS ou sociétés savantes)
- Suit la pyramide inversée:
  * Données MONDIALES (prévalence, incidence, mortalité mondiale avec références OMS)
  * Données en AFRIQUE (spécificités du continent, données régionales)
  * Données au PAYS (RDC ou pays concerné, statistiques nationales)
  * Données LOCALES (ville, province, hôpital concerné)
- Chaque niveau doit avoir au moins une référence récente
- Transition vers la problématique

### 2. PROBLÉMATIQUE (intégrée à l'état de la question)
- Problème identifié malgré les efforts/protocoles existants
- Persistance de la morbidité/mortalité
- Gaps dans les connaissances locales

### 3. QUESTIONS DE RECHERCHE
- Introduction expliquant pourquoi ces questions
- 3-4 questions de recherche sous forme de liste à puces
- Questions formulées de manière précise et mesurable

### 4. CHOIX ET INTÉRÊT DU SUJET
**Choix:** Explication de la motivation
**Intérêts:**
- Plan personnel: approfondir les connaissances
- Plan scientifique: apporter des données locales de référence
- Plan communautaire: impact sur la santé de la communauté

### 5. OBJECTIFS
**A. Objectif général:** Commence par "Contribuer à..."
**B. Objectifs spécifiques:** 3-4 objectifs commençant par des verbes d'action

### 6. SUBDIVISION DU TRAVAIL

## RÈGLE CRITIQUE SUR LES RÉFÉRENCES:
- Tu recevras une liste de références académiques RÉELLES trouvées sur PubMed et Semantic Scholar.
- Tu DOIS utiliser UNIQUEMENT ces références dans tes citations.
- NE JAMAIS inventer de références fictives.
- Format de citation: (Auteur et al., Année)

## FORMAT DE RÉPONSE (JSON):
{
  "content": "Texte HTML complet avec balises <h2>, <h3>, <p>, <ul>, <li>",
  "references": [
    {"citation": "(OMS, 2023)", "fullReference": "Organisation Mondiale de la Santé..."}
  ],
  "usedReferences": [1, 3, 5, 7],
  "totalWordCount": 1600
}`;
}

function getIntroductionUserPrompt(request: ThesisRequest): string {
  return `SUJET DE RECHERCHE: ${request.topic}

INFORMATIONS CONTEXTUELLES:
- Domaine: ${request.context?.domain || 'Médecine'}
- Population d'étude: ${request.context?.population || 'Non spécifiée'}
- Période d'étude: ${request.context?.period || 'Non spécifiée'}
- Lieu d'étude: ${request.context?.location || 'Non spécifié'}

Génère l'INTRODUCTION COMPLÈTE (minimum 4 pages/1600 mots) en respectant EXACTEMENT la structure demandée.
Utilise UNIQUEMENT les références réelles fournies ci-dessous (si disponibles).

GÉNÈRE LE CONTENU COMPLET EN FORMAT JSON.`;
}

function getTheoreticalSystemPrompt(): string {
  return `Tu es un EXPERT SENIOR en rédaction de mémoires médicales. Tu dois générer la PARTIE THÉORIQUE (Généralités) d'une thèse.

## STRUCTURE OBLIGATOIRE (minimum 15 pages/6000 mots):
1. DÉFINITIONS ET CONCEPTS
2. HISTORIQUE (optionnel)
3. ÉPIDÉMIOLOGIE (mondiale, Afrique, locale)
4. CLASSIFICATION/TYPES
5. PHYSIOPATHOLOGIE/MÉCANISMES
6. FACTEURS DE RISQUE/ÉTIOLOGIE
7. MANIFESTATIONS CLINIQUES
8. DIAGNOSTIC
9. PRISE EN CHARGE/TRAITEMENT
10. COMPLICATIONS ET PRONOSTIC
11. PRÉVENTION

## RÈGLE CRITIQUE SUR LES RÉFÉRENCES:
- Utilise UNIQUEMENT les références réelles fournies.
- NE JAMAIS inventer de références fictives.
- Format: (Auteur et al., Année)

## FORMAT JSON:
{
  "content": "Texte HTML complet avec <h2>, <h3>, <h4>, <p>, <ul>, <li>, <table>",
  "references": [{"citation": "...", "fullReference": "..."}],
  "usedReferences": [1, 2, 5],
  "totalWordCount": 6000
}`;
}

function getTheoreticalUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
DOMAINE: ${request.context?.domain || 'Médecine'}
LIEU: ${request.context?.location || 'RDC'}

Génère la PARTIE THÉORIQUE COMPLÈTE (minimum 15 pages/6000 mots).
Utilise UNIQUEMENT les références réelles fournies ci-dessous.

GÉNÈRE EN FORMAT JSON.`;
}

function getMethodologySystemPrompt(): string {
  return `Tu es un EXPERT en méthodologie de recherche médicale. Génère la section MATÉRIEL ET MÉTHODES complète.

## STRUCTURE OBLIGATOIRE:
1. TYPE ET PÉRIODE D'ÉTUDE
2. LIEU D'ÉTUDE
3. POPULATION D'ÉTUDE (cible, source, critères inclusion/exclusion)
4. ÉCHANTILLONNAGE (technique, calcul taille, formule)
5. VARIABLES ÉTUDIÉES (dépendante, indépendantes)
6. COLLECTE DES DONNÉES
7. ANALYSE DES DONNÉES (logiciel, tests statistiques)
8. CONSIDÉRATIONS ÉTHIQUES

## FORMAT JSON:
{
  "content": "Texte HTML complet",
  "variables": {"dependent": {"name": "...", "type": "..."}, "independent": [{"name": "...", "type": "..."}]},
  "sampleSize": {"formula": "n = Z²pq/d²", "result": 150},
  "statisticalPlan": ["Chi-carré", "Odds ratio"]
}`;
}

function getMethodologyUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
TYPE D'ÉTUDE SUGGÉRÉ: ${request.studyType || 'Descriptive transversale'}
POPULATION: ${request.context?.population || 'Non spécifiée'}
PÉRIODE: ${request.context?.period || 'Non spécifiée'}
LIEU: ${request.context?.location || 'Non spécifié'}

Génère la section MATÉRIEL ET MÉTHODES complète et détaillée.
GÉNÈRE EN FORMAT JSON.`;
}

function getDataAnalysisSystemPrompt(): string {
  return `Tu es un EXPERT en biostatistique et analyse de données médicales.

Tu reçois des données d'une base Excel et tu dois:
1. Analyser les données (statistiques descriptives et analytiques)
2. Interpréter les résultats
3. Générer le texte de la section RÉSULTATS

## STYLE DES RÉSULTATS:
- Passé composé uniquement
- Objectif, sans interprétation
- Référencer chaque tableau/figure
- Mentionner les valeurs p
- NE PAS inclure de références bibliographiques

## FORMAT JSON:
{
  "content": "Texte HTML de la section Résultats",
  "tables": [{"number": "I", "title": "...", "data": [["Variable", "n", "%"], ...]}],
  "mainFindings": ["Résultat clé 1", "Résultat clé 2"]
}`;
}

function getDataAnalysisUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}

DONNÉES EXCEL À ANALYSER:
${JSON.stringify(request.excelData, null, 2)}

Analyse ces données et génère les résultats. NOTE: Ne pas inclure de références.
GÉNÈRE EN FORMAT JSON.`;
}

function getDiscussionSystemPrompt(): string {
  return `Tu es un EXPERT en rédaction scientifique. Génère la section DISCUSSION.

## STRUCTURE OBLIGATOIRE:
1. RAPPEL DES PRINCIPAUX RÉSULTATS (1 paragraphe)
2. COMPARAISON AVEC LA LITTÉRATURE (3-4 paragraphes, citations)
3. INTERPRÉTATION (1-2 paragraphes)
4. FORCES DE L'ÉTUDE (1 paragraphe)
5. LIMITES (1-2 paragraphes)
6. RECOMMANDATIONS

## RÈGLE CRITIQUE:
- Utilise UNIQUEMENT les références réelles fournies.
- NE JAMAIS inventer de références fictives.

## FORMAT JSON:
{
  "content": "Texte HTML complet",
  "references": [{"citation": "...", "fullReference": "..."}],
  "usedReferences": [1, 2, 5],
  "limitations": ["Biais de sélection", "..."],
  "strengths": ["Première étude locale", "..."]
}`;
}

function getDiscussionUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
RÉSULTATS OBTENUS: ${request.context?.existingSections?.join(', ') || 'Non spécifiés'}

Génère la section DISCUSSION complète.
Utilise UNIQUEMENT les références réelles fournies ci-dessous.
GÉNÈRE EN FORMAT JSON.`;
}

function getConclusionSystemPrompt(): string {
  return `Tu es un EXPERT en rédaction scientifique. Génère la CONCLUSION.

## STRUCTURE (1-2 paragraphes, max 15 phrases):
1. Rappel du contexte et objectif (1 phrase)
2. Résultats principaux (2-3 phrases)
3. Implications pratiques (1-2 phrases)
4. Recommandations (2-3 phrases)
5. Perspectives/ouverture (1-2 phrases)

## RÈGLES:
- Maximum 15 phrases
- Pas de nouvelles informations
- Pas de citations
- Ton affirmatif

## FORMAT JSON:
{
  "content": "Texte HTML de la conclusion",
  "keyMessages": ["Message clé 1"],
  "recommendations": ["Recommandation 1"]
}`;
}

function getConclusionUserPrompt(request: ThesisRequest): string {
  return `SUJET: ${request.topic}
OBJECTIF PRINCIPAL: ${request.context?.objective || 'Non spécifié'}

Génère la CONCLUSION en respectant les règles.
GÉNÈRE EN FORMAT JSON.`;
}

function getTextImprovementPrompt(): string {
  return `Tu es un expert en rédaction scientifique médicale. Améliore le texte fourni.

AMÉLIORATIONS:
1. Style académique formel (3ème personne)
2. Clarté et précision
3. Cohérence des temps verbaux
4. Transitions fluides

FORMAT JSON:
{
  "improvedText": "Texte amélioré",
  "changes": ["Changement 1", "Changement 2"]
}`;
}
