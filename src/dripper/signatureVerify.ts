import { hexToBytes } from "@noble/hashes/utils";
import { ed25519, sr25519, ss58Decode } from "@polkadot-labs/hdkd-helpers";
import { logger } from "#src/logger";

const MAX_MESSAGE_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Verify a signed message from a Polkadot wallet.
 * The message format is "faucet:{address}:{timestamp}".
 * The signature must come from the account matching the drip address.
 *
 * Tries multiple message encodings and key types since different signers
 * (polkadot.js, Spektr) may handle wrapping and key types differently.
 */
export function verifySignature(signature: string, message: string, address: string): boolean {
  try {
    // Validate message format: "faucet:{address}:{timestamp}"
    const parts = message.split(":");
    if (parts.length !== 3 || parts[0] !== "faucet") {
      logger.debug("Invalid message format");
      return false;
    }

    const [, messageAddress, timestampStr] = parts;

    // Address in message must match drip address
    if (messageAddress !== address) {
      logger.debug("Message address does not match drip address");
      return false;
    }

    // Check timestamp freshness
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Date.now() - timestamp > MAX_MESSAGE_AGE_MS) {
      logger.debug("Message timestamp expired or invalid");
      return false;
    }

    // Decode SS58 address to get the public key
    const [publicKeyBytes] = ss58Decode(address);

    // Remove 0x prefix from signature
    const sigHex = signature.startsWith("0x") ? signature.slice(2) : signature;
    const sigBytes = hexToBytes(sigHex);

    const encoder = new TextEncoder();

    // Build candidate messages that various signers may produce
    const rawBytes = encoder.encode(message);
    const wrappedBytes = encoder.encode(`<Bytes>${message}</Bytes>`);

    // Also try hex-encoded message variants (if client hex-encodes before signRaw)
    const hexMessage =
      "0x" +
      Array.from(rawBytes)
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const hexRawBytes = encoder.encode(hexMessage);
    const hexWrappedBytes = encoder.encode(`<Bytes>${hexMessage}</Bytes>`);

    const candidates = [rawBytes, wrappedBytes, hexRawBytes, hexWrappedBytes];

    // Try both sr25519 and ed25519
    const curves = [
      { name: "sr25519", verify: sr25519.verify },
      { name: "ed25519", verify: ed25519.verify },
    ];

    for (const curve of curves) {
      for (let i = 0; i < candidates.length; i++) {
        try {
          if (curve.verify(sigBytes, candidates[i], publicKeyBytes)) {
            logger.debug(`Signature verified with ${curve.name}, candidate ${i}`);
            return true;
          }
        } catch {
          // Some curve/candidate combos may throw, continue trying
        }
      }
    }

    logger.debug(
      `Signature verification failed for all candidates. ` +
        `pubkey=${Buffer.from(publicKeyBytes).toString("hex")}, ` +
        `sig=${sigHex.slice(0, 16)}..., ` +
        `message=${message}`,
    );
    return false;
  } catch (e) {
    logger.error("Signature verification error", e);
    return false;
  }
}
