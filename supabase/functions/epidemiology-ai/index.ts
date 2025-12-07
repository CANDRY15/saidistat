import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing exercise:", exerciseText.substring(0, 100));

    const systemPrompt = `Tu es un expert en épidémiologie et biostatistiques. Ton rôle est d'analyser les exercices d'épidémiologie et d'extraire les informations suivantes:

1. IDENTIFIER LE TYPE D'ÉTUDE parmi:
   - "cohort": Étude de cohorte (on suit des exposés et non-exposés pour voir qui développe la maladie)
   - "case-control": Étude cas-témoins (on compare des malades et non-malades pour voir l'exposition passée)
   - "diagnostic": Test diagnostique (on évalue un test par rapport à un gold standard)
   - "frequency": Mesures de fréquence (incidence, prévalence)
   - "mortality": Taux de mortalité

2. EXTRAIRE LES VALEURS pour le tableau de contingence 2x2:
   Pour cohorte (E+/E-):
   - a: Exposés malades
   - b: Exposés non-malades  
   - c: Non-exposés malades
   - d: Non-exposés non-malades

   Pour cas-témoins:
   - a: Cas exposés
   - b: Témoins exposés
   - c: Cas non-exposés
   - d: Témoins non-exposés

   Pour test diagnostique:
   - a: Vrais positifs (test+ et malade)
   - b: Faux positifs (test+ et non-malade)
   - c: Faux négatifs (test- et malade)
   - d: Vrais négatifs (test- et non-malade)

RÉPONDS UNIQUEMENT en JSON valide avec cette structure:
{
  "studyType": "cohort" | "case-control" | "diagnostic" | "frequency" | "mortality",
  "studyTypeName": "Nom du type d'étude en français",
  "explanation": "Explication brève de pourquoi c'est ce type d'étude",
  "values": {
    "a": number,
    "b": number,
    "c": number,
    "d": number
  },
  "extractionDetails": "Explication de comment les valeurs ont été extraites",
  "confidence": "high" | "medium" | "low"
}

Si tu ne peux pas extraire certaines valeurs, mets null.`;

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
          { role: "user", content: exerciseText }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte. Réessayez dans quelques instants." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    console.log("AI response:", aiResponse);

    // Parse JSON from response
    let parsedResponse;
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || 
                        aiResponse.match(/```\n?([\s\S]*?)\n?```/) ||
                        [null, aiResponse];
      const jsonString = jsonMatch[1] || aiResponse;
      parsedResponse = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(JSON.stringify({ 
        error: "Impossible d'analyser la réponse de l'IA",
        rawResponse: aiResponse 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in epidemiology-ai function:", error);
    const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
