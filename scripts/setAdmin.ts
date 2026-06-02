/**
 * Promove um usuário para o papel de admin no Firestore.
 *
 * Pré-requisito: o usuário já deve ter feito login pelo menos uma vez
 * para que seu documento exista na coleção `users`.
 *
 * Configuração:
 *   1. Gere uma chave de conta de serviço no Firebase Console:
 *      Configurações do projeto → Contas de serviço → Gerar nova chave privada
 *   2. Salve o arquivo JSON como `scripts/serviceAccount.json` (não comite esse arquivo!)
 *
 * Uso:
 *   npx tsx scripts/setAdmin.ts professor@email.com
 */

import * as admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const serviceAccount = JSON.parse(
  readFileSync(resolve(__dirname, 'serviceAccount.json'), 'utf-8')
)

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
})

const db = admin.firestore()

async function setAdmin(email: string) {
  const snapshot = await db.collection('users').where('email', '==', email).get()

  if (snapshot.empty) {
    console.error(`Usuário com email "${email}" não encontrado.`)
    console.error('O usuário precisa ter feito login pelo menos uma vez.')
    process.exit(1)
  }

  const userDoc = snapshot.docs[0]
  await userDoc.ref.update({ role: 'admin' })
  console.log(`✅  Usuário ${email} (uid: ${userDoc.id}) agora é admin.`)
}

const email = process.argv[2]
if (!email) {
  console.error('Uso: npx tsx scripts/setAdmin.ts email@exemplo.com')
  process.exit(1)
}

setAdmin(email).catch(err => {
  console.error('Erro:', err)
  process.exit(1)
})
