import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { z } from "https://deno.land/x/zod/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const schema = z.discriminatedUnion('contentType', [
      z.object({ contentType: z.literal('text'), content: z.string().trim().min(1).max(5000), targetLanguage: z.enum(['hi','mr']) }),
      z.object({ contentType: z.literal('analysis'), content: z.record(z.any()), targetLanguage: z.enum(['hi','mr']) })
    ])
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { content, targetLanguage, contentType } = parsed.data
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    console.log(`Translating ${contentType} content to ${targetLanguage}`)

    // Create language-specific prompts for medical translation
    const languagePrompts = {
      hi: "Translate the following medical content to Hindi (हिन्दी). Maintain medical accuracy and use appropriate medical terminology in Hindi. Keep the structure and formatting intact.",
      mr: "Translate the following medical content to Marathi (मराठी). Maintain medical accuracy and use appropriate medical terminology in Marathi. Keep the structure and formatting intact."
    }

    const prompt = languagePrompts[targetLanguage as keyof typeof languagePrompts]
    
    if (!prompt) {
      throw new Error(`Unsupported target language: ${targetLanguage}`)
    }

    let translationPrompt = ""
    
    if (contentType === 'analysis') {
      // Handle full report analysis translation
      translationPrompt = `${prompt}

Medical Report Analysis to translate:
${JSON.stringify(content, null, 2)}

Please return ONLY a valid JSON object with the same structure, but with all text content translated to ${targetLanguage}. Do not include any explanatory text, just the JSON.`
    } else {
      // Handle simple text translation
      translationPrompt = `${prompt}

Text to translate: "${content}"

Please return only the translated text without any additional formatting or explanations.`
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: translationPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,
        }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    let translatedContent = data.candidates[0].content.parts[0].text.trim()

    // If it's an analysis object, try to parse as JSON
    if (contentType === 'analysis') {
      try {
        // Clean up the response to extract JSON
        const jsonMatch = translatedContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          translatedContent = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('No valid JSON found in translation response')
        }
      } catch (parseError) {
        console.error('Failed to parse translated JSON:', parseError)
        throw new Error('Failed to parse translated content as JSON')
      }
    }

    console.log('Translation completed successfully')

    return new Response(
      JSON.stringify({ 
        translatedContent,
        sourceLanguage: 'en',
        targetLanguage,
        contentType
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Translation error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Translation failed', 
        details: error.message,
        fallback: "Translation service temporarily unavailable. Showing original content."
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})