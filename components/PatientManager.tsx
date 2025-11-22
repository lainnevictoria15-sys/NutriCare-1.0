import React, { useState, useEffect } from 'react';
import { Patient, Gender, PatientStatus, Anamnesis, DietPlan, Meal } from '../types';
import { Plus, Search, ChevronLeft, Save, User, FileText, Utensils, Wand2, Loader2, Trash2, Edit3, X, FileDown, Calculator, Lightbulb, AlertTriangle } from 'lucide-react';
import { generateDietPlan, suggestFoods, analyzeDietPlan } from '../services/geminiService';

interface PatientManagerProps {
  patients: Patient[];
  setPatients: (patients: Patient[]) => void;
  initialFilter?: string;
}

// Pre-defined units for dropdown
const UNITS = ['g', 'ml', 'kg', 'l', 'colher(es) sopa', 'colher(es) chá', 'xícara(s)', 'fatia(s)', 'unidade(s)', 'à vontade'];
// Common foods for datalist suggestion
const COMMON_FOODS = ['Arroz Integral', 'Feijão', 'Frango Grelhado', 'Ovo Cozido', 'Salada de Folhas', 'Azeite de Oliva', 'Maçã', 'Banana', 'Aveia', 'Iogurte Natural', 'Castanhas', 'Peixe Assado', 'Batata Doce', 'Brócolis', 'Cenoura'];

const emptyPatient: Patient = {
  id: '',
  fullName: '',
  dob: '',
  age: 0,
  gender: Gender.Other,
  contact: { email: '', phone: '', address: '', city: '', livingArrangement: '' },
  initialContact: { notes: '', pricingAgreed: '', paymentMethod: '', nfcGenerated: false, date: new Date().toISOString().split('T')[0] }
};

const emptyAnamnesis: Anamnesis = {
  date: new Date().toISOString().split('T')[0],
  weight: 0,
  height: 0,
  bodyDistribution: '',
  ageAssessment: '',
  clinicalStatus: [PatientStatus.Active],
  mobilityNotes: '',
  financialStatus: 'Médio',
  foodRestrictions: [],
  foodPreferences: [],
  dietType: 'Natural',
  goals: [],
  liquidRequirement: 2000,
  mealsPerDay: 3,
  mealScheduleNotes: ''
};

const blankDiet: DietPlan = {
    id: '',
    createdAt: '',
    notes: '',
    explanation: '',
    weeks: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'].map(day => ({
        dayOfWeek: day,
        meals: [
            { name: 'Café da Manhã', time: '08:00', items: [{ food: '', portion: '1', unit: 'unidade(s)' }] },
            { name: 'Almoço', time: '12:00', items: [{ food: '', portion: '100', unit: 'g' }] },
            { name: 'Jantar', time: '19:00', items: [{ food: '', portion: '100', unit: 'g' }] }
        ]
    }))
};

