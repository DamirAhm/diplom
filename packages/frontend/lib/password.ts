export async function hashPassword(password: string): Promise<string> {
  
  if (typeof window !== 'undefined') {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    return await crypto.subtle.digest('SHA-256', data).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    });
  }
  
  const nodeCrypto = require('crypto');
  return await nodeCrypto
    .createHash('sha256')
    .update(password)
    .digest('hex');
}