import { GoogleGenAI, Type } from "@google/genai";
import { Anamnesis, Patient, DietPlan, Recipe } from "../types";

// NOTE: In a real production app, never expose keys on the client. 
// This is for the specific requirement context where process.env.API_KEY is assumed.
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

// Função de Limpeza e Segurança (Sanitização)
// Corrige alucinações comuns da IA, como porções de "1g"
const sanitizeDietPlan = (plan: any): any => {
  const smallPortionBlacklist = ['sal', 'azeite', 'óleo', 'vinagre', 'pimenta', 'açúcar', 'adoçante', 'canela', 'orégano', 'manteiga'];

  if (plan.weeks && Array.isArray(plan.weeks)) {
    plan.weeks.forEach((day: any) => {
      if (day.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal: any) => {
          if (meal.items && Array.isArray(meal.items)) {
            meal.items.forEach((item: any) => {
              // Forçar conversão para número para verificação
              let qtd = parseFloat(item.portion);
              const unit = item.unit ? item.unit.toLowerCase() : '';
              const food = item.food ? item.food.toLowerCase() : '';

              // Se for NaN (ex: "à vontade"), ignora
              if (isNaN(qtd)) return;

              const isSmallItem = smallPortionBlacklist.some(s => food.includes(s));

              // Regra: Se for 'g' e < 10, e NÃO for tempero -> Transforma em 100g
              if (unit === 'g' && qtd < 10 && !isSmallItem) {
                item.portion = '100';
              }
              
              // Regra: Se for 'ml' e < 10, e NÃO for tempero -> Transforma em 200ml
              if (unit === 'ml' && qtd < 10 && !isSmallItem) {
                item.portion = '200';
              }

              // Regra de Ouro: Se for exatamente "1" "g" ou "1" "ml", corrige.
              if ((unit === 'g' || unit === 'ml') && qtd === 1 && !isSmallItem) {
                  item.portion = unit === 'ml' ? '200' : '100';
              }
            });
          }
        });
      }
    });
  }
  return plan;
};

export const generateDietPlan = async (patient: Patient, anamnesis: Anamnesis): Promise<DietPlan | null> => {
  const ai = getAIClient();
  
  const prompt = `
    ROLE: Senior Clinical Nutritionist.
    TASK: Create a detailed weekly meal plan (7 days) for a patient.

    PATIENT DATA:
    - Name: ${patient.fullName}
    - Age: ${patient.age}
    - Goal: ${anamnesis.goals.join(", ")}
    - Clinical Status: ${anamnesis.clinicalStatus.join(", ")}
    - Financial Status: ${anamnesis.financialStatus}
    - Restrictions: ${anamnesis.foodRestrictions.join(", ")}
    - Preferences: ${anamnesis.foodPreferences.join(", ")}
    - Diet Type: ${anamnesis.dietType}
    - Meals per day: ${anamnesis.mealsPerDay}
    - Liquid needs: ${anamnesis.liquidRequirement}ml
    
    CRITICAL RULES:
    1. **NO UNREALISTIC PORTIONS**: DO NOT output "1g" or "1ml" for foods like Rice, Beans, Meat, Fruits. Use standard portions (100g, 150g, 200ml).
    2. **VARIETY**: Do not repeat the exact same lunch every day unless requested.
    3. **CONTEXT**: If patient is "Acamado", suggest appropriate textures.
    4. **MACROS**: Estimate daily macros.

    OUTPUT FORMAT: JSON matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weeks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayOfWeek: { type: Type.STRING },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        time: { type: Type.STRING },
                        items: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              food: { type: Type.STRING },
                              portion: { type: Type.STRING },
                              unit: { type: Type.STRING },
                              calories: { type: Type.NUMBER }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            notes: { type: Type.STRING },
            explanation: { type: Type.STRING },
            macros: {
                type: Type.OBJECT,
                properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fats: { type: Type.NUMBER }
                }
            }
          }
        }
      }
    });

    if (response.text) {
      let data = JSON.parse(response.text);
      // APLICAR SANITIZAÇÃO AQUI
      data = sanitizeDietPlan(data);

      return {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        weeks: data.weeks,
        notes: data.notes,
        explanation: data.explanation,
        macros: data.macros
      };
    }
    return null;
  } catch (error) {
    console.error("Error generating diet:", error);
    throw error;
  }
};

export const analyzeDietPlan = async (plan: DietPlan, anamnesis: Anamnesis): Promise<{explanation: string, macros: any} | null> => {
    const ai = getAIClient();
    const prompt = `
      ACT AS: Senior Nutritionist.
      TASK: Analyze the following meal plan JSON (which may have been manually written by a user).

      1. **CALCULATE MACROS**: Look at the foods, portions and units provided in the JSON. Estimate the TOTAL DAILY AVERAGE for:
         - Calories (kcal)
         - Protein (g)
         - Carbs (g)
         - Fats (g)
         (Be precise based on standard nutritional tables like TACO/USDA).

      2. **JUSTIFICATION**: Write a professional justification for this diet considering the patient's goals: ${anamnesis.goals.join(", ")} and status: ${anamnesis.clinicalStatus.join(", ")}.

      PLAN DATA: ${JSON.stringify(plan.weeks)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        explanation: { type: Type.STRING },
                        macros: {
                            type: Type.OBJECT,
                            properties: {
                                calories: { type: Type.NUMBER },
                                protein: { type: Type.NUMBER },
                                carbs: { type: Type.NUMBER },
                                fats: { type: Type.NUMBER }
                            }
                        }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return null;
    } catch (error) {
        console.error("Error analyzing diet", error);
        return null;
    }
};

export const suggestFoods = async (anamnesis: Anamnesis): Promise<{food: string, reason: string}[]> => {
  const ai = getAIClient();
  
  const prompt = `
    Sugira 15 alimentos específicos ideais para um paciente com as seguintes características:
    Objetivos: ${anamnesis.goals.join(", ")}
    Status: ${anamnesis.clinicalStatus.join(", ")}
    Restrições: ${anamnesis.foodRestrictions.join(", ")}
    
    Retorne uma lista JSON com nome do alimento e uma breve razão.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { 
              type: Type.OBJECT,
              properties: {
                  food: { type: Type.STRING },
                  reason: { type: Type.STRING }
              }
           }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return [];
  } catch (error) {
    console.error("Error suggesting foods:", error);
    return [];
  }
};

export const generateRecipe = async (ingredients: string[], restrictions: string[]): Promise<Recipe | null> => {
  const ai = getAIClient();
  const prompt = `
    Crie uma receita nutritiva usando alguns destes ingredientes: ${ingredients.join(", ")}.
    Considere estas restrições/preferências: ${restrictions.join(", ")}.
    Calcule as calorias aproximadas por porção.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            calories: { type: Type.NUMBER }
          }
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: crypto.randomUUID(),
        restrictions: restrictions,
        ...data
      };
    }
    return null;
  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
};

export const calculateRecipeCalories = async (title: string, ingredients: string[], instructions: string): Promise<number> => {
    const ai = getAIClient();
    const prompt = `
        Calcule o valor calórico TOTAL aproximado (em kcal) por porção para esta receita. Retorne apenas o número.
        Receita: ${title}
        Ingredientes: ${ingredients.join(", ")}
        Preparo: ${instructions}
    `;
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        calories: { type: Type.NUMBER }
                    }
                }
            }
        });
        if (response.text) return JSON.parse(response.text).calories;
        return 0;
    } catch (e) { return 0; }
};