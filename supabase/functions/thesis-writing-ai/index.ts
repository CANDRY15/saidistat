import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThesisRequest {
  action: 'identify_study' | 'generate_section' | 'generate_references';
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
  };
  existingContent?: string;
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

    let systemPrompt = '';
    let userPrompt = '';

    switch (request.action) {
      case 'identify_study':
        systemPrompt = `Tu es un expert en méthodologie de recherche médicale et biomédicale. 
Ton rôle est d'identifier le type d'étude approprié basé sur le sujet de recherche fourni.

Types d'études possibles:
- Étude descriptive transversale (prévalence, fréquence, caractéristiques)
- Étude de cohorte prospective/rétrospective
- Étude cas-témoins
- Étude analytique transversale
- Étude expérimentale/essai clinique
- Revue systématique/méta-analyse

Réponds en JSON avec le format:
{
  "studyType": "type d'étude",
  "justification": "explication du choix",
  "characteristics": ["caractéristique 1", "caractéristique 2"],
  "suggestedObjectives": {
    "general": "objectif général",
    "specific": ["obj spécifique 1", "obj spécifique 2", "obj spécifique 3"]
  }
}`;
        userPrompt = `Identifie le type d'étude approprié pour ce sujet de recherche: "${request.topic}"`;
        break;

      case 'generate_section':
        systemPrompt = getSystemPromptForSection(request.section || '', request.studyType || '');
        userPrompt = getUserPromptForSection(request);
        break;

      case 'generate_references':
        systemPrompt = `Tu es un expert en rédaction scientifique. Génère des références bibliographiques fictives mais réalistes en format auteur-date (Harvard) pour le domaine médical.
Les références doivent être récentes (2018-2024) et pertinentes pour le sujet.
Format: Auteur et al. (Année) pour les citations dans le texte.
Retourne un JSON avec: { "references": [{ "citation": "...", "fullReference": "..." }] }`;
        userPrompt = `Génère 8-10 références bibliographiques pour le sujet: "${request.topic}" dans le domaine ${request.context?.domain || 'médical'}`;
        break;

      default:
        throw new Error('Action non reconnue');
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
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes dépassée, veuillez réessayer plus tard." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits insuffisants, veuillez recharger votre compte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    console.log('AI response received, length:', content.length);

    // Try to parse as JSON if expected
    let result;
    try {
      // Extract JSON from markdown code blocks if present
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

function getSystemPromptForSection(section: string, studyType: string): string {
  const basePrompt = `Tu es un expert en rédaction de mémoires et thèses médicales. Tu rédiges en français académique.
Tu utilises le système de citation auteur-date (ex: Dupont et al. 2022).
Type d'étude: ${studyType}

`;

  const sectionPrompts: Record<string, string> = {
    'context': basePrompt + `Rédige le CONTEXTE ET JUSTIFICATION de l'étude.
- Exactement 5 lignes
- Présente le contexte général du problème de santé
- Justifie l'importance de l'étude
- Utilise des données épidémiologiques récentes
Retourne en JSON: { "content": "texte du contexte" }`,

    'state_of_question': basePrompt + `Rédige l'ÉTAT DE LA QUESTION suivant la règle de la pyramide inversée.
Structure:
1. Situation mondiale (1 paragraphe avec statistiques OMS)
2. Situation en Afrique subsaharienne (1 paragraphe)
3. Situation en RDC et localement (1 paragraphe)

Chaque paragraphe doit contenir 5-6 lignes avec des références (Auteur et al. Année).
Utilise des statistiques récentes et pertinentes.
Retourne en JSON: { "content": "texte complet", "references": ["ref1", "ref2"] }`,

    'problematic': basePrompt + `Rédige la PROBLÉMATIQUE de l'étude.
Structure: 3 paragraphes de 5-6 lignes chacun
1. Présentation du problème principal
2. Lacunes dans les connaissances actuelles
3. Questions de recherche (2-3 questions)

Termine par les questions auxquelles l'étude va répondre.
Retourne en JSON: { "content": "texte de la problématique" }`,

    'choice_relevance': basePrompt + `Rédige le CHOIX ET INTÉRÊT DU SUJET.
Structure:
- Choix du sujet (pourquoi ce sujet a été choisi)
- Intérêts:
  * Sur le plan personnel
  * Sur le plan scientifique  
  * Sur le plan communautaire

Retourne en JSON: { "content": "texte complet" }`,

    'objectives': basePrompt + `Rédige les OBJECTIFS de l'étude.
Structure:
A. Objectif général (1 phrase commençant par "Contribuer à...")
B. Objectifs spécifiques (3-4 objectifs commençant par des verbes d'action: Déterminer, Identifier, Décrire, Évaluer)

Retourne en JSON: { "generalObjective": "...", "specificObjectives": ["obj1", "obj2", "obj3"] }`,

    'subdivision': basePrompt + `Rédige la SUBDIVISION DU TRAVAIL.
Explique brièvement comment le travail est organisé:
- Première partie: Considérations théoriques
- Deuxième partie: Approche pratique (Matériel et méthodes, Résultats, Discussion)

Retourne en JSON: { "content": "texte de la subdivision" }`,

    'theoretical_part': basePrompt + `Rédige une partie des CONSIDÉRATIONS THÉORIQUES.
Inclure:
1. Définition des concepts clés
2. Classification (si applicable)
3. Épidémiologie
4. Physiopathologie (résumé)
5. Facteurs de risque
6. Manifestations cliniques
7. Diagnostic
8. Prise en charge
9. Complications

Chaque section avec des références appropriées.
Retourne en JSON: { "sections": [{ "title": "...", "content": "..." }] }`,

    'methodology': basePrompt + `Rédige la section MATÉRIEL ET MÉTHODES.
Structure standard:
1. Type d'étude
2. Période et lieu d'étude
3. Population d'étude (critères d'inclusion/exclusion)
4. Échantillonnage
5. Variables étudiées
6. Collecte des données
7. Analyse statistique
8. Considérations éthiques

Retourne en JSON: { "sections": [{ "title": "...", "content": "..." }] }`,
  };

  return sectionPrompts[section] || basePrompt;
}

function getUserPromptForSection(request: ThesisRequest): string {
  const ctx = request.context || {};
  let prompt = `Sujet: ${request.topic || 'Non spécifié'}\n`;
  
  if (ctx.domain) prompt += `Domaine: ${ctx.domain}\n`;
  if (ctx.objective) prompt += `Objectif principal: ${ctx.objective}\n`;
  if (ctx.population) prompt += `Population: ${ctx.population}\n`;
  if (ctx.period) prompt += `Période: ${ctx.period}\n`;
  if (ctx.location) prompt += `Lieu: ${ctx.location}\n`;
  if (ctx.variables?.length) prompt += `Variables: ${ctx.variables.join(', ')}\n`;
  if (request.existingContent) prompt += `\nContenu existant à prendre en compte:\n${request.existingContent}`;

  return prompt;
}
