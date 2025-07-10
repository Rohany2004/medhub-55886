import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DrugInteraction {
  severity: 'low' | 'moderate' | 'high';
  description: string;
  recommendation: string;
}

interface InteractionResult {
  drug1: string;
  drug2: string;
  interaction: DrugInteraction | null;
}

// Real drug interaction database
const DRUG_INTERACTIONS: Record<string, Record<string, DrugInteraction>> = {
  'warfarin': {
    'aspirin': {
      severity: 'high',
      description: 'Increased risk of bleeding when taken together. Both drugs affect blood clotting.',
      recommendation: 'Consult your doctor immediately. Regular blood monitoring required.'
    },
    'ibuprofen': {
      severity: 'high',
      description: 'NSAIDs can increase bleeding risk when combined with warfarin.',
      recommendation: 'Avoid combination. Use acetaminophen instead for pain relief.'
    },
    'acetaminophen': {
      severity: 'low',
      description: 'Generally safe combination but high doses of acetaminophen may enhance warfarin effect.',
      recommendation: 'Monitor INR levels if using high doses of acetaminophen.'
    }
  },
  'aspirin': {
    'ibuprofen': {
      severity: 'moderate',
      description: 'Both are NSAIDs and may increase risk of stomach bleeding and kidney problems.',
      recommendation: 'Take with food and avoid prolonged combined use. Space doses apart.'
    },
    'clopidogrel': {
      severity: 'moderate',
      description: 'Increased bleeding risk when antiplatelet agents are combined.',
      recommendation: 'Use only under medical supervision with regular monitoring.'
    }
  },
  'metformin': {
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol can increase risk of lactic acidosis with metformin.',
      recommendation: 'Limit alcohol consumption. Avoid binge drinking.'
    }
  },
  'lisinopril': {
    'potassium': {
      severity: 'moderate',
      description: 'ACE inhibitors can increase potassium levels, leading to hyperkalemia.',
      recommendation: 'Monitor potassium levels regularly. Avoid potassium supplements unless prescribed.'
    },
    'ibuprofen': {
      severity: 'moderate',
      description: 'NSAIDs can reduce effectiveness of ACE inhibitors and increase kidney damage risk.',
      recommendation: 'Use acetaminophen instead. Monitor blood pressure and kidney function.'
    }
  },
  'digoxin': {
    'amiodarone': {
      severity: 'high',
      description: 'Amiodarone significantly increases digoxin levels, leading to toxicity.',
      recommendation: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels closely.'
    },
    'verapamil': {
      severity: 'moderate',
      description: 'Calcium channel blockers can increase digoxin levels.',
      recommendation: 'Monitor digoxin levels and adjust dose as needed.'
    }
  },
  'simvastatin': {
    'amlodipine': {
      severity: 'moderate',
      description: 'Amlodipine can increase simvastatin levels, increasing risk of muscle problems.',
      recommendation: 'Limit simvastatin dose to 20mg daily when used with amlodipine.'
    },
    'clarithromycin': {
      severity: 'high',
      description: 'Macrolide antibiotics significantly increase statin levels, causing muscle damage.',
      recommendation: 'Temporarily stop simvastatin during clarithromycin treatment.'
    }
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { medicines } = await req.json();

    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
      return new Response(
        JSON.stringify({ error: 'At least 2 medicines required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const results: InteractionResult[] = [];

    // Check interactions between each pair of medicines
    for (let i = 0; i < medicines.length; i++) {
      for (let j = i + 1; j < medicines.length; j++) {
        const drug1 = medicines[i].toLowerCase().trim();
        const drug2 = medicines[j].toLowerCase().trim();

        let interaction: DrugInteraction | null = null;

        // Check for known interactions in both directions
        if (DRUG_INTERACTIONS[drug1]?.[drug2]) {
          interaction = DRUG_INTERACTIONS[drug1][drug2];
        } else if (DRUG_INTERACTIONS[drug2]?.[drug1]) {
          interaction = DRUG_INTERACTIONS[drug2][drug1];
        } else {
          // Check if medicines exist in our database
          const { data: medicine1 } = await supabase
            .from('indian_medicines')
            .select('name, generic_name, therapeutic_class')
            .ilike('name', `%${drug1}%`)
            .limit(1)
            .single();

          const { data: medicine2 } = await supabase
            .from('indian_medicines')
            .select('name, generic_name, therapeutic_class')
            .ilike('name', `%${drug2}%`)
            .limit(1)
            .single();

          // Check for therapeutic class interactions
          if (medicine1 && medicine2) {
            const class1 = medicine1.therapeutic_class?.toLowerCase();
            const class2 = medicine2.therapeutic_class?.toLowerCase();

            if (class1 && class2) {
              // Same therapeutic class - potential interaction
              if (class1 === class2 && (
                class1.includes('anticoagulant') || 
                class1.includes('nsaid') ||
                class1.includes('beta-blocker') ||
                class1.includes('diuretic')
              )) {
                interaction = {
                  severity: 'moderate',
                  description: `Both medicines belong to the same therapeutic class (${class1}). This may lead to additive effects.`,
                  recommendation: 'Consult your healthcare provider about potential dose adjustments.'
                };
              }
              // Known problematic combinations
              else if (
                (class1.includes('anticoagulant') && class2.includes('nsaid')) ||
                (class1.includes('nsaid') && class2.includes('anticoagulant'))
              ) {
                interaction = {
                  severity: 'high',
                  description: 'Combination of anticoagulants and NSAIDs increases bleeding risk.',
                  recommendation: 'Avoid this combination. Consult your doctor for safer alternatives.'
                };
              }
            }
          }
        }

        results.push({
          drug1: medicines[i],
          drug2: medicines[j],
          interaction
        });
      }
    }

    return new Response(
      JSON.stringify({ results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error checking drug interactions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});