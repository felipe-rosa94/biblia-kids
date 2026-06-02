import {createContext, useContext, useState, useEffect, useCallback} from 'react'
import {onAuthStateChanged, signInWithPopup, signOut} from 'firebase/auth'
import {auth, googleProvider} from '../../lib/firebase'
import {getUserDoc, createUserDoc, updateLastLogin} from '../../lib/firestore'
import type {AppUser} from '../../types'

interface AuthContextValue {
    user: AppUser | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInAsAdmin: () => Promise<void>
    logout: () => Promise<void>
    // Chame após salvar progresso para refletir o novo XP na sidebar
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({children}: { children: React.ReactNode }) {
    const [user, setUser] = useState<AppUser | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
            if (!firebaseUser) {
                setUser(null)
                setLoading(false)
                return
            }

            try {
                const existing = await getUserDoc(firebaseUser.uid)
                if (existing) {
                    // Atualiza lastLoginAt sem bloquear o carregamento
                    updateLastLogin(firebaseUser.uid).catch(() => {
                    })
                    setUser(existing)
                } else {
                    const created = await createUserDoc(firebaseUser)
                    setUser(created)
                }
            } catch (err) {
                console.error('Erro ao carregar usuário do Firestore:', err)
                setUser(null)
            } finally {
                setLoading(false)
            }
        })

        return unsubscribe
    }, [])

    async function signInWithGoogle() {
        await signInWithPopup(auth, googleProvider)
        // onAuthStateChanged acima cuida do restante
    }

    // Mantido para o botão de dev na LoginPage — abre o mesmo popup Google
    const signInAsAdmin = signInWithGoogle

    async function logout() {
        await signOut(auth)
    }

    const refreshUser = useCallback(async () => {
        if (!auth.currentUser) return
        const updated = await getUserDoc(auth.currentUser.uid)
        if (updated) setUser(updated)
    }, [])

    return (
        <AuthContext.Provider value={{user, loading, signInWithGoogle, signInAsAdmin, logout, refreshUser}}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
    return ctx
}
