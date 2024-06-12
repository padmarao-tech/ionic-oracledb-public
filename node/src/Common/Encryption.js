const CryptoJS = require('crypto-js');

function decrypt(encryptedString, key) {
  // Parse the encrypted data from base64
  var parsedData = JSON.parse(CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(encryptedString)));

  // Extract salt, IV, ciphertext, and iterations from parsed data
  var salt = CryptoJS.enc.Hex.parse(parsedData.salt);
  var iv = CryptoJS.enc.Hex.parse(parsedData.iv);
  var ciphertext = parsedData.ciphertext;
  var iterations = parseInt(parsedData.iterations);

  // Derive the key using PBKDF2 with SHA512 hash
  var encryptMethodLength = 64; // Assuming encryptMethodLength is always 256 / 4
  var hashKey = CryptoJS.PBKDF2(key, salt, { hasher: CryptoJS.algo.SHA512, keySize: encryptMethodLength / 8, iterations: iterations });

  // Decrypt the ciphertext using AES-CBC
  var decrypted = CryptoJS.AES.decrypt(ciphertext, hashKey, { mode: CryptoJS.mode.CBC, iv: iv });

  // Convert the decrypted bytes to UTF-8 string
  return decrypted.toString(CryptoJS.enc.Utf8);
}

function encrypt(raw_string, key) {
  const iv = CryptoJS.lib.WordArray.random(16); // Generates a random initialization vector (IV)
  const salt = CryptoJS.lib.WordArray.random(256); // Generates a random salt
  const iterations = 999; // Number of iterations for key derivation
  const encryptMethodLength = 256 / 4; // Length of the encryption method divided by 4 (e.g., AES is 256 bits)

  // Derive the key using PBKDF2 with SHA512 hash
  const hashKey = CryptoJS.PBKDF2(key, salt, { hasher: CryptoJS.algo.SHA512, keySize: encryptMethodLength / 8, iterations: iterations });

  // Encrypt the raw string using AES-CBC mode with the derived key and IV
  const encrypted = CryptoJS.AES.encrypt(raw_string, hashKey, { mode: CryptoJS.mode.CBC, iv: iv });

  // Convert the encrypted ciphertext to Base64 string
  const encryptedString = CryptoJS.enc.Base64.stringify(encrypted.ciphertext);

  // Construct an output object containing ciphertext, IV, salt, and iterations
  const output = {
      ciphertext: encryptedString,
      iv: CryptoJS.enc.Hex.stringify(iv),
      salt: CryptoJS.enc.Hex.stringify(salt),
      iterations: iterations
  };

  // Convert the output object to a Base64 string and return
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(JSON.stringify(output)));
}


module.exports = { decrypt, encrypt };
