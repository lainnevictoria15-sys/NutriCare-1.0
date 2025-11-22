import React, { useState } from 'react';
import { Recipe } from '../types';
import { ChefHat, Plus, Wand2, Loader2, Search, Flame, Ban, Save } from 'lucide-react';
import { generateRecipe, calculateRecipeCalories } from '../services/geminiService';

interface RecipeManagerProps {
  recipes: Recipe[];
  setRecipes: (recipes: Recipe[]) => void;
}

export const RecipeManager: React.FC<RecipeManagerProps> = ({ recipes, setRecipes }) => {
  const [mode, setMode] = useState<'list' | 'add_manual'>('list');
  const [loading, setLoading] = useState(false);
  const [ingredientsInput, setIngredientsInput] = useState('');
  const [restrictionsInput, setRestrictionsInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [calculating, setCalculating] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState<Partial<Recipe>>({
      title: '',
      ingredients: [],
      instructions: '',
      tags: [],
      calories: 0
  });

  const handleGenerate = async () => {
    if (!ingredientsInput.trim()) return;
    setLoading(true);
    const restr = restrictionsInput.split(',').map(s => s.trim()).filter(s => s);
    const recipe = await generateRecipe(ingredientsInput.split(',').map(s => s.trim()), restr);
    if (recipe) {
      setRecipes([recipe, ...recipes]);
      setIngredientsInput('');
      setRestrictionsInput('');
    }
    setLoading(false);
  };

  const handleAutoCalculate = async () => {
      if (!manualForm.instructions || !manualForm.title) {
          alert("Preencha o título e o modo de preparo primeiro.");
          return;
      }
      setCalculating(true);
      const cals = await calculateRecipeCalories(manualForm.title, manualForm.ingredients || [], manualForm.instructions);
      setManualForm(prev => ({ ...prev, calories: cals }));
      setCalculating(false);
  };

  const handleSaveManual = () => {
      if (!manualForm.title) return;
      const newRecipe: Recipe = {
          id: crypto.randomUUID(),
          title: manualForm.title!,
          ingredients: manualForm.ingredients || [],
          instructions: manualForm.instructions || '',
          tags: manualForm.tags || [],
          calories: Number(manualForm.calories) || 0,
          isManual: true
      };
      setRecipes([newRecipe, ...recipes]);
      setMode('list');
      setManualForm({ title: '', ingredients: [], instructions: '', tags: [], calories: 0 });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto mb-20 md:mb-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Receitas</h1>
        {mode === 'list' && (
            <button onClick={() => setMode('add_manual')} className="bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900">
                <Plus className="w-4 h-4" /> Adicionar Manualmente
            </button>
        )}
      </div>

      {mode === 'add_manual' ? (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto animate-in fade-in">
              <h2 className="text-lg font-semibold mb-4">Nova Receita</h2>
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input placeholder="Título da Receita" className="w-full p-2 border rounded" value={manualForm.title} onChange={e => setManualForm({...manualForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ingredientes (um por linha)</label>
                    <textarea placeholder="Ex: 2 Ovos, 100g Farinha..." className="w-full p-2 border rounded h-24" value={manualForm.ingredients?.join('\n')} onChange={e => setManualForm({...manualForm, ingredients: e.target.value.split('\n')})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Modo de Preparo</label>
                    <textarea placeholder="Descreva o passo a passo..." className="w-full p-2 border rounded h-24" value={manualForm.instructions} onChange={e => setManualForm({...manualForm, instructions: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Calorias (kcal/porção)</label>
                        <div className="flex gap-2">
                            <input type="number" placeholder="0" className="w-full p-2 border rounded" value={manualForm.calories} onChange={e => setManualForm({...manualForm, calories: Number(e.target.value)})} />
                            <button 
                                onClick={handleAutoCalculate} 
                                disabled={calculating}
                                className="bg-orange-100 text-orange-700 px-3 py-2 rounded hover:bg-orange-200 text-xs font-bold flex items-center"
                                title="Calcular automaticamente com IA"
                            >
                                {calculating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Wand2 className="w-4 h-4"/>}
                            </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                        <input placeholder="Ex: Low Carb, Sem Glúten" className="w-full p-2 border rounded" value={manualForm.tags?.join(', ')} onChange={e => setManualForm({...manualForm, tags: e.target.value.split(', ')})} />
                      </div>
                  </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setMode('list')} className="px-4 py-2 text-gray-600">Cancelar</button>
                  <button onClick={handleSaveManual} className="px-4 py-2 bg-emerald-600 text-white rounded">Salvar</button>
              </div>
          </div>
      ) : (
        <>
            {/* Generator */}
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 mb-8">
                <h2 className="text-lg font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                    <Wand2 className="w-5 h-5" /> Criar Nova Receita com IA
                </h2>
                <p className="text-sm text-emerald-600 mb-4">Digite os ingredientes e restrições para gerar uma receita calculada.</p>
                <div className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Ingredientes: Frango, batata doce..." 
                        className="w-full p-3 rounded-lg border-emerald-200 focus:ring-emerald-500 border focus:outline-none"
                        value={ingredientsInput}
                        onChange={(e) => setIngredientsInput(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Restrições: Sem lactose, sem glúten..." 
                            className="flex-1 p-3 rounded-lg border-emerald-200 focus:ring-emerald-500 border focus:outline-none"
                            value={restrictionsInput}
                            onChange={(e) => setRestrictionsInput(e.target.value)}
                        />
                        <button 
                            onClick={handleGenerate}
                            disabled={loading}
                            className="bg-emerald-600 text-white px-6 rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Gerar'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="text"
                    placeholder="Buscar receitas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase())).map(recipe => (
                    <div key={recipe.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden group">
                        {recipe.isManual && <div className="absolute top-0 right-0 bg-gray-100 px-2 py-1 text-[10px] text-gray-500 rounded-bl">Manual</div>}
                        
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-bold text-gray-800 pr-8">{recipe.title}</h3>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-4">
                            {recipe.tags.map((tag, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{tag}</span>
                            ))}
                            {recipe.calories && (
                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Flame className="w-3 h-3" /> {recipe.calories} kcal
                                </span>
                            )}
                            {recipe.restrictions && recipe.restrictions.map((r, i) => (
                                <span key={i} className="text-xs bg-red-50 text-red-500 px-2 py-1 rounded-full flex items-center gap-1">
                                    <Ban className="w-3 h-3" /> {r}
                                </span>
                            ))}
                        </div>

                        <div className="mb-4 flex-grow">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Ingredientes</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                {recipe.ingredients.slice(0, 5).map((ing, i) => (
                                    <li key={i}>{ing}</li>
                                ))}
                                {recipe.ingredients.length > 5 && <li className="text-gray-400 italic">e mais...</li>}
                            </ul>
                        </div>

                        <details className="mt-auto pt-4 border-t border-gray-50">
                            <summary className="text-sm text-emerald-600 font-medium cursor-pointer hover:text-emerald-700">Ver Preparo</summary>
                            <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">{recipe.instructions}</p>
                        </details>
                    </div>
                ))}
            </div>
        </>
      )}
    </div>
  );
};