import * as CryptoJS from 'crypto-js';

const key = CryptoJS.enc.Utf8.parse('1234123412QWERTY'); // 十六位十六进制数作为密钥
const iv = CryptoJS.enc.Utf8.parse('QWERTY1234123412'); // 十六位十六进制数作为密钥偏移量

export function setToken({ password, username }: { password: string; username: string }): string {
  const str = CryptoJS.enc.Utf8.parse(JSON.stringify({ password, username }));
  const encrypted = CryptoJS.AES.encrypt(str, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString().toUpperCase();
}

export function getDecodeToken(token: string): string {
  const encryptedHexStr = CryptoJS.enc.Hex.parse(token);
  const str = CryptoJS.enc.Base64.stringify(encryptedHexStr);
  const decrypt = CryptoJS.AES.decrypt(str, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  const decryptedStr = decrypt.toString(CryptoJS.enc.Utf8);
  return decryptedStr.toString();
}

export default { setToken, getDecodeToken };
