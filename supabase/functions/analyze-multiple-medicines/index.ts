
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
    const { images } = await req.json();
    
    if (!images || images.length === 0) {
      throw new Error('No images provided');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log(`Analyzing ${images.length} medicine image(s) with Gemini API...`);

    // Process multiple images
    const analysisPromises = images.map(async (imageBase64: string, index: number) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a medical expert AI. First, analyze this image to determine if it contains medicine, pharmaceutical products, or medical items.

CRITICAL VALIDATION RULES:
1. If the image does NOT contain medicine, pills, tablets, capsules, medical bottles, medicine packaging, pharmaceutical products, or any medical items, respond with exactly: "NOT_MEDICAL_CONTENT"
2. If the image contains random objects, food, people, animals, landscapes, or anything non-medical, respond with exactly: "NOT_MEDICAL_CONTENT"
3. Only proceed with analysis if the image clearly shows medicine or pharmaceutical products

If the image IS medical/pharmaceutical, provide comprehensive information in JSON format:

IMPORTANT INSTRUCTIONS:
1. Identify the medicine name, brand, and any visible text on the packaging
2. If you can identify the medicine, provide detailed information for ALL fields
3. Use your medical knowledge to provide comprehensive details even if not all info is visible on the package
4. For unknown medicines, research similar medications based on visible ingredients
5. AVOID returning null values - provide general medical information when specific details aren't available
6. If you see partial information, extrapolate based on common medical knowledge

Required JSON format:
{
  "name": "Medicine brand/trade name",
  "generic_name": "Active ingredient/generic name", 
  "manufacturer": "Company name",
  "composition": ["ingredient1", "ingredient2"],
  "uses": ["condition1", "condition2", "symptom relief"],
  "dosage": "Typical dosage information",
  "side_effects": ["effect1", "effect2", "effect3"],
  "warnings": ["warning1", "warning2", "precaution"],
  "storage": "Storage conditions and temperature",
  "prescription_required": true/false
}

For each field:
- name: Extract from package or identify from ingredients
- generic_name: Provide the active pharmaceutical ingredient
- manufacturer: Company name if visible
- composition: List all active ingredients with strengths if visible
- uses: Provide 3-5 medical conditions/symptoms this medicine treats
- dosage: Give standard adult dosage recommendations
- side_effects: List 4-6 common side effects
- warnings: Include 3-4 important precautions or contraindications
- storage: Specify temperature and storage conditions
- prescription_required: Determine if this requires prescription

Be thorough and provide useful medical information even when the image quality is limited.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 2048,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API Error for image ${index + 1}:`, response.status, errorText);
        return { error: `Failed to analyze image ${index + 1}` };
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        // Check if the content is not medical
        if (textResponse.includes('NOT_MEDICAL_CONTENT')) {
          return { 
            index, 
            error: `Image ${index + 1} is not a medicine image. Please upload photos of medicine, pills, tablets, or pharmaceutical products.` 
          };
        }

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return { index, result: JSON.parse(jsonMatch[0]) };
          } catch (parseError) {
            console.error(`JSON parse error for image ${index + 1}:`, parseError);
            return { error: `Failed to parse analysis for image ${index + 1}` };
          }
        }
      }
      
      return { error: `No valid response for image ${index + 1}` };
    });

    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);
    
    console.log('Multiple medicine analysis completed');
    
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-multiple-medicines function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
