import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { question, reportContext, language = 'en', chatHistory = [] } = await req.json()
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    console.log(`Processing medical chat question in ${language}`)

    // Language-specific system prompts
    const systemPrompts = {
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

      hi: `आप एक सहायक चिकित्सा AI सहायक हैं जो मरीजों को उनकी मेडिकल रिपोर्ट समझाने में विशेषज्ञ हैं। आपकी भूमिका है:

1. चिकित्सा शब्दों और निष्कर्षों की स्पष्ट, सटीक और आश्वस्त करने वाली व्याख्या प्रदान करना
2. उपयोगकर्ता की मेडिकल रिपोर्ट की विशिष्ट सामग्री का संदर्भ देना जब प्रासंगिक हो
3. सरल, मरीज़-अनुकूल भाषा का उपयोग करना
4. हमेशा इस बात पर जोर देना कि यह शैक्षिक जानकारी है, चिकित्सा सलाह नहीं
5. उपयोगकर्ताओं को चिकित्सा निर्णयों के लिए स्वास्थ्य सेवा पेशेवरों से सलाह लेने के लिए प्रोत्साहित करना

महत्वपूर्ण सीमाएं:
- कभी भी विशिष्ट चिकित्सा सलाह न दें या स्थितियों का निदान न करें
- कभी भी दवाओं या उपचारों की सिफारिश न करें
- कभी भी लक्षणों को आपातकाल के रूप में व्याख्या न करें - हमेशा स्वास्थ्य सेवा प्रदाताओं से संपर्क करने की सलाह दें

रिपोर्ट संदर्भ: ${JSON.stringify(reportContext)}`,

      mr: `तुम्ही एक उपयुक्त वैद्यकीय AI सहाय्यक आहात जो रुग्णांना त्यांचे वैद्यकीय अहवाल समजावून सांगण्यात तज्ञ आहात. तुमची भूमिका आहे:

1. वैद्यकीय शब्द आणि निष्कर्षांचे स्पष्ट, अचूक आणि आश्वस्त करणारे स्पष्टीकरण देणे
2. प्रासंगिक असताना वापरकर्त्याच्या वैद्यकीय अहवालातील विशिष्ट मजकूराचा संदर्भ देणे
3. सोपी, रुग्ण-अनुकूल भाषा वापरणे
4. नेहमी या गोष्टीवर भर देणे कि ही शैक्षणिक माहिती आहे, वैद्यकीय सल्ला नाही
5. वैद्यकीय निर्णयांसाठी आरोग्य सेवा व्यावसायिकांशी सल्लामसलत करण्यासाठी वापरकर्त्यांना प्रोत्साहित करणे

महत्त्वाच्या मर्यादा:
- कधीही विशिष्ट वैद्यकीय सल्ला देऊ नका किंवा स्थितींचे निदान करू नका
- कधीही औषधे किंवा उपचारांची शिफारस करू नका
- कधीही लक्षणांचा आणीबाणी म्हणून अर्थ लावू नका - नेहमी आरोग्य सेवा प्रदात्यांशी संपर्क साधण्याचा सल्ला द्या

अहवाल संदर्भ: ${JSON.stringify(reportContext)}`
    }

    const systemPrompt = systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en

    // Build conversation history
    const conversationHistory = [
      { role: "system", content: systemPrompt }
    ]

    // Add chat history
    chatHistory.forEach((msg: any) => {
      conversationHistory.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // Add current question
    conversationHistory.push({
      role: "user",
      content: question
    })

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory.map(msg => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_MEDICAL",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API')
    }

    const answer = data.candidates[0].content.parts[0].text.trim()

    // Add safety disclaimer in appropriate language
    const disclaimers = {
      en: "\n\n⚠️ **Medical Disclaimer**: This information is for educational purposes only and is not intended as medical advice. Please consult your healthcare provider for personalized medical guidance.",
      hi: "\n\n⚠️ **चिकित्सा अस्वीकरण**: यह जानकारी केवल शैक्षिक उद्देश्यों के लिए है और चिकित्सा सलाह के रूप में नहीं है। व्यक्तिगत चिकित्सा मार्गदर्शन के लिए कृपया अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
      mr: "\n\n⚠️ **वैद्यकीय अस्वीकरण**: ही माहिती केवळ शैक्षणिक हेतूंसाठी आहे आणि वैद्यकीय सल्ला म्हणून नाही. वैयक्तिक वैद्यकीय मार्गदर्शनासाठी कृपया तुमच्या आरोग्य सेवा प्रदात्याशी सल्लामसलत करा."
    }

    const disclaimer = disclaimers[language as keyof typeof disclaimers] || disclaimers.en
    const finalAnswer = answer + disclaimer

    console.log('Medical chat response generated successfully')

    return new Response(
      JSON.stringify({ 
        answer: finalAnswer,
        language,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Medical chat error:', error)
    
    // Language-specific error messages
    const errorMessages = {
      en: "I apologize, but I'm unable to process your question at the moment. Please try again or consult your healthcare provider for assistance.",
      hi: "मुझे खेद है, लेकिन मैं इस समय आपके प्रश्न को संसाधित करने में असमर्थ हूं। कृपया फिर से कोशिश करें या सहायता के लिए अपने स्वास्थ्य सेवा प्रदाता से परामर्श करें।",
      mr: "मला माफ करा, परंतु मी सध्या तुमच्या प्रश्नावर प्रक्रिया करू शकत नाही. कृपया पुन्हा प्रयत्न करा किंवा सहाय्यासाठी तुमच्या आरोग्य सेवा प्रदात्याशी सल्लामसलत करा."
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Chat service temporarily unavailable',
        answer: errorMessages.en,
        details: error.message
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