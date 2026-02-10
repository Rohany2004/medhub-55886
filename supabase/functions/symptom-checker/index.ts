import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symptoms, age, gender } = await req.json();

    if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid input: symptoms required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      console.error('AI gateway error:', response.status);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let analysisResult;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content;
      analysisResult = JSON.parse(jsonString);
    } catch {
      analysisResult = {
        possibleConditions: ["Analysis completed - please consult a healthcare provider"],
        recommendations: content,
        urgencyLevel: "medium"
      };
    }

    console.log('Symptom analysis completed successfully');
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in symptom-checker:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: msg,
      possibleConditions: ["Error analyzing symptoms"],
      recommendations: "Please consult with a healthcare provider for proper diagnosis and treatment.",
      urgencyLevel: "medium"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
