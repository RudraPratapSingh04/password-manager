const crypto = require("crypto");
const fs = require("fs");

const algorithm = "aes-256-cbc";
const secretKey = crypto.scryptSync("your-secret-passphrase", "salt", 32);
const passcode = "12345678";

const encrypt = (text) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
};

const decrypt = (hash) => {
  const [ivHex, encryptedHex] = hash.split(":");
  const decipher = crypto.createDecipheriv(
    algorithm,
    secretKey,
    Buffer.from(ivHex, "hex")
  );
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, "hex")),
    decipher.final(),
  ]);
  return decrypted.toString();
};

const savePasswords = (passwords) => {
  fs.writeFileSync("passwords.json", JSON.stringify(passwords, null, 2));
};

const loadPasswords = () => {
  if (!fs.existsSync("passwords.json")) return [];
  return JSON.parse(fs.readFileSync("passwords.json"));
};

const verifyPasscode = (input) => {
  return input === passcode;
};

module.exports = {
  encrypt,
  decrypt,
  savePasswords,
  loadPasswords,
  verifyPasscode,
};
