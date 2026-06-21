import crypto from "crypto";

const RSA_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCqA3yLkNr84HWirT/KB3UwzrxQ
w3ccH+NARUeQZYDmPZ6V0d0vHGUNMx95XTT7pQDcD7SpmQuoCWN02qgPkYHXzrIf
fFf3LGuhQYK/8mrR4/SpKFEhQVoXeYz7iwHmEcMf73JVJGMjulVD7/OXaebf1CO3
5rKCY11BFkqo7HzHHQIDAQAB
-----END PUBLIC KEY-----`;

export function generateAesKey() {
  const u = crypto.randomUUID();
  const hexKey = u.slice(0, 8) + u.slice(9, 13) + u.slice(14, 18);
  return Buffer.from(hexKey, "utf-8");
}

export function aesEncrypt(key, plaintext) {
  const rem = plaintext.length % 16;
  if (rem !== 0) {
    plaintext = Buffer.concat([plaintext, Buffer.alloc(16 - rem)]);
  }
  const cipher = crypto.createCipheriv("aes-128-cbc", key, key);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(plaintext), cipher.final()]);
}

export function rsaEncrypt(data) {
  return crypto.publicEncrypt(
    { key: RSA_PUBLIC_KEY_PEM, padding: crypto.constants.RSA_PKCS1_PADDING },
    data
  );
}

export function buildPayload(requestObj) {
  const plaintext = Buffer.from(JSON.stringify(requestObj), "utf-8");
  const aesKey = generateAesKey();
  const aesKeyB64 = aesKey.toString("base64");
  const ciphertext = aesEncrypt(aesKey, plaintext);
  const rsaCiphertext = rsaEncrypt(Buffer.from(aesKeyB64, "utf-8"));
  const jsonStr = `{"data":"${ciphertext.toString("base64")}","key":"${rsaCiphertext.toString("base64")}"}`;
  return Buffer.from(jsonStr).toString("base64");
}
