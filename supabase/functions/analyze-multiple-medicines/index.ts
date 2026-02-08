import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check: require valid bearer token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized - Please sign in to use this feature' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    const token = authHeader.replace('Bearer ', '');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnon = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify user from token
    const authClient = createClient(supabaseUrl, supabaseAnon);
    const { data: userData, error: userErr } = await authClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error('Auth error:', userErr);
      return new Response(JSON.stringify({ error: 'Unauthorized - Invalid or expired session' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log('Authenticated user:', userData.user.id);

    const body = await req.json();
    const schema = z.object({ images: z.array(z.string().min(100).max(10000000)).min(1).max(6) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { images } = parsed.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing ${images.length} medicine image(s) with Lovable AI (gemini-2.5-flash)...`);

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
}`;

    const analyzeOne = async (imageBase64: string, index: number) => {
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

      try {
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
          console.error(`AI Gateway Error for image ${index + 1}:`, response.status, errorText);
          if (response.status === 429) return { index, error: 'AI rate limit exceeded. Please try again shortly.' };
          if (response.status === 402) return { index, error: 'AI credits exhausted. Please add credits and retry.' };
          return { index, error: `Failed to analyze image ${index + 1}` };
        }

        const data = await response.json();
        const textResponse: string | undefined = data.choices?.[0]?.message?.content;
        if (textResponse) {
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
              return { index, error: `Failed to parse analysis for image ${index + 1}` };
            }
          }
        }
        return { index, error: `No valid response for image ${index + 1}` };
      } catch (e) {
        console.error(`Unhandled error for image ${index + 1}:`, e);
        return { index, error: `Unexpected error for image ${index + 1}` };
      }
    };

    // Wait for all analyses to complete
    const results = await Promise.all(images.map((img: string, i: number) => analyzeOne(img, i)));
    
    console.log('Multiple medicine analysis completed');
    
    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-multiple-medicines function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
