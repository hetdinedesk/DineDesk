const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 12  // 96-bit IV for GCM
const TAG_LENGTH = 16 // 128-bit auth tag

function getKey() {
  const raw = process.env.POS_ENCRYPTION_KEY
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('POS_ENCRYPTION_KEY env var is required in production')
    }
    // Dev fallback — deterministic but never use in prod
    return crypto.scryptSync('dinedesk-dev-only', 'salt', KEY_LENGTH)
  }
  if (raw.length === 64) {
    return Buffer.from(raw, 'hex')
  }
  return crypto.scryptSync(raw, 'dinedesk-pos', KEY_LENGTH)
}

function encrypt(plaintext) {
  if (!plaintext) return null
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  // Format: iv(hex):tag(hex):ciphertext(hex)
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`
}

function decrypt(ciphertext) {
  if (!ciphertext) return null
  try {
    const key = getKey()
    const parts = ciphertext.split(':')
    if (parts.length !== 3) throw new Error('Invalid ciphertext format')
    const [ivHex, tagHex, encHex] = parts
    const iv = Buffer.from(ivHex, 'hex')
    const tag = Buffer.from(tagHex, 'hex')
    const encrypted = Buffer.from(encHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH })
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    return null
  }
}

function encryptJSON(obj) {
  if (!obj) return null
  return encrypt(JSON.stringify(obj))
}

function decryptJSON(ciphertext) {
  const raw = decrypt(ciphertext)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

module.exports = { encrypt, decrypt, encryptJSON, decryptJSON }
