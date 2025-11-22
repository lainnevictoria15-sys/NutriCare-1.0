import React, { useState, useEffect } from 'react';
import { Navigation, MobileNav } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { PatientManager } from './components/PatientManager';
import { Agenda } from './components/Agenda';
import { RecipeManager } from './components/RecipeManager';
import { Calculators } from './components/Calculators';
import { Patient, Appointment, Recipe } from './types';

// Mock data for initial state
const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    fullName: 'Maria Silva',
    dob: '1980-05-15',
    age: 44,
    gender: 'Feminino' as any,
    contact: { email: 'maria@email.com', phone: '1199999999', address: 'Rua A, 123', city: 'São Paulo', livingArrangement: 'Marido e 2 filhos' },
    anamnesis: {
        clinicalStatus: ['Ativo'] as any,
        weight: 70,
        height: 165,
        date: '2024-05-20',
        bodyDistribution: 'Ginoide',
        ageAssessment: 'Compatível',
        mobilityNotes: 'Sem restrições',
        financialStatus: 'Média',
        foodRestrictions: ['Lactose'],
        foodPreferences: ['Frutas', 'Peixe'],
        dietType: 'Natural',
        goals: ['Perda de peso', 'Reeducação alimentar'],
        liquidRequirement: 2500,
        mealsPerDay: 5,
        mealScheduleNotes: ''
    },
    initialContact: {
        date: '2024-05-10',
        notes: 'Paciente procura melhora na qualidade de vida.',
        paymentMethod: 'Pix',
        pricingAgreed: 'R$ 300,00',
        nfcGenerated: true
    }
  }
];

const MOCK_APPOINTMENTS: Appointment[] = [
    {
        id: '101',
        patientId: '1',
        patientName: 'Maria Silva',
        date: new Date().toISOString().split('T')[0],
        time: '14:00',
        type: 'Online',
        location: 'Meet',
        status: 'Scheduled'
    }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [patientFilter, setPatientFilter] = useState('');
  
  // Persisted State with a "Cloud Database Simulation" via LocalStorage
  // In a real app, these hooks would call an API/Firebase service.
  const [patients, setPatients] = useState<Patient[]>(() => {
      const saved = localStorage.getItem('nutricare_patients');
      return saved ? JSON.parse(saved) : MOCK_PATIENTS;
  });
  
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
      const saved = localStorage.getItem('nutricare_appointments');
      return saved ? JSON.parse(saved) : MOCK_APPOINTMENTS;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
      const saved = localStorage.getItem('nutricare_recipes');
      return saved ? JSON.parse(saved) : [];
  });

  // Effects to save to localStorage (Simulating Database updates)
  useEffect(() => localStorage.setItem('nutricare_patients', JSON.stringify(patients)), [patients]);
  useEffect(() => localStorage.setItem('nutricare_appointments', JSON.stringify(appointments)), [appointments]);
  useEffect(() => localStorage.setItem('nutricare_recipes', JSON.stringify(recipes)), [recipes]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard patients={patients} appointments={appointments} setView={setCurrentView} setPatientFilter={setPatientFilter} />;
      case 'patients':
        return <PatientManager patients={patients} setPatients={setPatients} initialFilter={patientFilter} />;
      case 'agenda':
        return <Agenda appointments={appointments} patients={patients} setAppointments={setAppointments} />;
      case 'recipes':
        return <RecipeManager recipes={recipes} setRecipes={setRecipes} />;
      case 'calculators':
        return <Calculators />;
      default:
        return <Dashboard patients={patients} appointments={appointments} setView={setCurrentView} setPatientFilter={setPatientFilter} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation currentView={currentView} setView={setCurrentView} />
      
      <main className="flex-1 md:ml-64 min-h-screen transition-all duration-200">
        {renderView()}
      </main>

      <MobileNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;