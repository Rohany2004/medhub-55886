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
    const { medicineName, imageBase64 } = await req.json();
    
    if (!medicineName && !imageBase64) {
      throw new Error('Medicine name or image is required');
    }

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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});