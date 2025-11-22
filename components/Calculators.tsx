import React, { useState } from 'react';
import { Calculator, Activity, Scale, Ruler } from 'lucide-react';

export const Calculators: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'bmi' | 'calories' | 'anthro'>('bmi');

    // BMI State
    const [bmiData, setBmiData] = useState({ weight: 0, height: 0 });
    const [bmiResult, setBmiResult] = useState<number | null>(null);

    // Calories State
    const [calData, setCalData] = useState({ weight: 0, height: 0, age: 0, gender: 'male', activity: 1.2 });
    const [calResult, setCalResult] = useState<{bmr: number, tdee: number} | null>(null);

    // Anthropometry State (CB/DCT)
    const [anthroData, setAnthroData] = useState({ cb: 0, dct: 0 }); // CB (cm), DCT (mm)
    const [anthroResult, setAnthroResult] = useState<{cmb: number, status: string} | null>(null);

    const calculateBMI = () => {
        if (bmiData.height > 0) {
            const hM = bmiData.height / 100;
            setBmiResult(bmiData.weight / (hM * hM));
        }
    };

    const calculateCalories = () => {
        // Harris-Benedict
        let bmr = 0;
        if (calData.gender === 'male') {
            bmr = 88.362 + (13.397 * calData.weight) + (4.799 * calData.height) - (5.677 * calData.age);
        } else {
            bmr = 447.593 + (9.247 * calData.weight) + (3.098 * calData.height) - (4.330 * calData.age);
        }
        setCalResult({ bmr, tdee: bmr * calData.activity });
    };

    const calculateAnthro = () => {
        // CMB = CB (cm) - 0.314 * DCT (mm)
        if (anthroData.cb === 0) return;
        const cmb = anthroData.cb - (0.314 * anthroData.dct);
        
        // Simplified Status interpretation (General Reference)
        let status = 'Normal';
        if (cmb < 22) status = 'Depleção Muscular Leve';
        if (cmb < 19) status = 'Depleção Muscular Moderada/Grave';
        if (cmb > 30) status = 'Musculatura Preservada/Alta';

        setAnthroResult({ cmb, status });
    };

    return (
        <div className="p-6 max-w-4xl mx-auto mb-20 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Calculadoras Nutricionais</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-200 overflow-x-auto">
                    <button onClick={() => setActiveTab('bmi')} className={`flex-1 py-4 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'bmi' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                        IMC
                    </button>
                    <button onClick={() => setActiveTab('calories')} className={`flex-1 py-4 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'calories' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                        Gasto Calórico
                    </button>
                    <button onClick={() => setActiveTab('anthro')} className={`flex-1 py-4 px-4 text-sm font-medium whitespace-nowrap ${activeTab === 'anthro' ? 'bg-emerald-50 text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:bg-gray-50'}`}>
                        Antropometria (CB/DCT)
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === 'bmi' && (
                        <div className="max-w-md mx-auto space-y-4 animate-in fade-in">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><Scale className="w-5 h-5"/> Índice de Massa Corporal</h2>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Peso (kg)</label>
                                <input type="number" className="w-full p-2 border rounded" value={bmiData.weight} onChange={e => setBmiData({...bmiData, weight: Number(e.target.value)})} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Altura (cm)</label>
                                <input type="number" className="w-full p-2 border rounded" value={bmiData.height} onChange={e => setBmiData({...bmiData, height: Number(e.target.value)})} />
                            </div>
                            <button onClick={calculateBMI} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Calcular</button>
                            
                            {bmiResult !== null && (
                                <div className="mt-6 text-center p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-500">Seu IMC é</p>
                                    <p className="text-3xl font-bold text-emerald-600">{bmiResult.toFixed(2)}</p>
                                    <p className="text-sm font-medium mt-2">
                                        {bmiResult < 18.5 ? 'Abaixo do peso' : bmiResult < 24.9 ? 'Peso normal' : bmiResult < 29.9 ? 'Sobrepeso' : 'Obesidade'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'calories' && (
                        <div className="max-w-md mx-auto space-y-4 animate-in fade-in">
                             <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><Activity className="w-5 h-5"/> Taxa Metabólica & TDEE</h2>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Peso (kg)</label>
                                    <input type="number" className="w-full p-2 border rounded" value={calData.weight} onChange={e => setCalData({...calData, weight: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Altura (cm)</label>
                                    <input type="number" className="w-full p-2 border rounded" value={calData.height} onChange={e => setCalData({...calData, height: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Idade</label>
                                    <input type="number" className="w-full p-2 border rounded" value={calData.age} onChange={e => setCalData({...calData, age: Number(e.target.value)})} />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-600 mb-1">Sexo</label>
                                    <select className="w-full p-2 border rounded" value={calData.gender} onChange={e => setCalData({...calData, gender: e.target.value})}>
                                        <option value="male">Masculino</option>
                                        <option value="female">Feminino</option>
                                    </select>
                                </div>
                             </div>
                             <div>
                                <label className="block text-sm text-gray-600 mb-1">Nível de Atividade</label>
                                <select className="w-full p-2 border rounded" value={calData.activity} onChange={e => setCalData({...calData, activity: Number(e.target.value)})}>
                                    <option value="1.2">Sedentário (Pouco ou nenhum exercício)</option>
                                    <option value="1.375">Levemente ativo (1-3 dias/semana)</option>
                                    <option value="1.55">Moderadamente ativo (3-5 dias/semana)</option>
                                    <option value="1.725">Muito ativo (6-7 dias/semana)</option>
                                </select>
                             </div>
                             <button onClick={calculateCalories} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Calcular</button>

                             {calResult && (
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-xs text-blue-600 uppercase font-bold">Metabolismo Basal</p>
                                        <p className="text-xl font-bold text-gray-800">{Math.round(calResult.bmr)} kcal</p>
                                    </div>
                                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                                        <p className="text-xs text-emerald-600 uppercase font-bold">Gasto Total (TDEE)</p>
                                        <p className="text-xl font-bold text-gray-800">{Math.round(calResult.tdee)} kcal</p>
                                    </div>
                                </div>
                             )}
                        </div>
                    )}

                    {activeTab === 'anthro' && (
                         <div className="max-w-md mx-auto space-y-4 animate-in fade-in">
                            <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2"><Ruler className="w-5 h-5"/> Circunferência Muscular do Braço</h2>
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm text-gray-600 mb-1">CB (cm)</label>
                                     <input type="number" placeholder="Circunf. Braço" className="w-full p-2 border rounded" value={anthroData.cb} onChange={e => setAnthroData({...anthroData, cb: Number(e.target.value)})} />
                                 </div>
                                 <div>
                                     <label className="block text-sm text-gray-600 mb-1">DCT (mm)</label>
                                     <input type="number" placeholder="Dobra C. Triciptal" className="w-full p-2 border rounded" value={anthroData.dct} onChange={e => setAnthroData({...anthroData, dct: Number(e.target.value)})} />
                                 </div>
                             </div>
                             <button onClick={calculateAnthro} className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Calcular CMB</button>

                             {anthroResult !== null && (
                                <div className="mt-6 text-center p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-purple-700 uppercase font-bold">CMB (Estimativa)</p>
                                    <p className="text-3xl font-bold text-purple-900">{anthroResult.cmb.toFixed(1)} cm</p>
                                    <p className="text-sm mt-2 text-purple-600">Status Aproximado: {anthroResult.status}</p>
                                </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">Fórmula: CMB = CB - (0.314 x DCT)</p>
                         </div>
                    )}
                </div>
            </div>
        </div>
    );
};