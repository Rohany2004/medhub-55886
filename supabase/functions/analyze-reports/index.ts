
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const body = await req.json();
    const schema = z.object({
      files: z.array(z.string().min(100).max(10000000)).min(1).max(5),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { files } = parsed.data;
    
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    console.log(`Analyzing ${files.length} medical report(s) with Gemini API...`);

    // Process multiple files
    const analysisPromises = files.map(async (fileData: string) => {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: `You are a medical expert AI assistant. First, analyze this document/image to determine if it contains medical reports, lab results, prescriptions, or medical documents.

CRITICAL VALIDATION RULES:
1. If the document/image does NOT contain medical reports, lab results, prescriptions, medical charts, hospital documents, or any medical information, respond with exactly: "NOT_MEDICAL_REPORT"
2. If the document contains random text, personal documents, receipts, or anything non-medical, respond with exactly: "NOT_MEDICAL_REPORT"
3. Only proceed with analysis if the document clearly shows medical reports or medical information

If the document IS a medical report, provide a comprehensive analysis in JSON format:

IMPORTANT INSTRUCTIONS:
1. Extract and interpret all medical information from the document
2. Simplify complex medical terms for patient understanding
3. Identify key findings, diagnoses, and recommendations
4. Assess risk levels based on the findings
5. Provide actionable next steps and recommendations

Required JSON format:
{
  "summary": "Brief overview of the report findings",
  "medical_terms": [
    {
      "term": "Medical term found in report",
      "explanation": "Simple explanation for patients"
    }
  ],
  "diagnosis": ["Primary diagnosis", "Secondary diagnosis"],
  "key_findings": ["Important finding 1", "Important finding 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "next_steps": ["Next step 1", "Next step 2"],
  "risk_level": "low|medium|high|unknown"
}

Guidelines:
- Provide clear, patient-friendly explanations
- Include 3-5 key findings if available
- List 3-4 practical recommendations
- Suggest 2-3 specific next steps
- Assess risk level based on findings
- Explain medical terminology in simple terms
- Be comprehensive but accessible to non-medical users

Analyze the document thoroughly and provide valuable insights that help patients understand their medical reports.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: fileData
                }
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 32,
            topP: 1,
            maxOutputTokens: 3000,
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Error:', response.status, errorText);
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again shortly.');
        }
        if (response.status === 402) {
          throw new Error('Payment required. Please add credits to your workspace.');
        }
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textResponse) {
        // Check if the content is not a medical report
        if (textResponse.includes('NOT_MEDICAL_REPORT')) {
          throw new Error('This is not a medical report. Please upload medical reports, lab results, prescriptions, or other medical documents.');
        }

        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      return null;
    });

    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);
    const validResults = results.filter(result => result !== null);

    if (validResults.length === 0) {
      throw new Error('No valid analysis results from any file');
    }

    // If multiple files, combine the results intelligently
    let combinedAnalysis;
    if (validResults.length === 1) {
      combinedAnalysis = validResults[0];
    } else {
      // Combine multiple analyses
      combinedAnalysis = {
        summary: `Analysis of ${validResults.length} medical documents: ${validResults.map(r => r.summary).join(' | ')}`,
        medical_terms: validResults.flatMap(r => r.medical_terms || []).slice(0, 10),
        diagnosis: [...new Set(validResults.flatMap(r => r.diagnosis || []))],
        key_findings: [...new Set(validResults.flatMap(r => r.key_findings || []))],
        recommendations: [...new Set(validResults.flatMap(r => r.recommendations || []))],
        next_steps: [...new Set(validResults.flatMap(r => r.next_steps || []))],
        risk_level: validResults.some(r => r.risk_level === 'high') ? 'high' : 
                   validResults.some(r => r.risk_level === 'medium') ? 'medium' : 'low'
      };
    }

    console.log('Medical report analysis completed successfully');
    
    return new Response(JSON.stringify({ analysis: combinedAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-reports function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
