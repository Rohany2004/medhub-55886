import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { symptoms, age, gender } = await req.json();

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    const prompt = `You are a medical AI assistant. Analyze the following symptoms and provide a structured response. 

Symptoms: ${symptoms}
${age ? `Age: ${age}` : ''}
${gender ? `Gender: ${gender}` : ''}

Please provide a JSON response with the following structure:
{
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "recommendations": "Detailed recommendations for the user",
  "urgencyLevel": "low/medium/high"
}

Important: This is for informational purposes only and should not replace professional medical advice. Base urgency on symptom severity - use "high" for severe or emergency symptoms, "medium" for concerning symptoms that need medical attention soon, and "low" for mild symptoms that can be monitored.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API error:', data);
      throw new Error(`Gemini API error: ${data.error?.message || 'Unknown error'}`);
    }

    const content = data.candidates[0].content.parts[0].text;
    
    // Try to parse JSON from the response
    let analysisResult;
    try {
      // Extract JSON from the response if it's wrapped in markdown
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      analysisResult = JSON.parse(jsonString);
    } catch (parseError) {
      // If parsing fails, create a structured response
      analysisResult = {
        possibleConditions: ["Analysis completed - please consult a healthcare provider"],
        recommendations: content,
        urgencyLevel: "medium"
      };
    }

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in symptom-checker function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      possibleConditions: ["Error analyzing symptoms"],
      recommendations: "Please consult with a healthcare provider for proper diagnosis and treatment.",
      urgencyLevel: "medium"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});