import {useEffect, useState} from 'react'
import {useNavigate} from 'react-router-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {useAuth} from '../features/auth/useAuth'
import {BibleIcon} from '../assets/BibleIcon'

type EmailMode = 'login' | 'signup'

const FIREBASE_ERRORS: Record<string, string> = {
    'auth/invalid-credential': 'Email ou senha incorretos.',
    'auth/user-not-found': 'Nenhuma conta com esse email.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/email-already-in-use': 'Esse email já está cadastrado.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/invalid-email': 'Email inválido.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
}

const FIELD =
    'w-full border border-gray-200 rounded-xl px-4 py-3 font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1CB0F6]/40 text-sm'

export function LoginPage() {
    const {user, signInWithGoogle, signInWithEmail, signUpWithEmail, signInAsAdmin} = useAuth()
    const navigate = useNavigate()

    const [showEmail, setShowEmail] = useState(false)
    const [mode, setMode] = useState<EmailMode>('login')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user) navigate(user.role === 'admin' ? '/admin' : '/dashboard', {replace: true})
    }, [user, navigate])

    function resetForm() {
        setName('')
        setEmail('')
        setPassword('')
        setError(null)
    }

    function handleToggleMode() {
        setMode(m => m === 'login' ? 'signup' : 'login')
        setError(null)
    }

    function handleToggleEmail() {
        setShowEmail(v => !v)
        resetForm()
    }

    async function handleEmailSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (mode === 'login') {
                await signInWithEmail(email, password)
            } else {
                await signUpWithEmail(name.trim(), email, password)
            }
        } catch (err: unknown) {
            const code = (err as {code?: string}).code ?? ''
            setError(FIREBASE_ERRORS[code] ?? 'Ocorreu um erro. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#1CB0F6] to-[#CE82FF] flex flex-col items-center justify-center px-6 font-nunito">
            <motion.div
                initial={{scale: 0.85, opacity: 0}}
                animate={{scale: 1, opacity: 1}}
                transition={{type: 'spring', stiffness: 220, damping: 20}}
                className="flex flex-col items-center gap-6 bg-white rounded-3xl px-8 py-10 shadow-2xl w-full max-w-sm"
            >
                {/* Mascote */}
                <motion.div
                    animate={{y: [0, -6, 0]}}
                    transition={{repeat: Infinity, duration: 2.5, ease: 'easeInOut'}}
                >
                    <BibleIcon className="w-24 h-24"/>
                </motion.div>

                {/* Título */}
                <div className="text-center">
                    <h1 className="text-4xl font-black text-gray-800 leading-tight">Bíblia Kids</h1>
                    <p className="text-gray-500 font-bold mt-2 text-base">
                        Aprenda a Palavra de Deus jogando!
                    </p>
                </div>

                {/* Botão Google */}
                <motion.button
                    whileTap={{scale: 0.97}}
                    whileHover={{scale: 1.02}}
                    onClick={signInWithGoogle}
                    className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-2xl py-4 px-6 font-extrabold text-gray-700 shadow-md hover:shadow-lg transition-shadow text-base"
                >
                    <GoogleColorIcon/>
                    Entrar com Google
                </motion.button>

                {/* Divisor */}
                <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 h-px bg-gray-200"/>
                    <span className="text-xs font-bold text-gray-400">ou</span>
                    <div className="flex-1 h-px bg-gray-200"/>
                </div>

                {/* Toggle email/senha */}
                <button
                    onClick={handleToggleEmail}
                    className="w-full py-3.5 px-6 rounded-2xl border-2 border-[#1CB0F6]/30 text-[#1CB0F6] font-extrabold text-base hover:bg-[#1CB0F6]/5 transition-colors"
                >
                    {showEmail ? '✕ Fechar' : '✉️ Entrar com email'}
                </button>

                {/* Formulário email/senha */}
                <AnimatePresence>
                    {showEmail && (
                        <motion.form
                            key="email-form"
                            initial={{opacity: 0, height: 0}}
                            animate={{opacity: 1, height: 'auto'}}
                            exit={{opacity: 0, height: 0}}
                            className="overflow-hidden w-full"
                            onSubmit={handleEmailSubmit}
                        >
                            <div className="flex flex-col gap-3 pt-1">
                                {/* Tabs login / cadastro */}
                                <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm font-extrabold">
                                    <button
                                        type="button"
                                        onClick={() => { setMode('login'); setError(null) }}
                                        className={`flex-1 py-2 transition-colors ${mode === 'login' ? 'bg-[#1CB0F6] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Entrar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setMode('signup'); setError(null) }}
                                        className={`flex-1 py-2 transition-colors ${mode === 'signup' ? 'bg-[#1CB0F6] text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                                    >
                                        Cadastrar
                                    </button>
                                </div>

                                <AnimatePresence mode="wait">
                                    {mode === 'signup' && (
                                        <motion.input
                                            key="name"
                                            initial={{opacity: 0, height: 0}}
                                            animate={{opacity: 1, height: 'auto'}}
                                            exit={{opacity: 0, height: 0}}
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                            placeholder="Seu nome"
                                            required
                                            className={FIELD}
                                        />
                                    )}
                                </AnimatePresence>

                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="Email"
                                    required
                                    autoComplete="email"
                                    className={FIELD}
                                />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="Senha"
                                    required
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    className={FIELD}
                                />

                                {error && (
                                    <p className="text-xs font-bold text-[#FF4B4B] text-center">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-[#1CB0F6] hover:bg-[#0094d4] text-white font-extrabold py-3.5 rounded-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading
                                        ? 'Aguarde…'
                                        : mode === 'login' ? 'Entrar' : 'Criar conta'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleToggleMode}
                                    className="text-xs text-gray-400 font-bold hover:text-gray-600 text-center"
                                >
                                    {mode === 'login'
                                        ? 'Não tem conta? Cadastre-se'
                                        : 'Já tem conta? Entrar'}
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                <p className="text-xs text-gray-400 text-center font-semibold leading-relaxed">
                    Para professores e líderes, peça ao administrador para liberar seu acesso.
                </p>

                <span className="text-[10px] text-gray-300 font-semibold">v{__APP_VERSION__}</span>

                {import.meta.env.DEV && (
                    <button
                        onClick={signInAsAdmin}
                        className="text-xs text-[#CE82FF] font-bold hover:underline mt-[-8px]"
                    >
                        ⚙️ Entrar como Admin (modo dev)
                    </button>
                )}
            </motion.div>
        </div>
    )
}

function GoogleColorIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107"
                  d="M43.6 20H24v8h11.3C33.7 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 20-8 20-20 0-1.3-.1-2.7-.4-4z"/>
            <path fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.5 15.2 18.9 12 24 12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.6 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
            <path fill="#4CAF50"
                  d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.7-2.6-11.3-7l-6.5 5C9.6 40 16.4 44 24 44z"/>
            <path fill="#1976D2"
                  d="M43.6 20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.7l6.2 5.2C41.5 35.6 44 30.2 44 24c0-1.3-.1-2.7-.4-4z"/>
        </svg>
    )
}
