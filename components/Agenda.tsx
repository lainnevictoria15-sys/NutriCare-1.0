import React, { useState } from 'react';
import { Appointment, Patient } from '../types';
import { Calendar as CalendarIcon, Clock, Video, MapPin, Plus, Trash2, Edit2, AlertTriangle, X } from 'lucide-react';

interface AgendaProps {
  appointments: Appointment[];
  patients: Patient[];
  setAppointments: (appts: Appointment[]) => void;
}

export const Agenda: React.FC<AgendaProps> = ({ appointments, patients, setAppointments }) => {
  const [showModal, setShowModal] = useState(false);
  const [isCustomPatient, setIsCustomPatient] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State for custom Delete Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  
  // State for custom Conflict Modal
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<any>(null);

  const emptyAppt: Partial<Appointment> = {
      date: new Date().toISOString().split('T')[0],
      type: 'Online',
      location: 'Google Meet',
      status: 'Scheduled',
      patientName: '',
      isReturn: false
  };
  
  const [formAppt, setFormAppt] = useState<Partial<Appointment>>(emptyAppt);

  const handleEdit = (e: React.MouseEvent, appt: Appointment) => {
      e.stopPropagation();
      setFormAppt(appt);
      setEditingId(appt.id);
      setIsCustomPatient(!patients.find(p => p.id === appt.patientId));
      setShowModal(true);
  };

  const attemptSave = () => {
      if(!formAppt.date || !formAppt.time) return;

      // Conflict Check
      const hasConflict = appointments.some(a => 
          a.id !== editingId && 
          a.date === formAppt.date && 
          a.time === formAppt.time
      );

      if (hasConflict) {
          // Instead of window.confirm, set pending data and open conflict modal
          setPendingSaveData(formAppt);
          setConflictModalOpen(true);
          return;
      }

      finalizeSave();
  };

  const finalizeSave = () => {
      let patientName = formAppt.patientName;
      let patientId = formAppt.patientId;

      if (!isCustomPatient && formAppt.patientId) {
          const p = patients.find(x => x.id === formAppt.patientId);
          if (p) patientName = p.fullName;
      } else {
          // Custom patient
          if (!patientId) patientId = 'external-' + crypto.randomUUID();
      }

      const finalAppt: Appointment = {
          id: editingId || crypto.randomUUID(),
          patientId: patientId!,
          patientName: patientName || 'Sem Nome',
          date: formAppt.date!,
          time: formAppt.time!,
          type: formAppt.type as any,
          location: formAppt.location || '',
          status: formAppt.status as any,
          isReturn: formAppt.isReturn
      };

      if (editingId) {
          setAppointments(appointments.map(a => a.id === editingId ? finalAppt : a));
      } else {
          setAppointments([...appointments, finalAppt].sort((a,b) => new Date(a.date + 'T' + a.time).getTime() - new Date(b.date + 'T' + b.time).getTime()));
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormAppt(emptyAppt);
      setConflictModalOpen(false);
      setPendingSaveData(null);
  };

  const promptDelete = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDeleteTargetId(id);
  };

  const confirmDelete = () => {
      if (deleteTargetId) {
          const filtered = appointments.filter(a => a.id !== deleteTargetId);
          setAppointments(filtered);
          setDeleteTargetId(null);
      }
  };

  // Group by date
  const grouped = appointments.reduce((acc, appt) => {
      const date = appt.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(appt);
      return acc;
  }, {} as Record<string, Appointment[]>);

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="p-6 max-w-7xl mx-auto mb-20 md:mb-0">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Agenda</h1>
        <button 
            onClick={() => { setFormAppt(emptyAppt); setEditingId(null); setIsCustomPatient(false); setShowModal(true); }}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-700 shadow-sm"
        >
            <Plus className="w-4 h-4" /> Agendar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List of Appointments */}
          <div className="lg:col-span-2 space-y-6">
              {sortedDates.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                      <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">Nenhum agendamento encontrado.</p>
                  </div>
              )}
              {sortedDates.map(date => (
                  <div key={date} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 font-semibold text-gray-700 flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                      <div className="divide-y divide-gray-100">
                          {grouped[date].map(appt => (
                              <div key={appt.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                      <div className="bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded text-sm w-16 text-center shrink-0">
                                          {appt.time}
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-semibold text-gray-800">{appt.patientName}</p>
                                            {appt.isReturn && <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold">RETORNO</span>}
                                          </div>
                                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                              {appt.type === 'Online' ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                              {appt.type} {appt.location ? `• ${appt.location}` : ''}
                                          </div>
                                      </div>
                                  </div>
                                  {/* Action Buttons */}
                                  <div className="flex gap-3 self-end sm:self-center">
                                      <button 
                                        onClick={(e) => handleEdit(e, appt)} 
                                        className="text-blue-500 hover:text-blue-700 p-2 bg-blue-50 rounded-lg"
                                        title="Editar"
                                      >
                                          <Edit2 className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={(e) => promptDelete(e, appt.id)} 
                                        className="text-red-500 hover:text-red-700 p-2 bg-red-50 rounded-lg"
                                        title="Excluir"
                                      >
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>

      {/* ADD/EDIT MODAL */}
      {showModal && (
          <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>

              <div className="flex min-h-full items-start justify-center p-4 text-center sm:items-center sm:p-0 pt-10 pb-10">
                  <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-lg">
                      <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                          <div className="flex justify-between items-center mb-5">
                              <h2 className="text-xl font-bold text-gray-900" id="modal-title">
                                  {editingId ? 'Editar' : 'Novo'} Agendamento
                              </h2>
                              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                                  <X className="w-6 h-6" />
                              </button>
                          </div>

                          <div className="space-y-4">
                              <div>
                                  <div className="flex justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Paciente</label>
                                    <button 
                                        onClick={() => setIsCustomPatient(!isCustomPatient)} 
                                        className="text-xs text-emerald-600 hover:underline font-medium"
                                    >
                                        {isCustomPatient ? 'Selecionar da Lista' : 'Outro (Não Cadastrado)'}
                                    </button>
                                  </div>
                                  
                                  {isCustomPatient ? (
                                      <input 
                                        type="text" 
                                        placeholder="Nome do Paciente" 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" 
                                        value={formAppt.patientName} 
                                        onChange={e => setFormAppt({...formAppt, patientName: e.target.value})} 
                                      />
                                  ) : (
                                      <select 
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white"
                                        value={formAppt.patientId || ''}
                                        onChange={(e) => setFormAppt({...formAppt, patientId: e.target.value})}
                                      >
                                          <option value="">Selecione um paciente...</option>
                                          {patients.map(p => <option key={p.id} value={p.id}>{p.fullName}</option>)}
                                      </select>
                                  )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                                      <input type="date" className="w-full p-3 border border-gray-300 rounded-lg" value={formAppt.date} onChange={e => setFormAppt({...formAppt, date: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                                      <input type="time" className="w-full p-3 border border-gray-300 rounded-lg" value={formAppt.time} onChange={e => setFormAppt({...formAppt, time: e.target.value})} />
                                  </div>
                              </div>

                              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  <input 
                                    type="checkbox" 
                                    id="isReturn"
                                    checked={formAppt.isReturn || false}
                                    onChange={e => setFormAppt({...formAppt, isReturn: e.target.checked})}
                                    className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                                  />
                                  <label htmlFor="isReturn" className="text-sm font-medium text-gray-700">É consulta de retorno?</label>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Modalidade</label>
                                  <select 
                                     className="w-full p-3 border border-gray-300 rounded-lg bg-white"
                                     value={formAppt.type}
                                     onChange={e => setFormAppt({...formAppt, type: e.target.value as any})}
                                  >
                                      <option value="Online">Online</option>
                                      <option value="Presencial (Consultório)">Presencial (Consultório)</option>
                                      <option value="Presencial (Domicílio)">Presencial (Domicílio)</option>
                                  </select>
                              </div>

                              <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">Local / Link</label>
                                  <input 
                                     type="text" 
                                     placeholder="Endereço ou Link da reunião" 
                                     className="w-full p-3 border border-gray-300 rounded-lg"
                                     value={formAppt.location}
                                     onChange={e => setFormAppt({...formAppt, location: e.target.value})}
                                   />
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                          <button 
                            type="button" 
                            className="inline-flex w-full justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 sm:ml-3 sm:w-auto"
                            onClick={attemptSave}
                          >
                            Salvar Agendamento
                          </button>
                          <button 
                            type="button" 
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                            onClick={() => setShowModal(false)}
                          >
                            Cancelar
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTargetId && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                  <div className="text-center">
                      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600">
                          <Trash2 className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Cancelar Agendamento?</h3>
                      <p className="text-sm text-gray-500 mb-6">
                          Tem certeza que deseja cancelar este agendamento?
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setDeleteTargetId(null)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                          <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Sim, Cancelar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CONFLICT MODAL */}
      {conflictModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50">
              <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
                  <div className="text-center">
                      <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 text-yellow-600">
                          <AlertTriangle className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Conflito de Horário</h3>
                      <p className="text-sm text-gray-500 mb-6">
                          Já existe um agendamento neste horário. Deseja salvar mesmo assim?
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setConflictModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">Cancelar</button>
                          <button onClick={finalizeSave} className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Sim, Agendar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};