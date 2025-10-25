import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log('Generating medicine details with Gemini API...');

    let prompt = '';
    let requestBody: any = {
      contents: [{
        parts: []
      }],
      generationConfig: {
        temperature: 0.3,
        topK: 32,
        topP: 1,
        maxOutputTokens: 1024,
      }
    };

    if (imageBase64) {
      // If image is provided, analyze image for medicine details
      prompt = `You are a medical expert AI. Analyze this medicine image and provide detailed information in JSON format.

Required JSON format:
{
  "medicine_name": "Brand/trade name of the medicine",
  "use_case": "Primary medical conditions this medicine treats (e.g., Pain relief, Antibiotic, Blood pressure)",
  "daily_dosage": "Typical dosage instructions (e.g., 1 tablet twice daily after meals)",
  "manufacturer": "Company/manufacturer name",
  "additional_notes": "Important side effects, precautions, or storage instructions"
}

Provide comprehensive and accurate medical information based on the image.`;

      requestBody.contents[0].parts = [
        { text: prompt },
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBase64
          }
        }
      ];
    } else {
      // If only medicine name is provided, generate details based on name
      prompt = `You are a medical expert AI. Based on the medicine name "${medicineName}", provide detailed information in JSON format.

Required JSON format:
{
  "medicine_name": "${medicineName}",
  "use_case": "Primary medical conditions this medicine treats (e.g., Pain relief, Antibiotic, Blood pressure)",
  "daily_dosage": "Typical dosage instructions (e.g., 1 tablet twice daily after meals)",
  "manufacturer": "Common manufacturer name (if known, otherwise 'Various manufacturers')",
  "additional_notes": "Important side effects, precautions, or storage instructions"
}

Provide comprehensive and accurate medical information. If you're not certain about specific details, provide general information for that type of medication.`;

      requestBody.contents[0].parts = [{ text: prompt }];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');
    
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
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