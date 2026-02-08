import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod/mod.ts";

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
    const schema = z.object({
      medicineName: z.string().trim().min(1).max(200).optional(),
      imageBase64: z.string().min(100).max(10000000).optional(),
    }).refine((d) => !!d.medicineName || !!d.imageBase64, { message: 'Medicine name or image is required' });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { medicineName, imageBase64 } = parsed.data;

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating medicine details with Lovable AI...');

    const systemPrompt = `You are a medical expert AI. Provide detailed medicine information in JSON format.

Return ONLY valid JSON in this exact schema with no prose before or after:
{
  "medicine_name": "Brand/trade name of the medicine",
  "use_case": "Primary medical conditions this medicine treats (e.g., Pain relief, Antibiotic, Blood pressure)",
  "daily_dosage": "Typical dosage instructions (e.g., 1 tablet twice daily after meals)",
  "manufacturer": "Company/manufacturer name (or 'Various manufacturers' if unknown)",
  "additional_notes": "Important side effects, precautions, or storage instructions"
}

Provide comprehensive and accurate medical information. If analyzing an image, extract visible details. If given only a name, provide general information for that medication.`;

    let messages: any[];
    
    if (imageBase64) {
      // If image is provided, analyze image for medicine details
      messages = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this medicine image and provide detailed information.' },
            { type: 'image_url', image_url: `data:image/jpeg;base64,${imageBase64}` }
          ]
        }
      ];
    } else {
      // If only medicine name is provided, generate details based on name
      messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Provide detailed information for the medicine: ${medicineName}` }
      ];
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway Error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'AI rate limit exceeded. Please wait and try again.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`AI Gateway Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response received');
    
    const textResponse = data.choices?.[0]?.message?.content as string | undefined;
    
    if (textResponse) {
      // Try to extract JSON from the response
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const medicineDetails = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify({ medicineDetails }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }
    
    throw new Error('No valid response from Gemini API');

  } catch (error) {
    console.error('Error in generate-medicine-details function:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
