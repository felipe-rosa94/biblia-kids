import {createContext, useContext, useState, useEffect, useCallback} from 'react'
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    signOut,
} from 'firebase/auth'
import {auth, googleProvider} from '../../lib/firebase'
import {getUserDoc, createUserDoc, updateLastLogin} from '../../lib/firestore'
import type {AppUser} from '../../types'

interface AuthContextValue {
    user: AppUser | null
    loading: boolean
    signInWithGoogle: () => Promise<void>
    signInWithEmail: (email: string, password: string) => Promise<void>
    signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
    signInAsAdmin: () => Promise<void>
    logout: () => Promise<void>
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
        try {
            await signInWithPopup(auth, googleProvider)
            localStorage.setItem('__debug_redirect', '[signInWithGoogle] popup OK')
        } catch (err: unknown) {
            const code = (err as { code?: string }).code ?? ''
            const msg = err instanceof Error ? `${err.name}(${code}): ${err.message}` : String(err)
            localStorage.setItem('__debug_redirect', `[signInWithGoogle ERRO] ${msg}`)
            throw err
        }
    }

    async function signInWithEmail(email: string, password: string) {
        await signInWithEmailAndPassword(auth, email, password)
    }

    async function signUpWithEmail(name: string, email: string, password: string) {
        const credential = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(credential.user, {displayName: name})
        // Força o onAuthStateChanged a ler o displayName atualizado
        await credential.user.reload()
    }

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
        <AuthContext.Provider value={{
            user,
            loading,
            signInWithGoogle,
            signInWithEmail,
            signUpWithEmail,
            signInAsAdmin,
            logout,
            refreshUser
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
    return ctx
}
