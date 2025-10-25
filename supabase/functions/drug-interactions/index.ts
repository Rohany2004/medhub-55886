import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod/mod.ts";

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

// Comprehensive drug interaction database covering prescription drugs, OTC, supplements, and dietary factors
const DRUG_INTERACTIONS: Record<string, Record<string, DrugInteraction>> = {
  // PRESCRIPTION MEDICATIONS
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
    'vitamin k': {
      severity: 'high',
      description: 'Vitamin K reduces warfarin effectiveness by promoting blood clotting.',
      recommendation: 'Maintain consistent vitamin K intake. Avoid high-dose supplements.'
    },
    'green leafy vegetables': {
      severity: 'moderate',
      description: 'High vitamin K content in leafy greens can reduce warfarin effectiveness.',
      recommendation: 'Maintain consistent daily intake. Don\'t avoid completely, just be consistent.'
    },
    'alcohol': {
      severity: 'high',
      description: 'Alcohol can enhance warfarin effects and increase bleeding risk.',
      recommendation: 'Limit alcohol intake. Avoid binge drinking completely.'
    },
    'cranberry juice': {
      severity: 'moderate',
      description: 'May enhance warfarin effects and increase bleeding risk.',
      recommendation: 'Avoid large amounts of cranberry juice or supplements.'
    }
  },
  
  'metformin': {
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol can increase risk of lactic acidosis with metformin.',
      recommendation: 'Limit alcohol consumption. Avoid binge drinking.'
    },
    'contrast dye': {
      severity: 'high',
      description: 'IV contrast can cause kidney problems in metformin users.',
      recommendation: 'Stop metformin before contrast procedures. Resume after kidney function check.'
    }
  },
  
  'lisinopril': {
    'potassium supplements': {
      severity: 'moderate',
      description: 'ACE inhibitors can increase potassium levels, leading to hyperkalemia.',
      recommendation: 'Monitor potassium levels regularly. Avoid potassium supplements unless prescribed.'
    },
    'ibuprofen': {
      severity: 'moderate',
      description: 'NSAIDs can reduce effectiveness of ACE inhibitors and increase kidney damage risk.',
      recommendation: 'Use acetaminophen instead. Monitor blood pressure and kidney function.'
    },
    'salt substitutes': {
      severity: 'moderate',
      description: 'Salt substitutes contain potassium which can cause hyperkalemia with ACE inhibitors.',
      recommendation: 'Use regular salt in moderation instead of potassium-based substitutes.'
    }
  },
  
  'digoxin': {
    'amiodarone': {
      severity: 'high',
      description: 'Amiodarone significantly increases digoxin levels, leading to toxicity.',
      recommendation: 'Reduce digoxin dose by 50% when starting amiodarone. Monitor digoxin levels closely.'
    },
    'calcium supplements': {
      severity: 'moderate',
      description: 'High calcium levels can increase digoxin toxicity risk.',
      recommendation: 'Take calcium supplements at different times. Monitor for toxicity symptoms.'
    },
    'magnesium supplements': {
      severity: 'moderate',
      description: 'Low magnesium can increase digoxin toxicity risk.',
      recommendation: 'Maintain adequate magnesium levels but avoid excessive supplementation.'
    }
  },
  
  'levothyroxine': {
    'calcium supplements': {
      severity: 'moderate',
      description: 'Calcium can reduce levothyroxine absorption.',
      recommendation: 'Take calcium 4 hours after levothyroxine.'
    },
    'iron supplements': {
      severity: 'moderate',
      description: 'Iron can reduce levothyroxine absorption.',
      recommendation: 'Take iron 4 hours after levothyroxine.'
    },
    'coffee': {
      severity: 'low',
      description: 'Coffee can reduce levothyroxine absorption.',
      recommendation: 'Take levothyroxine on empty stomach, wait 1 hour before coffee.'
    },
    'soy products': {
      severity: 'moderate',
      description: 'Soy can interfere with levothyroxine absorption.',
      recommendation: 'Take levothyroxine 4 hours before or after soy products.'
    }
  },
  
  // OVER-THE-COUNTER MEDICATIONS
  'aspirin': {
    'ibuprofen': {
      severity: 'moderate',
      description: 'Both are NSAIDs and may increase risk of stomach bleeding and kidney problems.',
      recommendation: 'Take with food and avoid prolonged combined use. Space doses apart.'
    },
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol increases risk of stomach bleeding with aspirin.',
      recommendation: 'Avoid alcohol or limit to minimal amounts when taking aspirin.'
    },
    'vitamin e': {
      severity: 'moderate',
      description: 'High-dose vitamin E can increase bleeding risk with aspirin.',
      recommendation: 'Avoid high-dose vitamin E supplements (>400 IU daily).'
    }
  },
  
  'ibuprofen': {
    'naproxen': {
      severity: 'high',
      description: 'Taking multiple NSAIDs together increases risk of serious side effects.',
      recommendation: 'Never take multiple NSAIDs together. Choose one and use as directed.'
    },
    'alcohol': {
      severity: 'moderate',
      description: 'Alcohol increases risk of stomach bleeding and liver damage with NSAIDs.',
      recommendation: 'Avoid alcohol while taking ibuprofen.'
    },
    'caffeine': {
      severity: 'low',
      description: 'Caffeine may enhance pain relief but can increase side effects.',
      recommendation: 'Monitor for increased side effects like jitteriness or stomach upset.'
    }
  },
  
  'acetaminophen': {
    'alcohol': {
      severity: 'high',
      description: 'Alcohol increases risk of liver damage with acetaminophen.',
      recommendation: 'Avoid alcohol completely when taking acetaminophen, especially with liver disease.'
    },
    'vitamin c': {
      severity: 'low',
      description: 'High-dose vitamin C may reduce acetaminophen effectiveness.',
      recommendation: 'Space vitamin C and acetaminophen doses by 2 hours.'
    }
  },
  
  'diphenhydramine': {
    'alcohol': {
      severity: 'high',
      description: 'Both cause sedation and can lead to dangerous drowsiness.',
      recommendation: 'Never combine alcohol with antihistamines. Risk of severe sedation.'
    },
    'melatonin': {
      severity: 'moderate',
      description: 'Both cause drowsiness and can lead to excessive sedation.',
      recommendation: 'Avoid taking together unless specifically advised by healthcare provider.'
    }
  },
  
  // SUPPLEMENTS
  'vitamin d': {
    'calcium supplements': {
      severity: 'low',
      description: 'Vitamin D enhances calcium absorption, which is beneficial but requires monitoring.',
      recommendation: 'Good combination but monitor total calcium intake to avoid excess.'
    },
    'thiazide diuretics': {
      severity: 'moderate',
      description: 'Both increase calcium levels, risk of hypercalcemia.',
      recommendation: 'Monitor calcium levels regularly if taking both.'
    }
  },
  
  'vitamin k': {
    'antibiotics': {
      severity: 'moderate',
      description: 'Antibiotics can reduce vitamin K production by gut bacteria.',
      recommendation: 'Consider vitamin K supplementation during extended antibiotic use.'
    }
  },
  
  'iron supplements': {
    'tea': {
      severity: 'moderate',
      description: 'Tannins in tea can reduce iron absorption.',
      recommendation: 'Take iron supplements 2 hours before or after drinking tea.'
    },
    'coffee': {
      severity: 'moderate',
      description: 'Coffee can reduce iron absorption.',
      recommendation: 'Take iron supplements 1 hour before or 2 hours after coffee.'
    },
    'zinc supplements': {
      severity: 'moderate',
      description: 'Iron and zinc compete for absorption.',
      recommendation: 'Take iron and zinc supplements at different times of day.'
    },
    'calcium supplements': {
      severity: 'moderate',
      description: 'Calcium can reduce iron absorption.',
      recommendation: 'Take iron and calcium supplements at different meals.'
    }
  },
  
  'magnesium supplements': {
    'antibiotics': {
      severity: 'moderate',
      description: 'Magnesium can reduce absorption of certain antibiotics.',
      recommendation: 'Take magnesium 2 hours before or 6 hours after antibiotics.'
    },
    'calcium supplements': {
      severity: 'low',
      description: 'High doses of calcium can interfere with magnesium absorption.',
      recommendation: 'Take calcium and magnesium at different times or use combination supplement.'
    }
  },
  
  'zinc supplements': {
    'copper supplements': {
      severity: 'moderate',
      description: 'High zinc intake can cause copper deficiency.',
      recommendation: 'If taking high-dose zinc long-term, consider copper supplementation.'
    }
  },
  
  'fish oil': {
    'blood thinners': {
      severity: 'moderate',
      description: 'Fish oil can enhance blood-thinning effects.',
      recommendation: 'Inform healthcare provider about fish oil use if on blood thinners.'
    }
  },
  
  'ginkgo biloba': {
    'blood thinners': {
      severity: 'high',
      description: 'Ginkgo can increase bleeding risk when combined with blood thinners.',
      recommendation: 'Avoid ginkgo if taking blood thinning medications.'
    },
    'aspirin': {
      severity: 'moderate',
      description: 'Both can increase bleeding risk.',
      recommendation: 'Use caution and monitor for unusual bleeding.'
    }
  },
  
  'st johns wort': {
    'birth control pills': {
      severity: 'high',
      description: 'St. John\'s Wort can reduce effectiveness of birth control.',
      recommendation: 'Use additional contraceptive methods if taking St. John\'s Wort.'
    },
    'antidepressants': {
      severity: 'high',
      description: 'Can cause serotonin syndrome when combined with antidepressants.',
      recommendation: 'Never combine with prescription antidepressants without medical supervision.'
    }
  },
  
  'turmeric': {
    'blood thinners': {
      severity: 'moderate',
      description: 'Turmeric can enhance blood-thinning effects.',
      recommendation: 'Use turmeric supplements cautiously if on blood thinners.'
    }
  },
  
  'garlic supplements': {
    'blood thinners': {
      severity: 'moderate',
      description: 'Garlic can enhance blood-thinning effects.',
      recommendation: 'Limit garlic supplements if taking blood thinning medications.'
    }
  },
  
  // DIETARY FACTORS
  'grapefruit': {
    'simvastatin': {
      severity: 'high',
      description: 'Grapefruit can significantly increase statin levels, causing muscle damage.',
      recommendation: 'Avoid grapefruit completely while taking statins.'
    },
    'amlodipine': {
      severity: 'moderate',
      description: 'Grapefruit can increase amlodipine levels causing low blood pressure.',
      recommendation: 'Avoid grapefruit or monitor blood pressure closely.'
    },
    'cyclosporine': {
      severity: 'high',
      description: 'Grapefruit significantly increases cyclosporine levels.',
      recommendation: 'Avoid grapefruit completely while taking cyclosporine.'
    }
  },
  
  'dairy products': {
    'tetracycline': {
      severity: 'high',
      description: 'Calcium in dairy products prevents tetracycline absorption.',
      recommendation: 'Take tetracycline 2 hours before or 6 hours after dairy products.'
    },
    'ciprofloxacin': {
      severity: 'moderate',
      description: 'Calcium can reduce ciprofloxacin absorption.',
      recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after dairy.'
    }
  },
  
  'high fiber foods': {
    'digoxin': {
      severity: 'moderate',
      description: 'High fiber can reduce digoxin absorption.',
      recommendation: 'Maintain consistent fiber intake and take digoxin with low-fiber meals.'
    }
  },
  
  'tyramine rich foods': {
    'maoi antidepressants': {
      severity: 'high',
      description: 'Tyramine can cause dangerous blood pressure spikes with MAOIs.',
      recommendation: 'Avoid aged cheeses, cured meats, fermented foods while on MAOIs.'
    }
  }
};

