import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  BookOpen,
  Plus,
  Trash2,
  Filter,
  Check,
  GraduationCap,
  Clock,
  AlertTriangle,
  Pencil,
  X,
  Download,
  Sparkles,
  Lightbulb,
  RefreshCw,
  WifiOff
} from 'lucide-react';

export type Priority = 'alta' | 'media' | 'baja';
export type StatusFilter = 'todas' | 'pendientes' | 'completadas';

export interface Task {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface StudyStrategy {
  prioridad_sugerida: string;
  razon: string;
  plan_estudio: string[];
}

// JSON de prueba precargado como fallback ante fallas o falta de conexión a internet
export const FALLBACK_ESTRATEGIA: StudyStrategy = {
  prioridad_sugerida: "Resolver problemas 5 al 12 de cinemática",
  razon: "Vence mañana y posee prioridad alta. Abordar primero la tarea analítica de mayor dificultad previene la fatiga mental y asegura la entrega a tiempo.",
  plan_estudio: [
    "Paso 1 (15 min): Repasar fórmulas de velocidad y aceleración en la carpeta.",
    "Paso 2 (30 min): Resolver los problemas 5 al 8 y verificar unidades en el SI.",
    "Paso 3 (5 min): Pausa activa breve (tomar agua y despejar la vista).",
    "Paso 4 (25 min): Completar los ejercicios 9 al 12 y pasar en limpio las respuestas."
  ]
};

const PRESET_SUBJECTS = [
  'Matemáticas',
  'Física y Química',
  'Lengua y Literatura',
  'Historia',
  'Biología',
  'Inglés',
  'Filosofía',
  'Geografía',
  'Tecnología',
  'Otra materia'
];

const INITIAL_TASKS: Task[] = [
  {
    id: 'demo-1',
    title: 'Resolver problemas 5 al 12 de cinemática',
    subject: 'Física y Química',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // mañana
    priority: 'alta',
    completed: false,
    createdAt: Date.now() - 3600000
  },
  {
    id: 'demo-2',
    title: 'Redactar comentario de texto sobre la Generación del 27',
    subject: 'Lengua y Literatura',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // en 2 días
    priority: 'media',
    completed: false,
    createdAt: Date.now() - 7200000
  },
  {
    id: 'demo-3',
    title: 'Entregar mapa mental del período de entreguerras',
    subject: 'Historia',
    dueDate: new Date().toISOString().split('T')[0], // hoy
    priority: 'alta',
    completed: true,
    createdAt: Date.now() - 86400000
  }
];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const saved = localStorage.getItem('tarea_cero_tareas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error al cargar tareas de localStorage', e);
    }
    return INITIAL_TASKS;
  });

  // Filtros
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('todas');
  const [subjectFilter, setSubjectFilter] = useState<string>('todas');

  // Formulario y edición
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(PRESET_SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [priority, setPriority] = useState<Priority>('media');
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estado para la Estrategia Sugerida de Estudio con IA
  const [strategy, setStrategy] = useState<StudyStrategy | null>(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [strategyNotice, setStrategyNotice] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Generar Estrategia Sugerida de Estudio consumiendo la API de Gemini con fallback
  const generateStudyStrategy = async () => {
    const pendingTasks = tasks.filter(t => !t.completed);
    if (pendingTasks.length === 0) {
      setStrategyNotice('No tenés tareas escolares pendientes para analizar. ¡Agregá una tarea primero!');
      return;
    }

    setLoadingStrategy(true);
    setStrategyNotice(null);

    try {
      const response = await fetch('/api/gemini/estrategia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: pendingTasks.map(t => ({
            title: t.title,
            subject: t.subject,
            dueDate: t.dueDate,
            priority: t.priority
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor: código ${response.status}`);
      }

      const data: StudyStrategy = await response.json();
      if (!data.prioridad_sugerida || !data.razon || !Array.isArray(data.plan_estudio)) {
        throw new Error('Estructura de JSON no coincide con el formato esperado');
      }

      setStrategy(data);
      setIsUsingFallback(false);
      setStrategyNotice(null);
    } catch (err: any) {
      console.warn('Aviso: usando fallback de prueba por falla de red o configuración de API:', err);
      // Requisito 4 y 5: Mensaje amigable y JSON de prueba como fallback por si no hay conexión
      setStrategy(FALLBACK_ESTRATEGIA);
      setIsUsingFallback(true);
      setStrategyNotice('Modo sin conexión: No pudimos conectar con la IA en este momento. Te mostramos una estrategia pedagógica de ejemplo para que puedas continuar organizándote sin interrupciones.');
    } finally {
      setLoadingStrategy(false);
    }
  };

  // Auto-cerrar mensaje de éxito luego de 3.5 segundos
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Persistir en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('tarea_cero_tareas', JSON.stringify(tasks));
    } catch (e) {
      console.error('Error al guardar tareas en localStorage', e);
    }
  }, [tasks]);

  // Lista dinámica de materias para el filtro
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => {
      if (t.subject && t.subject.trim()) {
        set.add(t.subject.trim());
      }
    });
    return Array.from(set).sort();
  }, [tasks]);

  // Tareas filtradas y ordenadas
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // Filtro de estado
      if (statusFilter === 'pendientes' && task.completed) return false;
      if (statusFilter === 'completadas' && !task.completed) return false;

      // Filtro de materia
      if (subjectFilter !== 'todas' && task.subject !== subjectFilter) return false;

      return true;
    }).sort((a, b) => {
      // Primero incompletas, luego completadas
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Ordenar por fecha más cercana
      if (a.dueDate && b.dueDate) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return 0;
    });
  }, [tasks, statusFilter, subjectFilter]);

  // Contadores
  const pendingCount = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const completedCount = useMemo(() => tasks.filter(t => t.completed).length, [tasks]);

  // Cerrar y limpiar formulario
  const closeForm = () => {
    setShowAddForm(false);
    setEditingTaskId(null);
    setTitle('');
    setCustomSubject('');
    setFormError('');
    setPriority('media');
    const today = new Date();
    setDueDate(today.toISOString().split('T')[0]);
  };

  // Iniciar edición de una tarea existente
  const handleStartEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    if (PRESET_SUBJECTS.includes(task.subject)) {
      setSubject(task.subject);
      setCustomSubject('');
    } else {
      setSubject('Otra materia');
      setCustomSubject(task.subject);
    }
    setDueDate(task.dueDate || new Date().toISOString().split('T')[0]);
    setPriority(task.priority);
    setFormError('');
    setShowAddForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Crear o actualizar tarea
  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Por favor, ingresá la descripción de la tarea escolar.');
      return;
    }

    const finalSubject = subject === 'Otra materia'
      ? (customSubject.trim() || 'General')
      : subject;

    const taskDate = dueDate || new Date().toISOString().split('T')[0];

    if (editingTaskId) {
      // Actualizar tarea existente
      setTasks(prev =>
        prev.map(task =>
          task.id === editingTaskId
            ? {
                ...task,
                title: title.trim(),
                subject: finalSubject,
                dueDate: taskDate,
                priority
              }
            : task
        )
      );
      setSuccessMessage('¡Tarea actualizada con éxito!');
    } else {
      // Crear nueva tarea
      const newTask: Task = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        title: title.trim(),
        subject: finalSubject,
        dueDate: taskDate,
        priority,
        completed: false,
        createdAt: Date.now()
      };
      setTasks(prev => [newTask, ...prev]);
      setSuccessMessage('¡Tarea escolar agregada correctamente!');
    }

    closeForm();
  };

  // Cambiar estado completada/pendiente
  const toggleTaskStatus = (id: string) => {
    let newStatus = false;
    setTasks(prev =>
      prev.map(task => {
        if (task.id === id) {
          newStatus = !task.completed;
          return { ...task, completed: newStatus };
        }
        return task;
      })
    );
    setSuccessMessage(newStatus ? '¡Felicitaciones! Tarea completada.' : 'Tarea marcada como pendiente.');
  };

  // Eliminar tarea
  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setSuccessMessage('Tarea eliminada correctamente.');
  };

  // Exportar tareas a archivo JSON de respaldo
  const exportTasksToJSON = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute('download', `tarea_cero_respaldo_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error('Error al exportar respaldo JSON', e);
    }
  };

  // Formato de fecha legible en español
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return 'Sin fecha';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;

    const targetDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.round((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Mañana';
    if (diffDays === -1) return 'Ayer';
    if (diffDays < -1) return `Venció hace ${Math.abs(diffDays)} días`;
    if (diffDays <= 6) return `En ${diffDays} días`;

    return targetDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 md:pb-12">
      {/* Barra superior limpia */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                TAREA CERO
              </h1>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Organizador para estudiantes de bachillerato
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium tabular-nums hidden sm:inline">
              <strong className="text-indigo-600 font-bold">{pendingCount}</strong> pendientes · {completedCount} listas
            </span>
            <button
              type="button"
              onClick={exportTasksToJSON}
              title="Descargar respaldo JSON de mis tareas"
              aria-label="Descargar respaldo JSON"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Respaldar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notificación flotante de éxito / confirmación en español */}
      {successMessage && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-16 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-200" />
            <span className="text-base font-medium leading-snug">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="p-1 text-emerald-100 hover:text-white rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center shrink-0"
            aria-label="Cerrar notificación"
          >
            <X className="w-5 h-5" />
          </button>
        </aside>
      )}

      {/* Contenido principal adaptado a pantallas desde 320px */}
      <main className="max-w-xl mx-auto px-3 sm:px-4 pt-3 sm:pt-5 space-y-4">
        {/* Banner de progreso rápido */}
        <section className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {pendingCount === 0 && tasks.length > 0
                  ? '¡Excelente! Estás al día con tus entregas'
                  : pendingCount === 1
                  ? 'Te queda 1 tarea pendiente'
                  : tasks.length === 0
                  ? 'Organizador Escolar'
                  : `Tenés ${pendingCount} tareas escolares pendientes`}
              </h2>
              <p className="text-sm text-slate-600 mt-0.5">
                {tasks.length === 0
                  ? 'Registrá tus tareas para tener todo bajo control'
                  : 'Priorizá entregas próximas para no acumular trabajo'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Botón para solicitar Estrategia Sugerida de Estudio a Gemini */}
              <button
                type="button"
                onClick={generateStudyStrategy}
                disabled={loadingStrategy || pendingCount === 0}
                title={pendingCount === 0 ? 'No tenés tareas pendientes para analizar' : 'Generar Estrategia de Estudio con IA'}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 active:scale-[0.98] border border-indigo-200 rounded-xl transition-all min-h-[48px] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className={`w-5 h-5 text-indigo-600 ${loadingStrategy ? 'animate-spin' : ''}`} />
                <span>{loadingStrategy ? 'Analizando...' : 'Estrategia IA'}</span>
              </button>

              {/* Botón principal Agregar Tarea */}
              <button
                onClick={() => {
                  if (showAddForm) {
                    closeForm();
                  } else {
                    setShowAddForm(true);
                    setFormError('');
                  }
                }}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl transition-all shadow-md min-h-[48px] shrink-0"
                aria-expanded={showAddForm}
              >
                <Plus className="w-5 h-5" />
                <span>{showAddForm ? 'Cerrar formulario' : 'Agregar Tarea'}</span>
              </button>
            </div>
          </div>

          {/* Barra de progreso visual */}
          {tasks.length > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden mt-3">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100)}%`
                }}
              />
            </div>
          )}
        </section>

        {/* Notificación de modo sin conexión o aviso amigable */}
        {strategyNotice && (
          <aside className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900 text-sm animate-in fade-in duration-150">
            <WifiOff className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold leading-snug">{strategyNotice}</p>
            </div>
            <button
              onClick={() => setStrategyNotice(null)}
              className="text-amber-700 hover:text-amber-900 p-1 min-h-[32px] min-w-[32px] flex items-center justify-center"
              aria-label="Cerrar aviso"
            >
              ✕
            </button>
          </aside>
        )}

        {/* Tarjeta de Estrategia Sugerida de Estudio (Renderizado estético del JSON estructurado) */}
        {strategy && (
          <section className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border-2 border-indigo-400/40 animate-in fade-in slide-in-from-top-3 duration-200 space-y-4">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-indigo-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/40 border border-indigo-400/50 flex items-center justify-center text-amber-300 shadow-xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
                    Estrategia Sugerida de Estudio
                    {isUsingFallback && (
                      <span className="text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-md px-2 py-0.5">
                        Fallback / Sin conexión
                      </span>
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-indigo-200">
                    Análisis pedagógico inteligente para organizar tus entregas
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStrategy(null)}
                className="text-indigo-300 hover:text-white min-h-[40px] min-w-[40px] flex items-center justify-center font-bold text-lg"
                aria-label="Cerrar estrategia"
              >
                ✕
              </button>
            </div>

            {/* Prioridad sugerida con razón explicativa */}
            <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15">
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-300" />
                Tarea prioritaria a realizar primero
              </div>
              <p className="text-base sm:text-lg font-bold text-white">
                {strategy.prioridad_sugerida}
              </p>
              <p className="text-sm sm:text-base text-indigo-100 mt-2 leading-relaxed">
                {strategy.razon}
              </p>
            </div>

            {/* Plan de estudio secuencial con tiempos recomendados */}
            <div>
              <h4 className="text-sm sm:text-base font-bold text-indigo-200 mb-2.5">
                Plan de estudio paso a paso:
              </h4>
              <ul className="space-y-2">
                {strategy.plan_estudio.map((paso, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 text-sm sm:text-base text-indigo-50 bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    <span className="w-6 h-6 rounded-full bg-indigo-500/50 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="flex-1 leading-snug">{paso}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botón para re-analizar o cerrar */}
            <div className="pt-2 flex justify-end gap-2 border-t border-indigo-800/60">
              <button
                type="button"
                onClick={() => setStrategy(null)}
                className="px-4 py-2 text-sm font-semibold text-indigo-200 hover:text-white rounded-lg min-h-[40px]"
              >
                Ocultar
              </button>
              <button
                type="button"
                onClick={generateStudyStrategy}
                disabled={loadingStrategy}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl min-h-[40px] transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingStrategy ? 'animate-spin' : ''}`} />
                <span>Volver a analizar</span>
              </button>
            </div>
          </section>
        )}

        {/* Formulario desplegable para crear o editar tarea */}
        {showAddForm && (
          <section className="bg-white rounded-2xl border-2 border-indigo-200 shadow-lg p-4 sm:p-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingTaskId ? (
                  <>
                    <Pencil className="w-5 h-5 text-indigo-600" />
                    Editar Tarea Escolar
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    Nueva Tarea Escolar
                  </>
                )}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                className="text-slate-500 hover:text-slate-800 min-h-[44px] min-w-[44px] flex items-center justify-center font-bold text-lg"
                aria-label="Cerrar formulario"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4">
              {formError && (
                <div role="alert" className="text-base text-rose-800 bg-rose-50 border-2 border-rose-300 rounded-xl p-3 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <span className="font-semibold leading-snug">{formError}</span>
                </div>
              )}

              {/* Título de la tarea con etiqueta visible y fuente >= 16px */}
              <div>
                <label htmlFor="task-title" className="block text-base font-bold text-slate-900 mb-1.5">
                  ¿Qué tenés que hacer? (Descripción de la tarea) *
                </label>
                <input
                  id="task-title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: Resolver ejercicios 1 al 15 de trigonometría"
                  className="w-full px-3.5 py-3 text-base text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-indigo-600 transition-colors min-h-[48px]"
                  autoFocus
                />
              </div>

              {/* Materia y Fecha con etiquetas visibles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="task-subject" className="block text-base font-bold text-slate-900 mb-1.5">
                    Materia escolar
                  </label>
                  <select
                    id="task-subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-3.5 py-3 text-base text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-indigo-600 transition-colors min-h-[48px]"
                  >
                    {PRESET_SUBJECTS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {subject === 'Otra materia' && (
                    <div className="mt-2.5">
                      <label htmlFor="custom-subject-input" className="block text-sm font-bold text-slate-900 mb-1">
                        Nombre de la otra materia *
                      </label>
                      <input
                        id="custom-subject-input"
                        type="text"
                        value={customSubject}
                        onChange={e => setCustomSubject(e.target.value)}
                        placeholder="Escribí el nombre de la materia"
                        className="w-full px-3.5 py-3 text-base text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white min-h-[48px]"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="task-date" className="block text-base font-bold text-slate-900 mb-1.5">
                    Fecha límite de entrega
                  </label>
                  <input
                    id="task-date"
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full px-3.5 py-3 text-base text-slate-900 bg-slate-50 border-2 border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white focus:border-indigo-600 transition-colors min-h-[48px]"
                  />
                </div>
              </div>

              {/* Prioridad con etiqueta visible */}
              <div>
                <label className="block text-base font-bold text-slate-900 mb-1.5">
                  Nivel de prioridad escolar
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPriority('alta')}
                    className={`py-2.5 px-3 text-base font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                      priority === 'alta'
                        ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0" />
                    Alta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('media')}
                    className={`py-2.5 px-3 text-base font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                      priority === 'media'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                    Media
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriority('baja')}
                    className={`py-2.5 px-3 text-base font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-2 min-h-[48px] ${
                      priority === 'baja'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                    Baja
                  </button>
                </div>
              </div>

              {/* Botón Guardar principal con alta jerarquía y Cancelar subordinado */}
              <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeForm}
                  className="w-full sm:w-auto px-5 py-3 text-base font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl min-h-[48px] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl transition-all shadow-md min-h-[48px]"
                >
                  {editingTaskId ? 'Guardar cambios' : 'Guardar tarea'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Sección de Filtros (Función 3) */}
        <section className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-base font-bold text-slate-900">
            <Filter className="w-4 h-4 text-indigo-600" />
            <span>Filtrar tareas escolares</span>
          </div>

          {/* Filtro por estado: Todas / Pendientes / Completadas */}
          <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`py-2.5 px-2 text-sm sm:text-base font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center text-center ${
                statusFilter === 'todas'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Todas ({tasks.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendientes')}
              className={`py-2.5 px-2 text-sm sm:text-base font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center text-center ${
                statusFilter === 'pendientes'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Pendientes ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completadas')}
              className={`py-2.5 px-2 text-sm sm:text-base font-bold rounded-lg transition-all min-h-[44px] flex items-center justify-center text-center ${
                statusFilter === 'completadas'
                  ? 'bg-white text-indigo-700 shadow-sm border border-slate-200'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Listas ({completedCount})
            </button>
          </div>

          {/* Filtro por materia */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <label htmlFor="filter-subject" className="text-base font-bold text-slate-900 whitespace-nowrap">
              Filtrar por materia:
            </label>
            <select
              id="filter-subject"
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base font-medium bg-slate-50 border-2 border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 min-h-[44px]"
            >
              <option value="todas">Todas las materias ({tasks.length})</option>
              {availableSubjects.map(subj => {
                const count = tasks.filter(t => t.subject === subj).length;
                return (
                  <option key={subj} value={subj}>
                    {subj} ({count})
                  </option>
                );
              })}
            </select>
          </div>
        </section>

        {/* Lista de Tareas (Función 1 y 2) */}
        <section className="space-y-3">
          {filteredTasks.length === 0 ? (
            tasks.length === 0 ? (
              /* Estado vacío motivador amigable cuando no hay ninguna tarea */
              <div className="bg-white rounded-2xl border-2 border-dashed border-indigo-200 p-8 sm:p-12 text-center shadow-xs">
                {/* Ilustración amigable de tiempo libre / mochila escolar */}
                <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
                  <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Mochila amigable */}
                    <path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10Z" />
                    <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    <path d="M8 21v-5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v5" />
                    <circle cx="12" cy="10" r="1" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                  ¡Todo al día! Disfrutá tu tiempo libre 🎒
                </h3>
                <p className="text-base text-slate-700 mt-2 max-w-md mx-auto leading-relaxed">
                  No tenés tareas escolares pendientes en este momento. ¡Aprovechá para descansar o repasar a tu propio ritmo!
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => {
                      setShowAddForm(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] rounded-xl shadow-md min-h-[48px]"
                  >
                    <Plus className="w-5 h-5" />
                    <span>Agregar Tarea</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Estado vacío cuando los filtros no coinciden */
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mb-3">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  No hay tareas con estos filtros
                </h3>
                <p className="text-base text-slate-700 mt-1 max-w-sm mx-auto">
                  Probá seleccionando "Todas" o cambiando el filtro de materia para ver el resto de tus entregas.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('todas');
                    setSubjectFilter('todas');
                  }}
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 text-base font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl min-h-[44px]"
                >
                  Ver todas las tareas
                </button>
              </div>
            )
          ) : (
            filteredTasks.map(task => {
              const friendlyDate = formatFriendlyDate(task.dueDate);
              const isOverdue =
                !task.completed &&
                task.dueDate &&
                new Date(task.dueDate).setHours(23, 59, 59, 999) < Date.now();

              return (
                <article
                  key={task.id}
                  className={`group relative bg-white rounded-2xl border-2 transition-all duration-200 p-4 shadow-xs flex items-start gap-3.5 ${
                    task.completed
                      ? 'border-slate-200 bg-slate-50/80 opacity-80'
                      : isOverdue
                      ? 'border-rose-300 bg-rose-50/20'
                      : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  {/* Botón táctil para marcar completada / pendiente (mínimo 48x48px para una sola mano) */}
                  <button
                    type="button"
                    onClick={() => toggleTaskStatus(task.id)}
                    aria-label={task.completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="min-h-[48px] min-w-[48px] -m-1.5 flex items-center justify-center text-slate-500 hover:text-indigo-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-xl transition-colors shrink-0"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    ) : (
                      <Circle className="w-7 h-7 text-slate-400 hover:text-indigo-600 transition-colors" />
                    )}
                  </button>

                  {/* Detalle de la tarea */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`text-base sm:text-lg font-bold cursor-pointer leading-snug break-words ${
                          task.completed
                            ? 'line-through text-slate-500'
                            : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Acciones de la tarea: Editar y Eliminar con confirmación rápida */}
                      {confirmDeleteId === task.id ? (
                        <div className="flex items-center gap-1.5 bg-rose-100 border-2 border-rose-300 rounded-xl px-2.5 py-1 shrink-0 -mr-1 -mt-1">
                          <span className="text-xs sm:text-sm font-bold text-rose-900">¿Eliminar?</span>
                          <button
                            type="button"
                            onClick={() => {
                              deleteTask(task.id);
                              setConfirmDeleteId(null);
                              if (editingTaskId === task.id) closeForm();
                            }}
                            className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg min-h-[36px]"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1 text-slate-600 hover:text-slate-900 rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center"
                            aria-label="Cancelar eliminación"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0 -mr-1 -mt-1">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(task)}
                            title="Editar tarea"
                            aria-label="Editar tarea"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-xl"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(task.id)}
                            title="Eliminar tarea"
                            aria-label="Eliminar tarea"
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-xl"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Metadatos tipográficos limpios con alto contraste y fuente >= 16px en elementos clave */}
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm sm:text-base text-slate-700">
                      {/* Materia */}
                      <span className="font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-indigo-600" />
                        {task.subject}
                      </span>

                      <span aria-hidden="true" className="text-slate-400 font-bold">·</span>

                      {/* Fecha de entrega */}
                      <span
                        className={`flex items-center gap-1.5 font-medium ${
                          isOverdue ? 'text-rose-700 font-bold' : 'text-slate-800'
                        }`}
                      >
                        <Calendar className="w-4 h-4" />
                        {friendlyDate}
                      </span>

                      <span aria-hidden="true" className="text-slate-400 font-bold">·</span>

                      {/* Prioridad con indicador de alto contraste */}
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            task.priority === 'alta'
                              ? 'bg-rose-600'
                              : task.priority === 'media'
                              ? 'bg-amber-600'
                              : 'bg-emerald-600'
                          }`}
                        />
                        <span>
                          Prioridad {task.priority === 'alta' ? 'Alta' : task.priority === 'media' ? 'Media' : 'Baja'}
                        </span>
                      </span>

                      <span aria-hidden="true" className="text-slate-400 font-bold">·</span>

                      {/* Estado */}
                      <span className={`font-bold ${task.completed ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {task.completed ? 'Completada' : 'Pendiente'}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* Botón flotante para celular (Zona de pulgar inferior para una sola mano) */}
      {!showAddForm && (
        <div className="fixed bottom-4 right-4 sm:hidden z-30">
          <button
            onClick={() => {
              setShowAddForm(true);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-16 h-16 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center active:scale-90 transition-transform font-bold"
            aria-label="Agregar Tarea"
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>
      )}
    </div>
  );
}
