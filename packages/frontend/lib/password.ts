export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== "undefined") {
    const { sha256 } = (await import("js-sha256")).default;

    return sha256(password);
  }

  const nodeCrypto = require("crypto");
  return await nodeCrypto.createHash("sha256").update(password).digest("hex");
}
