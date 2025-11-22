import React from 'react';
import { LayoutDashboard, Users, Calendar, Utensils, ChefHat, Calculator } from 'lucide-react';

interface NavigationProps {
  currentView: string;
  setView: (view: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'recipes', label: 'Receitas', icon: ChefHat },
    { id: 'calculators', label: 'Calculadoras', icon: Calculator },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block fixed z-10">
      <div className="p-6 flex items-center gap-2">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Utensils className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold text-gray-800">NutriCare</span>
      </div>
      <nav className="px-4 mt-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
              currentView === item.id
                ? 'bg-emerald-50 text-emerald-600'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-emerald-500' : 'text-gray-400'}`} />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export const MobileNav: React.FC<NavigationProps> = ({ currentView, setView }) => {
    const navItems = [
        { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
        { id: 'patients', label: 'Pacientes', icon: Users },
        { id: 'agenda', label: 'Agenda', icon: Calendar },
        { id: 'recipes', label: 'Receitas', icon: ChefHat },
      ];
    
    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 flex justify-around py-2 pb-safe">
             {navItems.map((item) => (
                <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`flex flex-col items-center p-2 rounded-lg ${
                    currentView === item.id ? 'text-emerald-600' : 'text-gray-500'
                    }`}
                >
                    <item.icon className="w-6 h-6" />
                    <span className="text-[10px] mt-1">{item.label}</span>
                </button>
            ))}
        </div>
    )
}