import { helpyApi } from './helpy'

const DEVICE_ID_KEY = 'helpy_web_device_id'

function getDeviceId() {
  const existing = window.sessionStorage.getItem(DEVICE_ID_KEY)
  if (existing) return existing
  const id = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`
  window.sessionStorage.setItem(DEVICE_ID_KEY, id)
  return id
}

export async function requestLoginOtp(email: string) {
  await helpyApi.sendLoginOtp(email.trim().toLowerCase())
}

export async function verifyLoginOtp(email: string, code: string) {
  await helpyApi.loginWithOtp({
    email: email.trim().toLowerCase(),
    code,
    deviceId: getDeviceId(),
    // The live API currently exposes only the APK's accepted device values.
    // Keep this compatibility value until the backend adds an explicit web type.
    deviceType: 'android',
  })
  return true
}
