export async function hashPassword(password: string): Promise<string> {
  // This function must match the Go implementation:
  // hash := sha256.New()
  // hash.Write([]byte(password))
  // return hex.EncodeToString(hash.Sum(nil))
  
  // For browsers, use the Web Crypto API which provides SHA-256
  if (typeof window !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return await crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }
  
  // For Node.js environment
  const nodeCrypto = require('crypto');
  return await nodeCrypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}