// Additional interaction categories for broader checking
const DRUG_CATEGORIES: Record<string, string[]> = {
  'nsaids': ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac', 'celecoxib'],
  'blood_thinners': ['warfarin', 'heparin', 'rivaroxaban', 'apixaban', 'dabigatran'],
  'ace_inhibitors': ['lisinopril', 'enalapril', 'captopril', 'ramipril'],
  'statins': ['simvastatin', 'atorvastatin', 'rosuvastatin', 'pravastatin'],
  'beta_blockers': ['metoprolol', 'propranolol', 'atenolol', 'carvedilol'],
  'diuretics': ['furosemide', 'hydrochlorothiazide', 'spironolactone'],
  'antacids': ['aluminum hydroxide', 'magnesium hydroxide', 'calcium carbonate'],
  'antibiotics': ['amoxicillin', 'ciprofloxacin', 'azithromycin', 'doxycycline', 'tetracycline'],
  'antidepressants': ['sertraline', 'fluoxetine', 'escitalopram', 'venlafaxine'],
  'antihistamines': ['diphenhydramine', 'loratadine', 'cetirizine', 'fexofenadine']
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const schema = z.object({ medicines: z.array(z.string().trim().min(1).max(100)).min(2).max(20) });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { medicines } = parsed.data;

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
          // Check category-based interactions
          const checkCategoryInteractions = (drugA: string, drugB: string): DrugInteraction | null => {
            // Find categories for both drugs
            const categoriesA: string[] = [];
            const categoriesB: string[] = [];
            
            for (const [category, drugs] of Object.entries(DRUG_CATEGORIES)) {
              if (drugs.some(drug => drugA.includes(drug) || drug.includes(drugA))) {
                categoriesA.push(category);
              }
              if (drugs.some(drug => drugB.includes(drug) || drug.includes(drugB))) {
                categoriesB.push(category);
              }
            }
            
            // Check for problematic category combinations
            for (const catA of categoriesA) {
              for (const catB of categoriesB) {
                // Multiple NSAIDs
                if (catA === 'nsaids' && catB === 'nsaids' && drugA !== drugB) {
                  return {
                    severity: 'high',
                    description: 'Taking multiple NSAIDs together increases risk of serious gastrointestinal bleeding and kidney damage.',
                    recommendation: 'Never take multiple NSAIDs together. Choose one and use as directed.'
                  };
                }
                
                // NSAIDs + Blood thinners
                if ((catA === 'nsaids' && catB === 'blood_thinners') || 
                    (catA === 'blood_thinners' && catB === 'nsaids')) {
                  return {
                    severity: 'high',
                    description: 'Combination of NSAIDs and blood thinners significantly increases bleeding risk.',
                    recommendation: 'Avoid this combination. Use acetaminophen instead of NSAIDs.'
                  };
                }
                
                // Multiple blood thinners
                if (catA === 'blood_thinners' && catB === 'blood_thinners' && drugA !== drugB) {
                  return {
                    severity: 'high',
                    description: 'Taking multiple blood thinning medications together increases bleeding risk dangerously.',
                    recommendation: 'Only take multiple blood thinners under strict medical supervision.'
                  };
                }
                
                // ACE inhibitors + NSAIDs
                if ((catA === 'ace_inhibitors' && catB === 'nsaids') || 
                    (catA === 'nsaids' && catB === 'ace_inhibitors')) {
                  return {
                    severity: 'moderate',
                    description: 'NSAIDs can reduce effectiveness of ACE inhibitors and increase kidney damage risk.',
                    recommendation: 'Use acetaminophen instead. Monitor blood pressure and kidney function.'
                  };
                }
                
                // Antacids + other medications
                if ((catA === 'antacids' && catB === 'antibiotics') || 
                    (catA === 'antibiotics' && catB === 'antacids')) {
                  return {
                    severity: 'moderate',
                    description: 'Antacids can reduce absorption of antibiotics, making them less effective.',
                    recommendation: 'Take antacids 2 hours before or 6 hours after antibiotics.'
                  };
                }
                
                // Multiple antihistamines
                if (catA === 'antihistamines' && catB === 'antihistamines' && drugA !== drugB) {
                  return {
                    severity: 'moderate',
                    description: 'Taking multiple antihistamines can cause excessive sedation and dry mouth.',
                    recommendation: 'Use only one antihistamine at a time unless directed by healthcare provider.'
                  };
                }
              }
            }
            
            return null;
          };
          
          interaction = checkCategoryInteractions(drug1, drug2);
          
          // If no category interaction found, check database for therapeutic class interactions
          if (!interaction) {
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
                  class1.includes('diuretic') ||
                  class1.includes('statin') ||
                  class1.includes('antidepressant')
                )) {
                  interaction = {
                    severity: 'moderate',
                    description: `Both medicines belong to the same therapeutic class (${class1}). This may lead to additive effects or increased side effects.`,
                    recommendation: 'Consult your healthcare provider about potential dose adjustments or alternative medications.'
                  };
                }
                // Cross-class interactions
                else if (
                  (class1.includes('anticoagulant') && class2.includes('nsaid')) ||
                  (class1.includes('nsaid') && class2.includes('anticoagulant')) ||
                  (class1.includes('anticoagulant') && class2.includes('antiplatelet')) ||
                  (class1.includes('antiplatelet') && class2.includes('anticoagulant'))
                ) {
                  interaction = {
                    severity: 'high',
                    description: 'Combination increases bleeding risk significantly.',
                    recommendation: 'Avoid this combination. Consult your doctor for safer alternatives.'
                  };
                }
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