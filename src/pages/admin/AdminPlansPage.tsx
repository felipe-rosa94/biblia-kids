import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getStudyPlans, deleteStudyPlan } from '../../lib/firestore'
import type { StudyPlan } from '../../types'

export function AdminPlansPage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<StudyPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    getStudyPlans()
      .then(setPlans)
      .catch(err => { console.error('Erro ao carregar planos:', err); setError('Não foi possível carregar os planos.') })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(planId: string) {
    setDeletingId(planId)
    try {
      await deleteStudyPlan(planId)
      setPlans(prev => prev.filter(p => p.id !== planId))
    } catch {
      alert('Não foi possível excluir o plano. Tente novamente.')
    } finally {
      setDeletingId(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Planos de Estudo</h1>
          <p className="text-sm text-gray-500 font-semibold mt-1">
            Selecione um plano para gerenciar suas lições
          </p>
        </div>
        <button
          onClick={() => navigate('/admin/plans/new')}
          className="bg-[#CE82FF] text-white font-extrabold text-sm py-2 px-3 sm:py-2.5 sm:px-5 rounded-xl hover:bg-[#b86fe0] transition-colors active:scale-95"
        >
          + Novo plano
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-[#CE82FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">⚠️</p>
          <p className="font-bold text-gray-500">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#CE82FF]/40 transition-all group relative"
            >
              {/* Área clicável principal */}
              <button
                onClick={() => navigate(`/admin/plans/${plan.id}`)}
                className="w-full text-left p-6 pr-24"
              >
                <div className="w-12 h-12 rounded-xl bg-[#CE82FF]/15 flex items-center justify-center text-2xl mb-4">
                  📚
                </div>
                <p className="text-xs font-black text-[#9333EA] uppercase tracking-widest mb-1">
                  {plan.year}
                </p>
                <h2 className="text-lg font-extrabold text-gray-800 leading-tight mb-2">
                  {plan.title}
                </h2>
                <p className="text-sm text-gray-500 font-semibold leading-snug line-clamp-2">
                  {plan.description}
                </p>
                <div className="mt-4 text-xs font-bold text-[#9333EA] flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ver lições →
                </div>
              </button>

              {/* Botões de ação */}
              <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                <button
                  onClick={() => navigate(`/admin/plans/${plan.id}/edit`)}
                  title="Editar plano"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-[#CE82FF]/15 text-gray-400 hover:text-[#9333EA] transition-colors flex items-center justify-center text-sm"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setConfirmId(plan.id)}
                  title="Excluir plano"
                  className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-[#FF4B4B]/15 text-gray-400 hover:text-[#FF4B4B] transition-colors flex items-center justify-center text-sm"
                >
                  🗑️
                </button>
              </div>
            </motion.div>
          ))}

          {plans.length === 0 && (
            <div className="sm:col-span-2 text-center py-16 text-gray-400">
              <p className="text-5xl mb-4">📭</p>
              <p className="font-bold text-lg text-gray-500">Nenhum plano cadastrado</p>
              <p className="text-sm">Clique em "Novo plano" para começar.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmação de exclusão */}
      <AnimatePresence>
        {confirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setConfirmId(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full"
            >
              <p className="text-4xl text-center mb-3">🗑️</p>
              <h2 className="text-lg font-black text-gray-800 text-center mb-2">Excluir plano?</h2>
              <p className="text-sm text-gray-500 font-semibold text-center mb-6">
                Esta ação não pode ser desfeita. Todas as lições e questões vinculadas a este plano serão excluídas.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmId(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(confirmId)}
                  disabled={deletingId === confirmId}
                  className="flex-1 py-2.5 rounded-xl font-extrabold text-white bg-[#FF4B4B] hover:bg-[#e03e3e] transition-colors disabled:opacity-50"
                >
                  {deletingId === confirmId ? 'Excluindo…' : 'Excluir'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
