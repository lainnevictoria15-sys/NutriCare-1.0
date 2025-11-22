import React from 'react';
import { Patient, Appointment } from '../types';
import { Users, CalendarCheck, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  patients: Patient[];
  appointments: Appointment[];
  setView: (view: string) => void;
  setPatientFilter: (filter: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ patients, appointments, setView, setPatientFilter }) => {
  const today = new Date().toISOString().split('T')[0];
  const todaysAppointments = appointments.filter(a => a.date === today);
  
  // Simple stats calculation
  const activePatients = patients.length;
  const completedAppts = appointments.filter(a => a.status === 'Completed').length;
  const attentionCount = patients.filter(p => p.anamnesis?.clinicalStatus.some(s => ['Acamado', 'Hospitalizado', 'Home Care'].includes(s))).length;

  // Mock data processing for Chart
  const statusCounts = patients.reduce((acc, p) => {
      const statuses = p.anamnesis?.clinicalStatus || [];
      statuses.forEach(s => {
          acc[s] = (acc[s] || 0) + 1;
      });
      if (statuses.length === 0) {
          acc['Sem Status'] = (acc['Sem Status'] || 0) + 1;
      }
      return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(statusCounts).map(key => ({
      name: key,
      count: statusCounts[key]
  }));

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const handleAttentionClick = () => {
      setPatientFilter('attention');
      setView('patients');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto mb-20 md:mb-0">
      <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => { setPatientFilter(''); setView('patients'); }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-colors">
            <div>
                <p className="text-sm text-gray-500">Pacientes Totais</p>
                <h3 className="text-2xl font-bold text-gray-800">{activePatients}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <Users className="w-5 h-5" />
            </div>
        </div>
        
        <div onClick={() => setView('agenda')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors">
            <div>
                <p className="text-sm text-gray-500">Atendimentos Hoje</p>
                <h3 className="text-2xl font-bold text-gray-800">{todaysAppointments.length}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <CalendarCheck className="w-5 h-5" />
            </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-500">Total Consultas</p>
                <h3 className="text-2xl font-bold text-gray-800">{completedAppts}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                <TrendingUp className="w-5 h-5" />
            </div>
        </div>

         <div onClick={handleAttentionClick} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-red-300 transition-colors group">
            <div>
                <p className="text-sm text-gray-500 group-hover:text-red-600 font-medium">Atenção Necessária</p>
                <h3 className="text-2xl font-bold text-gray-800 group-hover:text-red-700">{attentionCount}</h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-5 h-5" />
            </div>
        </div>
      </div>

      {/* Charts & Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Distribuição Clínica</h2>
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                  </BarChart>
              </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80 overflow-y-auto">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Próximas Consultas</h2>
            {appointments.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhuma consulta agendada.</p>
            ) : (
                <ul className="space-y-3">
                    {appointments.slice(0, 5).map(apt => (
                        <li key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex flex-col">
                                <span className="font-medium text-gray-800">{apt.patientName}</span>
                                <span className="text-xs text-gray-500">
                                    {apt.type} {apt.isReturn && <span className="text-emerald-600 font-bold">(Retorno)</span>} • {new Date(apt.date).toLocaleDateString('pt-BR')}
                                </span>
                            </div>
                            <span className="text-emerald-600 font-bold text-sm">{apt.time}</span>
                        </li>
                    ))}
                </ul>
            )}
          </div>
      </div>
    </div>
  );
};