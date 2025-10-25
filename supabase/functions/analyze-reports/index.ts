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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('AI gateway not configured');
    }

    console.log(`Analyzing ${files.length} medical report(s) with Lovable AI gateway...`);

    // Helper to query Lovable AI for a single image
    async function analyzeSingleImage(fileData: string) {
      const instructions = `You are a medical expert AI assistant. First, analyze this document/image to determine if it contains medical reports, lab results, prescriptions, or medical documents.

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
    { "term": "Medical term found in report", "explanation": "Simple explanation for patients" }
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
- Be comprehensive but accessible to non-medical users`;

      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            { role: 'system', content: 'You are a helpful medical expert assistant. Keep answers clear and safe.' },
            {
              role: 'user',
              content: [
                { type: 'text', text: instructions },
                { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${fileData}` } }
              ]
            }
          ]
        }),
      });

      if (!resp.ok) {
        const t = await resp.text();
        console.error('AI gateway error:', resp.status, t);
        if (resp.status === 429) throw new Error('Rate limit exceeded. Please try again shortly.');
        if (resp.status === 402) throw new Error('Payment required. Please add credits to your workspace.');
        throw new Error(`AI gateway error ${resp.status}`);
      }

      const data = await resp.json();
      let textResponse = '';
      try {
        const content = data.choices?.[0]?.message?.content;
        if (typeof content === 'string') {
          textResponse = content;
        } else if (Array.isArray(content)) {
          textResponse = content.map((c: any) => (c?.type === 'text' ? c.text : '')).join('');
        }
      } catch (_) {
        // ignore
      }

      if (textResponse) {
        if (textResponse.includes('NOT_MEDICAL_REPORT')) {
          throw new Error('This is not a medical report. Please upload medical reports, lab results, prescriptions, or other medical documents.');
        }
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (_) {
            // fallthrough
          }
        }
      }
      return null;
    }

    // Process multiple files in parallel
    const analysisPromises = files.map((fileData: string) => analyzeSingleImage(fileData));

    // Wait for all analyses to complete
    const results = await Promise.all(analysisPromises);
    const validResults = results.filter((r) => r !== null);

    if (validResults.length === 0) {
      throw new Error('No valid analysis results from any file');
    }

    // If multiple files, combine the results intelligently
    let combinedAnalysis;
    if (validResults.length === 1) {
      combinedAnalysis = validResults[0];
    } else {
      combinedAnalysis = {
        summary: `Analysis of ${validResults.length} medical documents: ${validResults.map((r: any) => r.summary).join(' | ')}`,
        medical_terms: (validResults as any[]).flatMap((r) => r.medical_terms || []).slice(0, 10),
        diagnosis: [...new Set((validResults as any[]).flatMap((r) => r.diagnosis || []))],
        key_findings: [...new Set((validResults as any[]).flatMap((r) => r.key_findings || []))],
        recommendations: [...new Set((validResults as any[]).flatMap((r) => r.recommendations || []))],
        next_steps: [...new Set((validResults as any[]).flatMap((r) => r.next_steps || []))],
        risk_level: (validResults as any[]).some((r) => r.risk_level === 'high') ? 'high' :
                   (validResults as any[]).some((r) => r.risk_level === 'medium') ? 'medium' : 'low'
      } as any;
    }

    console.log('Medical report analysis completed successfully');

    return new Response(JSON.stringify({ analysis: combinedAnalysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-reports function:', error);

    const msg = (error as any)?.message || 'Unknown error';
    let status = 500;
    if (msg.includes('Rate limit')) status = 429;
    if (msg.includes('Payment required')) status = 402;

    return new Response(JSON.stringify({ error: msg }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
