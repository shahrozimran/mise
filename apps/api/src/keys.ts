import { generateKeyPairSync, randomBytes } from "node:crypto";
const { privateKey, publicKey } = generateKeyPairSync("ed25519");
console.log(
  "ENTITLEMENT_PRIVATE_KEY=" +
    Buffer.from(privateKey.export({ format: "pem", type: "pkcs8" })).toString(
      "base64",
    ),
);
console.log("PURCHASE_ENCRYPTION_KEY=" + randomBytes(32).toString("hex"));
console.log(
  "EXPO_PUBLIC_ENTITLEMENT_KEY=" +
    Buffer.from(publicKey.export({ format: "der", type: "spki" }))
      .subarray(-32)
      .toString("hex"),
);
