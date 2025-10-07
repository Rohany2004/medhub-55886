import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      throw new Error('No image data provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing medicine with Lovable AI (gemini-2.5-flash)...');

    const systemPrompt = `You are a medical expert AI. First, analyze this image to determine if it contains medicine, pharmaceutical products, or medical items.

CRITICAL VALIDATION RULES:
1. If the image does NOT contain medicine, pills, tablets, capsules, medical bottles, medicine packaging, pharmaceutical products, or any medical items, respond with exactly: "NOT_MEDICAL_CONTENT"
2. If the image contains random objects, food, people, animals, landscapes, or anything non-medical, respond with exactly: "NOT_MEDICAL_CONTENT"
3. Only proceed with analysis if the image clearly shows medicine or pharmaceutical products

If the image IS medical/pharmaceutical, return ONLY valid JSON in the exact schema below with no prose before or after it:
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
  "prescription_required": true
}

Guidance:
- Identify the medicine name, brand, and any visible text on the packaging
- If you can identify the medicine, provide detailed information for ALL fields
- Use your medical knowledge to provide comprehensive details even if not all info is visible
- Avoid nulls; if specifics are unknown, provide general yet accurate info for the class of medicine`;

    const payload = {
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this medicine image and follow the system rules strictly.' },
            { type: 'image_url', image_url: `data:image/jpeg;base64,${imageBase64}` },
          ],
        },
      ],
    } as const;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway Error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please wait and try again.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI gateway response received');

    const textResponse: string | undefined = data.choices?.[0]?.message?.content;

    if (textResponse) {
      if (textResponse.includes('NOT_MEDICAL_CONTENT')) {
        return new Response(
          JSON.stringify({
            error:
              'This is not a medicine image. Please upload a clear photo of medicine, pills, tablets, or pharmaceutical products.',
          }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        );
      }

      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const medicineInfo = JSON.parse(jsonMatch[0]);
          return new Response(JSON.stringify({ medicineInfo }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (parseError) {
          console.error('JSON parse error:', parseError, 'Raw response:', textResponse);
        }
      }
    }

    throw new Error('No valid response from AI gateway');
  } catch (error) {
    console.error('Error in analyze-medicine function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
