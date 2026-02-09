import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const schema = z.object({
      question: z.string().trim().min(1).max(2000),
      reportContext: z.any().optional(),
      language: z.enum(['en','hi','mr']).default('en'),
      chatHistory: z.array(z.object({ role: z.enum(['user','assistant']), content: z.string().trim().max(2000) })).max(20).default([]),
    })
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { question, reportContext, language, chatHistory } = parsed.data

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured')
    }

    console.log(`Processing medical chat question in ${language}`)

    const systemPrompts: Record<string, string> = {
      en: `You are a helpful medical AI assistant specialized in explaining medical reports to patients. Your role is to:
1. Provide clear, accurate, and reassuring explanations of medical terms and findings
2. Reference specific content from the user's medical report when relevant
3. Use simple, patient-friendly language
4. Always emphasize that this is educational information, not medical advice
5. Encourage users to consult healthcare professionals for medical decisions

IMPORTANT LIMITATIONS:
- Never provide specific medical advice or diagnose conditions
- Never recommend medications or treatments
- Never interpret symptoms as emergencies - always refer to healthcare providers
- Always include appropriate disclaimers about seeking professional medical advice

Report Context: ${JSON.stringify(reportContext)}`,

      hi: `आप एक सहायक चिकित्सा AI सहायक हैं जो मरीजों को उनकी मेडिकल रिपोर्ट समझाने में विशेषज्ञ हैं। रिपोर्ट संदर्भ: ${JSON.stringify(reportContext)}`,

      mr: `तुम्ही एक उपयुक्त वैद्यकीय AI सहाय्यक आहात जो रुग्णांना त्यांचे वैद्यकीय अहवाल समजावून सांगण्यात तज्ञ आहात. अहवाल संदर्भ: ${JSON.stringify(reportContext)}`
    }

    const systemPrompt = systemPrompts[language] || systemPrompts.en

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatHistory.map((msg: any) => ({
        role: msg.role as string,
        content: msg.content as string
      })),
      { role: "user", content: question }
    ]

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      throw new Error(`AI gateway error: ${response.status}`)
    }

    const data = await response.json()
    const answer = data.choices?.[0]?.message?.content?.trim()

    if (!answer) {
      throw new Error('Invalid response from AI gateway')
    }

    const disclaimers: Record<string, string> = {
      en: "\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only and is not intended as medical advice. Please consult your healthcare provider for personalized medical guidance.",
      hi: "\n\n⚠️ **चिकित्सा अस्वीकरण**: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है। कृपया अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
      mr: "\n\n⚠️ **वैद्यकीय अस्वीकरण**: ही माहिती केवळ शैक्षणिक हेतूंसाठी आहे. कृपया तुमच्या आरोग्य सेवा प्रदात्याशी सल्लामसलत करा."
    }

    const finalAnswer = answer + (disclaimers[language] || disclaimers.en)

    console.log('Medical chat response generated successfully')

    return new Response(
      JSON.stringify({ answer: finalAnswer, language, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Medical chat error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    
    return new Response(
      JSON.stringify({ 
        error: 'Chat service temporarily unavailable',
        answer: "I apologize, but I'm unable to process your question at the moment. Please try again or consult your healthcare provider for assistance.",
        details: msg
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