export const PatientManager: React.FC<PatientManagerProps> = ({ patients, setPatients, initialFilter }) => {
  const [mode, setMode] = useState<'list' | 'add' | 'view'>('list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Patient>(emptyPatient);
  const [anamnesisData, setAnamnesisData] = useState<Anamnesis>(emptyAnamnesis);
  const [activeTab, setActiveTab] = useState<'info' | 'anamnesis' | 'diet'>('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [suggestedFoods, setSuggestedFoods] = useState<{food: string, reason: string}[]>([]);
  
  const [isEditingDiet, setIsEditingDiet] = useState(false);
  const [dietFormData, setDietFormData] = useState<DietPlan | null>(null);
  
  // Custom Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const currentPatient = patients.find(p => p.id === selectedPatientId);

  useEffect(() => {
      if (initialFilter === 'attention') {
          setSearchTerm('');
      }
  }, [initialFilter]);

  useEffect(() => {
    if (mode === 'add') {
      setFormData({ ...emptyPatient, id: crypto.randomUUID() });
      setAnamnesisData(emptyAnamnesis);
      setDietFormData(null);
    } else if (mode === 'view' && currentPatient) {
      setFormData(currentPatient);
      setAnamnesisData(currentPatient.anamnesis || emptyAnamnesis);
      setDietFormData(currentPatient.currentDietPlan || null);
      setSuggestedFoods([]);
      setIsEditingDiet(false);
    }
  }, [mode, currentPatient, selectedPatientId]);

  // Auto-calculate age when DOB changes
  useEffect(() => {
      if (formData.dob) {
          const today = new Date();
          const birthDate = new Date(formData.dob);
          let age = today.getFullYear() - birthDate.getFullYear();
          const m = today.getMonth() - birthDate.getMonth();
          if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
              age--;
          }
          setFormData(prev => ({ ...prev, age }));
      }
  }, [formData.dob]);

  const handleSavePatient = () => {
    const updatedPatient: Patient = {
        ...formData,
        anamnesis: anamnesisData,
        currentDietPlan: dietFormData || undefined,
    };

    let newPatients;
    if (mode === 'add') {
      newPatients = [...patients, updatedPatient];
    } else {
      newPatients = patients.map(p => p.id === updatedPatient.id ? updatedPatient : p);
    }
    setPatients(newPatients);
    setMode('list');
  };

  // Initial Trigger for Delete (Opens Modal)
  const confirmDelete = () => {
      setShowDeleteModal(true);
  };

  // Actual Delete Action
  const executeDelete = () => {
      if (!selectedPatientId) return;

      // 1. Update Global State (Filter out patient)
      const updatedList = patients.filter(p => p.id !== selectedPatientId);
      setPatients(updatedList);

      // 2. Reset UI State
      setShowDeleteModal(false);
      setSelectedPatientId(null);
      setMode('list');
  };

  // AI Diet Handlers
  const handleGenerateDiet = async () => {
    if (!currentPatient && mode !== 'add') return;
    setLoadingAI(true);
    try {
      const plan = await generateDietPlan(formData, anamnesisData);
      if (plan) {
        setDietFormData(plan);
        setIsEditingDiet(true);
      }
    } catch (e) {
      alert("Erro ao gerar dieta com IA.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAnalyzeDiet = async () => {
      if (!dietFormData) return;
      setLoadingAI(true);
      try {
          const analysis = await analyzeDietPlan(dietFormData, anamnesisData);
          if (analysis) {
              setDietFormData({
                  ...dietFormData,
                  explanation: analysis.explanation,
                  macros: analysis.macros
              });
          }
      } catch (e) {
          alert("Erro ao analisar dieta.");
      } finally {
          setLoadingAI(false);
      }
  };

  const handleCreateManualDiet = () => {
      const newPlan = {
          ...blankDiet,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
      };
      setDietFormData(newPlan);
      setIsEditingDiet(true);
  };

  const handleSuggestFoods = async () => {
      setLoadingAI(true);
      const foods = await suggestFoods(anamnesisData);
      setSuggestedFoods(foods);
      setLoadingAI(false);
  };

  const printDiet = () => {
      window.print();
  };

  // Function to generate and download Word doc
  const handleExportWord = () => {
      if (!dietFormData) return;

      const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Plano Alimentar - ${formData.fullName}</title>
      <style>
        body { font-family: 'Arial', sans-serif; font-size: 12pt; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; }
        th { background-color: #e6f7ed; color: #065f46; font-weight: bold; }
        h1 { color: #065f46; font-size: 18pt; border-bottom: 2px solid #065f46; padding-bottom: 10px; }
        h2 { color: #065f46; font-size: 16pt; margin-top: 20px; }
        h3 { color: #047857; font-size: 14pt; margin-top: 15px; background-color: #f0fdf4; padding: 5px; }
        .macro-box { border: 1px solid #059669; padding: 10px; background-color: #ecfdf5; margin-bottom: 20px; }
        .justification { border: 1px solid #3b82f6; padding: 10px; background-color: #eff6ff; margin-bottom: 20px; }
      </style>
      </head><body>`;
      
      let content = `
        <h1>Plano Alimentar: ${formData.fullName}</h1>
        <p><strong>Idade:</strong> ${formData.age} | <strong>Data:</strong> ${new Date().toLocaleDateString()}</p>
        <hr/>
      `;

      if (dietFormData.macros) {
        content += `
          <div class="macro-box">
            <h3>Estimativa Diária (Macros)</h3>
            <p><strong>Calorias:</strong> ${dietFormData.macros.calories} kcal &nbsp;|&nbsp; 
               <strong>Proteína:</strong> ${dietFormData.macros.protein} g &nbsp;|&nbsp; 
               <strong>Carbo:</strong> ${dietFormData.macros.carbs} g &nbsp;|&nbsp; 
               <strong>Gordura:</strong> ${dietFormData.macros.fats} g</p>
          </div>
        `;
      }

      if (dietFormData.explanation) {
          content += `<div class="justification">
            <h3 style="background-color: #eff6ff; color: #1d4ed8;">Justificativa Clínica</h3>
            <p>${dietFormData.explanation}</p>
          </div>`;
      }

      dietFormData.weeks.forEach(day => {
          content += `<h3>${day.dayOfWeek}</h3>`;
          content += `<table><thead><tr><th style="width: 20%">Refeição / Horário</th><th>Alimentos</th></tr></thead><tbody>`;
          day.meals.forEach(meal => {
              const items = meal.items.map(i => `• ${i.food} (<strong>${i.portion} ${i.unit || ''}</strong>)`).join('<br/>');
              content += `<tr><td valign="top"><strong>${meal.name}</strong><br/><span style="font-size: 0.8em; color: #666;">${meal.time}</span></td><td valign="top">${items}</td></tr>`;
          });
          content += `</tbody></table>`;
      });

      const footer = `</body></html>`;
      const html = header + content + footer;

      const blob = new Blob(['\ufeff', html], {
          type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Plano_Alimentar_${formData.fullName.replace(/\s+/g, '_')}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  // Status Helper
  const toggleStatus = (status: PatientStatus) => {
      const current = anamnesisData.clinicalStatus;
      if (current.includes(status)) {
          setAnamnesisData({...anamnesisData, clinicalStatus: current.filter(s => s !== status)});
      } else {
          setAnamnesisData({...anamnesisData, clinicalStatus: [...current, status]});
      }
  };

  // Diet Helpers
  const updateDietMeal = (dayIndex: number, mealIndex: number, field: keyof Meal, value: string) => {
      if (!dietFormData) return;
      const newWeeks = [...dietFormData.weeks];
      newWeeks[dayIndex].meals[mealIndex] = { ...newWeeks[dayIndex].meals[mealIndex], [field]: value };
      setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const updateDietItem = (dayIndex: number, mealIndex: number, itemIndex: number, field: 'food' | 'portion' | 'unit', value: string) => {
      if (!dietFormData) return;
      const newWeeks = [...dietFormData.weeks];
      const newItems = [...newWeeks[dayIndex].meals[mealIndex].items];
      newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
      newWeeks[dayIndex].meals[mealIndex].items = newItems;
      setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const addMeal = (dayIndex: number) => {
      if (!dietFormData) return;
      const newWeeks = [...dietFormData.weeks];
      newWeeks[dayIndex].meals.push({ name: 'Nova Refeição', time: '00:00', items: [{ food: '', portion: '1', unit: 'unidade(s)' }] });
      setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const removeMeal = (dayIndex: number, mealIndex: number) => {
      if (!dietFormData) return;
      const newWeeks = [...dietFormData.weeks];
      newWeeks[dayIndex].meals.splice(mealIndex, 1);
      setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const addMealItem = (dayIndex: number, mealIndex: number) => {
      if (!dietFormData) return;
      const newWeeks = [...dietFormData.weeks];
      newWeeks[dayIndex].meals[mealIndex].items.push({ food: '', portion: '', unit: 'g' });
      setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const removeMealItem = (dayIndex: number, mealIndex: number, itemIndex: number) => {
    if (!dietFormData) return;
    const newWeeks = [...dietFormData.weeks];
    newWeeks[dayIndex].meals[mealIndex].items.splice(itemIndex, 1);
    setDietFormData({ ...dietFormData, weeks: newWeeks });
  };

  const renderList = () => {
    let displayPatients = patients.filter(p => p.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (initialFilter === 'attention') {
        displayPatients = displayPatients.filter(p => p.anamnesis?.clinicalStatus.some(s => ['Acamado', 'Hospitalizado', 'Home Care'].includes(s)));
    }

    return (
    <div className="p-6 max-w-7xl mx-auto mb-20 md:mb-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pacientes {initialFilter === 'attention' && <span className="text-red-500 text-sm">(Atenção Necessária)</span>}</h1>
        <button
          onClick={() => setMode('add')}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Novo Paciente
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayPatients.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">Nenhum paciente encontrado.</p>}
        {displayPatients.map(patient => (
          <div
            key={patient.id}
            onClick={() => { setSelectedPatientId(patient.id); setMode('view'); }}
            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-400 cursor-pointer transition-all group relative"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">{patient.fullName}</h3>
                <p className="text-sm text-gray-500">{patient.age} anos • {patient.gender}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
                 {patient.anamnesis?.clinicalStatus.map(s => (
                    <span key={s} className={`text-xs px-2 py-1 rounded-full ${['Acamado', 'Hospitalizado'].includes(s) ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
                        {s}
                    </span>
                 ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  };

  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto print:hidden">
        <button onClick={() => setActiveTab('info')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'info' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
            <User className="w-4 h-4 inline mr-2" /> Dados Pessoais
        </button>
        <button onClick={() => setActiveTab('anamnesis')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'anamnesis' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
            <FileText className="w-4 h-4 inline mr-2" /> Anamnese
        </button>
        <button onClick={() => setActiveTab('diet')} className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'diet' ? 'border-b-2 border-emerald-500 text-emerald-600' : 'text-gray-500'}`}>
            <Utensils className="w-4 h-4 inline mr-2" /> Plano Alimentar
        </button>
    </div>
  );

  const renderPersonalInfo = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Informações Básicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                      <input type="text" className="w-full p-2 border rounded-md" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                      <input type="date" className="w-full p-2 border rounded-md" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Idade (Automático)</label>
                      <input type="number" disabled className="w-full p-2 border rounded-md bg-gray-50" value={formData.age} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sexo</label>
                      <select className="w-full p-2 border rounded-md" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as Gender})}>
                          {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Com quem mora</label>
                      <input type="text" className="w-full p-2 border rounded-md" value={formData.contact.livingArrangement} onChange={e => setFormData({...formData, contact: {...formData.contact, livingArrangement: e.target.value}})} />
                  </div>
              </div>
          </div>

          {/* Contact */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Email" type="email" className="w-full p-2 border rounded-md" value={formData.contact.email} onChange={e => setFormData({...formData, contact: {...formData.contact, email: e.target.value}})} />
                  <input placeholder="Telefone" type="tel" className="w-full p-2 border rounded-md" value={formData.contact.phone} onChange={e => setFormData({...formData, contact: {...formData.contact, phone: e.target.value}})} />
                  <input placeholder="Endereço" className="w-full p-2 border rounded-md md:col-span-2" value={formData.contact.address} onChange={e => setFormData({...formData, contact: {...formData.contact, address: e.target.value}})} />
              </div>
          </div>

          {/* Responsible Party */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Responsável (Se aplicável)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <input placeholder="Nome do Responsável" className="w-full p-2 border rounded-md" value={formData.responsible?.name || ''} onChange={e => setFormData({...formData, responsible: {...(formData.responsible || {relation: '', contact: ''}), name: e.target.value}})} />
                   <input placeholder="Parentesco" className="w-full p-2 border rounded-md" value={formData.responsible?.relation || ''} onChange={e => setFormData({...formData, responsible: {...(formData.responsible || {name: '', contact: ''}), relation: e.target.value}})} />
                   <input placeholder="Contato" className="w-full p-2 border rounded-md" value={formData.responsible?.contact || ''} onChange={e => setFormData({...formData, responsible: {...(formData.responsible || {name: '', relation: ''}), contact: e.target.value}})} />
              </div>
          </div>

          {/* Initial Contact */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Registro de Primeiro Contato</h3>
              <textarea placeholder="Situação familiar, explicação do serviço..." className="w-full p-2 border rounded-md h-24 mb-4" value={formData.initialContact?.notes} onChange={e => setFormData({...formData, initialContact: {...formData.initialContact!, notes: e.target.value}})} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input placeholder="Preço Acordado" className="w-full p-2 border rounded-md" value={formData.initialContact?.pricingAgreed} onChange={e => setFormData({...formData, initialContact: {...formData.initialContact!, pricingAgreed: e.target.value}})} />
                  <input placeholder="Método de Pagamento" className="w-full p-2 border rounded-md" value={formData.initialContact?.paymentMethod} onChange={e => setFormData({...formData, initialContact: {...formData.initialContact!, paymentMethod: e.target.value}})} />
              </div>
              <div className="mt-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 text-emerald-600"
                        checked={formData.initialContact?.nfcGenerated || false}
                        onChange={e => setFormData({...formData, initialContact: {...formData.initialContact!, nfcGenerated: e.target.checked}})}
                      />
                      <span className="text-sm font-medium text-gray-700">NFC já foi gerada e enviada?</span>
                  </label>
              </div>
          </div>
      </div>
  );

  const renderAnamnesis = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {/* Physical Assessment */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Avaliação Física & Clínica</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="text-sm text-gray-600">Peso (kg)</label>
                        <input type="number" className="w-full p-2 border rounded-md" value={anamnesisData.weight} onChange={e => setAnamnesisData({...anamnesisData, weight: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Altura (cm)</label>
                        <input type="number" className="w-full p-2 border rounded-md" value={anamnesisData.height} onChange={e => setAnamnesisData({...anamnesisData, height: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Líquidos (ml/dia)</label>
                        <input type="number" className="w-full p-2 border rounded-md" value={anamnesisData.liquidRequirement} onChange={e => setAnamnesisData({...anamnesisData, liquidRequirement: Number(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Idade (Auto)</label>
                        <input disabled value={formData.age} className="w-full p-2 border rounded-md bg-gray-50" />
                    </div>
                </div>
                
                <div className="mb-4">
                    <label className="block text-sm text-gray-600 mb-2">Status Clínico (Selecione múltiplos)</label>
                    <div className="flex flex-wrap gap-2">
                        {Object.values(PatientStatus).map(status => (
                            <button
                                key={status}
                                onClick={() => toggleStatus(status)}
                                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                    anamnesisData.clinicalStatus.includes(status)
                                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-sm text-gray-600">Distribuição Corporal (Obs.)</label>
                    <input type="text" className="w-full p-2 border rounded-md" value={anamnesisData.bodyDistribution} onChange={e => setAnamnesisData({...anamnesisData, bodyDistribution: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm text-gray-600">Notas de Mobilidade/Estado (Ex: Escaras)</label>
                    <textarea className="w-full p-2 border rounded-md h-20" value={anamnesisData.mobilityNotes} onChange={e => setAnamnesisData({...anamnesisData, mobilityNotes: e.target.value})} />
                </div>
             </div>

             {/* Socioeconomic & Goals */}
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Perfil</h3>
                 <div className="space-y-4">
                     <div>
                         <label className="text-sm text-gray-600">Condição Financeira</label>
                         <select className="w-full p-2 border rounded-md" value={anamnesisData.financialStatus} onChange={e => setAnamnesisData({...anamnesisData, financialStatus: e.target.value})}>
                             <option value="Baixa">Baixa</option>
                             <option value="Média">Média</option>
                             <option value="Alta">Alta</option>
                         </select>
                     </div>
                     <div>
                         <label className="text-sm text-gray-600">Tipo de Dieta</label>
                         <div className="flex gap-2">
                             <input 
                                className="w-full p-2 border rounded-md"
                                placeholder="Ex: Low Carb, Pastosa..."
                                value={anamnesisData.dietType}
                                onChange={e => setAnamnesisData({...anamnesisData, dietType: e.target.value})}
                             />
                         </div>
                     </div>
                     <div>
                         <label className="text-sm text-gray-600">Objetivos (Separe por vírgula)</label>
                         <textarea className="w-full p-2 border rounded-md" value={anamnesisData.goals.join(', ')} onChange={e => setAnamnesisData({...anamnesisData, goals: e.target.value.split(', ')})} />
                     </div>
                 </div>
             </div>
          </div>

          {/* Food Preferences */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Alimentação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                      <label className="text-sm text-gray-600">Restrições (O que não pode comer)</label>
                      <textarea className="w-full p-2 border rounded-md h-24" value={anamnesisData.foodRestrictions.join(', ')} onChange={e => setAnamnesisData({...anamnesisData, foodRestrictions: e.target.value.split(', ')})} />
                  </div>
                  <div>
                      <label className="text-sm text-gray-600">Preferências (O que gosta)</label>
                      <textarea className="w-full p-2 border rounded-md h-24" value={anamnesisData.foodPreferences.join(', ')} onChange={e => setAnamnesisData({...anamnesisData, foodPreferences: e.target.value.split(', ')})} />
                  </div>
              </div>
          </div>
      </div>
  );

  const renderDiet = () => (
      <div className="space-y-6 animate-in fade-in duration-300">
          {/* Controls */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center justify-between print:hidden">
             <div className="flex gap-3 flex-wrap">
                <button onClick={handleGenerateDiet} disabled={loadingAI} className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 text-sm">
                    {loadingAI ? <Loader2 className="animate-spin w-4 h-4" /> : <Wand2 className="w-4 h-4" />}
                    Gerar Plano com IA
                </button>
                <button onClick={handleCreateManualDiet} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-all text-sm">
                    <Edit3 className="w-4 h-4" />
                    Criar/Editar Manualmente
                </button>
                {dietFormData && (
                    <button onClick={handleAnalyzeDiet} disabled={loadingAI} className="flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-all text-sm border border-blue-200">
                        <Calculator className="w-4 h-4" />
                        Analisar Nutrientes & Justificativa
                    </button>
                )}
             </div>

             {dietFormData && (
                 <div className="flex gap-2">
                     <button onClick={handleExportWord} className="flex items-center gap-2 border border-blue-300 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50">
                         <FileDown className="w-4 h-4" /> Baixar Word (.doc)
                     </button>
                     <button onClick={printDiet} className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50">
                        <FileText className="w-4 h-4" /> PDF / Imprimir
                     </button>
                 </div>
             )}
          </div>

          {/* Datalist for foods */}
          <datalist id="commonFoods">
              {COMMON_FOODS.map(f => <option key={f} value={f} />)}
          </datalist>

          {/* Food Suggestions Sidebar */}
          {isEditingDiet && (
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 print:hidden">
                  <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-blue-800 flex items-center gap-2">
                          <Utensils className="w-4 h-4" /> Sugestões da IA (Baseado na Anamnese)
                      </h4>
                      <button onClick={handleSuggestFoods} disabled={loadingAI} className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded hover:bg-blue-300">
                          {loadingAI ? '...' : 'Carregar Sugestões'}
                      </button>
                  </div>
                  {suggestedFoods.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                          {suggestedFoods.map((item, i) => (
                              <div key={i} className="min-w-[150px] bg-white p-2 rounded border border-blue-100 shadow-sm text-xs">
                                  <p className="font-bold text-gray-700">{item.food}</p>
                                  <p className="text-gray-500 text-[10px]">{item.reason}</p>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          )}

          {/* Diet Display/Editor */}
          {dietFormData ? (
             <div id="printable-diet-area" className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
                 <div className="mb-6 border-b pb-4">
                     <div className="flex justify-between items-start">
                         <div>
                            <h2 className="text-2xl font-bold text-emerald-800">Plano Alimentar Semanal</h2>
                            <p className="text-gray-600">Paciente: <span className="font-semibold">{formData.fullName}</span> | Idade: {formData.age}</p>
                         </div>
                         <div className="hidden print:block text-right text-xs text-gray-400">
                             Gerado por NutriCare Pro
                             <br/>{new Date().toLocaleDateString()}
                         </div>
                     </div>
                     
                     {/* Macros Summary */}
                     {dietFormData.macros && (
                         <div className="mt-4 grid grid-cols-4 gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100 print:bg-gray-50 print:border-gray-200">
                             <div className="text-center">
                                 <p className="text-xs text-emerald-600 uppercase font-bold">Calorias</p>
                                 <p className="font-bold text-gray-800">{dietFormData.macros.calories} kcal</p>
                             </div>
                             <div className="text-center">
                                 <p className="text-xs text-emerald-600 uppercase font-bold">Proteína</p>
                                 <p className="font-bold text-gray-800">{dietFormData.macros.protein}g</p>
                             </div>
                             <div className="text-center">
                                 <p className="text-xs text-emerald-600 uppercase font-bold">Carbo</p>
                                 <p className="font-bold text-gray-800">{dietFormData.macros.carbs}g</p>
                             </div>
                             <div className="text-center">
                                 <p className="text-xs text-emerald-600 uppercase font-bold">Gordura</p>
                                 <p className="font-bold text-gray-800">{dietFormData.macros.fats}g</p>
                             </div>
                         </div>
                     )}
                     
                     {/* Explanation */}
                     {dietFormData.explanation && (
                         <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 print:bg-white print:border print:border-gray-200 text-sm text-gray-700">
                             <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-1"><Lightbulb className="w-4 h-4"/> Justificativa do Plano</h4>
                             <p>{dietFormData.explanation}</p>
                         </div>
                     )}
                     
                     {!dietFormData.macros && !loadingAI && isEditingDiet && (
                        <p className="text-xs text-blue-500 mt-2 print:hidden">
                            * Clique em "Analisar Nutrientes" no topo para calcular calorias e macros da dieta manual.
                        </p>
                     )}

                     <p className="text-gray-500 text-sm mt-4 italic">{dietFormData.notes}</p>
                 </div>

                 <div className="space-y-8">
                     {dietFormData.weeks.map((day, dayIndex) => (
                         <div key={dayIndex} className="break-inside-avoid page-break-inside-avoid">
                             <h3 className="text-lg font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded print:bg-transparent print:border-b print:border-gray-300">{day.dayOfWeek}</h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-2">
                                 {day.meals.map((meal, mealIndex) => (
                                     <div key={mealIndex} className="border border-gray-200 rounded-lg p-4 relative group hover:shadow-md transition-all bg-white print:border-gray-300">
                                         {isEditingDiet ? (
                                             <div className="space-y-2">
                                                 <div className="flex justify-between items-center">
                                                    <input 
                                                        className="font-semibold text-emerald-700 w-full bg-transparent focus:outline-none border-b border-dashed border-emerald-200 mr-2"
                                                        value={meal.name}
                                                        onChange={(e) => updateDietMeal(dayIndex, mealIndex, 'name', e.target.value)}
                                                    />
                                                    <input 
                                                        type="time"
                                                        className="text-xs text-gray-500 w-20 bg-transparent text-right"
                                                        value={meal.time}
                                                        onChange={(e) => updateDietMeal(dayIndex, mealIndex, 'time', e.target.value)}
                                                    />
                                                    <button onClick={() => removeMeal(dayIndex, mealIndex)} className="ml-2 text-red-300 hover:text-red-500 print:hidden"><Trash2 className="w-3 h-3" /></button>
                                                 </div>
                                                 <div className="space-y-2 mt-2">
                                                     {meal.items.map((item, itemIndex) => (
                                                         <div key={itemIndex} className="flex gap-2 items-center">
                                                             <input 
                                                                placeholder="Alimento"
                                                                list="commonFoods"
                                                                className="w-full text-sm border-b border-gray-100 focus:border-emerald-300 outline-none py-1"
                                                                value={item.food}
                                                                onChange={(e) => updateDietItem(dayIndex, mealIndex, itemIndex, 'food', e.target.value)}
                                                             />
                                                             <input 
                                                                placeholder="Qtd"
                                                                className="w-12 text-sm text-gray-500 border-b border-gray-100 focus:border-emerald-300 outline-none py-1 text-right"
                                                                value={item.portion}
                                                                onChange={(e) => updateDietItem(dayIndex, mealIndex, itemIndex, 'portion', e.target.value)}
                                                             />
                                                             <select 
                                                                className="w-20 text-[10px] bg-transparent border-b border-gray-100"
                                                                value={item.unit || 'g'}
                                                                onChange={(e) => updateDietItem(dayIndex, mealIndex, itemIndex, 'unit', e.target.value)}
                                                             >
                                                                 {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                                             </select>
                                                             <button onClick={() => removeMealItem(dayIndex, mealIndex, itemIndex)} className="text-red-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                                                         </div>
                                                     ))}
                                                     <button onClick={() => addMealItem(dayIndex, mealIndex)} className="text-xs text-emerald-500 hover:text-emerald-700 flex items-center gap-1 mt-1">
                                                         <Plus className="w-3 h-3" /> Item
                                                     </button>
                                                 </div>
                                             </div>
                                         ) : (
                                             <>
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <span className="font-semibold text-emerald-700">{meal.name}</span>
                                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full print:bg-transparent print:border print:border-gray-200">{meal.time}</span>
                                                </div>
                                                <ul className="space-y-1">
                                                    {meal.items.map((item, idx) => (
                                                        <li key={idx} className="text-sm text-gray-600 flex justify-between border-b border-gray-50 pb-1 last:border-0 print:border-gray-100">
                                                            <span>{item.food}</span>
                                                            <span className="text-gray-400 text-xs whitespace-nowrap ml-2">{item.portion} {item.unit || 'g'}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                             </>
                                         )}
                                     </div>
                                 ))}
                                 {isEditingDiet && (
                                     <button onClick={() => addMeal(dayIndex)} className="border-2 border-dashed border-gray-200 rounded-lg p-4 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors">
                                         <Plus className="w-5 h-5" /> Nova Refeição
                                     </button>
                                 )}
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
          ) : (
              <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
                  <Utensils className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum plano alimentar criado.</p>
                  <p className="text-sm text-gray-400">Use a IA ou crie manualmente.</p>
              </div>
          )}
      </div>
  );

  if (mode === 'list') return renderList();

  return (
    <div className="p-6 max-w-7xl mx-auto mb-20 md:mb-0">
      <div className="print:hidden">
          <button onClick={() => setMode('list')} className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition-colors">
            <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para lista
          </button>

          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{mode === 'add' ? 'Novo Paciente' : formData.fullName}</h1>
            <div className="flex gap-2">
                {mode === 'view' && (
                    <button 
                        type="button"
                        onClick={confirmDelete}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-100 transition-colors border border-red-200"
                    >
                        <Trash2 className="w-4 h-4" /> Excluir Paciente
                    </button>
                )}
                <button onClick={handleSavePatient} className="bg-emerald-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all">
                    <Save className="w-4 h-4" /> Salvar
                </button>
            </div>
          </div>

          {renderTabs()}
      </div>

      <div className="min-h-[500px]">
          <style>{`
            @media print {
                /* Esconde tudo por padrão */
                body * {
                    visibility: hidden;
                }
                /* Reseta o layout para evitar cortes */
                html, body {
                    height: auto !important;
                    overflow: visible !important;
                    background: white !important;
                }
                /* Mostra apenas a área da dieta */
                #printable-diet-area, #printable-diet-area * {
                    visibility: visible;
                }
                #printable-diet-area {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    margin: 0;
                    padding: 20px;
                    border: none !important;
                    box-shadow: none !important;
                    display: block !important;
                    background: white !important;
                }
                /* Esconde elementos marcados especificamente */
                .print\\:hidden {
                    display: none !important;
                }
            }
          `}</style>
          {activeTab === 'info' && renderPersonalInfo()}
          {activeTab === 'anamnesis' && renderAnamnesis()}
          {activeTab === 'diet' && renderDiet()}
      </div>

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                  <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-600">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Paciente?</h3>
                      <p className="text-gray-500 mb-6">
                          Tem certeza que deseja excluir <strong>{formData.fullName}</strong>? <br/>
                          Esta ação apagará todo o histórico, dietas e registros. <br/>
                          <span className="text-red-600 font-bold">Esta ação não pode ser desfeita.</span>
                      </p>
                      <div className="flex gap-3 w-full">
                          <button 
                              onClick={() => setShowDeleteModal(false)}
                              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                              onClick={executeDelete}
                              className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-lg"
                          >
                              Sim, Excluir
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};