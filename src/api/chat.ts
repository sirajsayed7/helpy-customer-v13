import { getHelpyAccessToken } from './helpy'

const env = import.meta.env as Record<string, string | undefined>
const projectId = env.VITE_HELPY_FIREBASE_PROJECT_ID || 'helpy-61026'
const apiKey = env.VITE_HELPY_FIREBASE_API_KEY || ''
const tokenEndpoint = env.VITE_HELPY_CHAT_TOKEN_ENDPOINT || ''

export type ChatUser = { id: string; name: string; email: string; image: string; about: string; online: boolean; lastActive: string }
export type ChatMessage = { id: string; fromId: string; toId: string; body: string; sent: string; read: string; type: string }

type FirebaseSession = { idToken: string; localId: string; expiresAt: number }
type FirestoreValue = { stringValue?: string; integerValue?: string; booleanValue?: boolean; timestampValue?: string }
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> }

let session: FirebaseSession | null = null
const field = (document: FirestoreDocument, key: string) => document.fields?.[key]
const stringField = (document: FirestoreDocument, key: string) => String(field(document, key)?.stringValue ?? field(document, key)?.integerValue ?? '')

async function connect() {
  if (session && session.expiresAt > Date.now() + 60_000) return session
  if (!tokenEndpoint) throw new Error('Secure chat authentication is not configured yet.')
  if (!apiKey) throw new Error('Firebase web configuration is not configured yet.')
  const accessToken = getHelpyAccessToken()
  if (!accessToken) throw new Error('Sign in to Helpy before opening messages.')
  const tokenResponse = await fetch(tokenEndpoint, { headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } })
  const tokenPayload = await tokenResponse.json().catch(() => null) as { customToken?: string; token?: string; message?: string } | null
  const customToken = tokenPayload?.customToken || tokenPayload?.token
  if (!tokenResponse.ok || !customToken) throw new Error(tokenPayload?.message || 'The chat token endpoint did not return a Firebase custom token.')
  const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: customToken, returnSecureToken: true }) })
  const auth = await authResponse.json().catch(() => null) as { idToken?: string; localId?: string; expiresIn?: string; error?: { message?: string } } | null
  if (!authResponse.ok || !auth?.idToken || !auth.localId) throw new Error(auth?.error?.message || 'Firebase chat sign-in failed.')
  session = { idToken: auth.idToken, localId: auth.localId, expiresAt: Date.now() + Number(auth.expiresIn || 3600) * 1000 }
  return session
}

async function firestore(path: string, init?: RequestInit) {
  const auth = await connect()
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`, { ...init, headers: { Accept: 'application/json', Authorization: `Bearer ${auth.idToken}`, ...(init?.headers || {}) } })
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw new Error((payload as { error?: { message?: string } })?.error?.message || 'Unable to load chat data.')
  return payload
}

export const helpyChat = {
  get configured() { return Boolean(tokenEndpoint) },
  async getUsers() {
    const auth = await connect()
    const payload = await firestore('users?pageSize=100') as { documents?: FirestoreDocument[] }
    return (payload.documents || []).map(document => ({ id: stringField(document, 'id') || document.name.split('/').pop() || '', name: stringField(document, 'name') || stringField(document, 'email'), email: stringField(document, 'email'), image: stringField(document, 'image'), about: stringField(document, 'about'), online: Boolean(field(document, 'is_online')?.booleanValue), lastActive: stringField(document, 'last_active') })).filter(user => user.id && user.id !== auth.localId)
  },
  async getMessages(peerId: string) {
    const auth = await connect()
    const conversationId = [auth.localId, peerId].sort().join('_')
    const payload = await firestore(`chats/${conversationId}/messages?pageSize=100&orderBy=sent%20desc`) as { documents?: FirestoreDocument[] }
    return (payload.documents || []).map(document => ({ id: document.name.split('/').pop() || '', fromId: stringField(document, 'fromId'), toId: stringField(document, 'toId'), body: stringField(document, 'msg'), sent: stringField(document, 'sent'), read: stringField(document, 'read'), type: stringField(document, 'type') || 'text' })).reverse()
  },
  async sendMessage(peerId: string, body: string) {
    const auth = await connect()
    const sent = String(Date.now())
    const conversationId = [auth.localId, peerId].sort().join('_')
    await firestore(`chats/${conversationId}/messages?documentId=${sent}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { fromId: { stringValue: auth.localId }, toId: { stringValue: peerId }, msg: { stringValue: body }, read: { stringValue: '' }, sent: { stringValue: sent }, type: { stringValue: 'text' } } }) })
  },
  async currentUserId() { return (await connect()).localId },
}
