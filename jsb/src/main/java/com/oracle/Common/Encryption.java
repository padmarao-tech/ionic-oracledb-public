package com.oracle.Common;

import javax.crypto.*;
import javax.crypto.spec.*;

import java.security.AlgorithmParameters;
import java.security.SecureRandom;
import java.security.spec.KeySpec;
import java.util.Base64;

import org.springframework.stereotype.Component;

@Component
public class Encryption {

  public String decrypt(String encryptedString, String key) throws Exception {
    byte[] decryptedData;
    if (encryptedString == null) {
      throw new IllegalArgumentException("Encrypted string is null");
    }

    try {
      // Decode the encrypted string from Base64
      byte[] decodedBytes = Base64.getDecoder().decode(encryptedString);

      // Parse the JSON object containing the ciphertext, IV, salt, and iterations
      String jsonString = new String(decodedBytes);
      jsonString = jsonString.replaceAll("\\{", "").replaceAll("\\}", ""); // Remove curly braces
      String[] parts = jsonString.split(",");
      String ciphertext = parts[0].split(":")[1].trim().replaceAll("\"", "");
      String ivHex = parts[1].split(":")[1].trim().replaceAll("\"", "");
      String saltHex = parts[2].split(":")[1].trim().replaceAll("\"", "");
      int iterations = Integer.parseInt(parts[3].split(":")[1].trim().replaceAll("\"", "").replaceAll("}", ""));

      // Convert hex strings to byte arrays
      byte[] salt = hexStringToByteArray(saltHex);
      byte[] iv = hexStringToByteArray(ivHex);
      byte[] cipherText = Base64.getDecoder().decode(ciphertext);

      // Derive the encryption key using PBKDF2
      SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
      KeySpec spec = new PBEKeySpec(key.toCharArray(), salt, iterations, 256);
      SecretKey tmp = factory.generateSecret(spec);
      SecretKeySpec secretKey = new SecretKeySpec(tmp.getEncoded(), "AES");

      // Decrypt the ciphertext using AES-CBC
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      cipher.init(Cipher.DECRYPT_MODE, secretKey, new IvParameterSpec(iv));
      decryptedData = cipher.doFinal(cipherText);
    } catch (BadPaddingException e) {
      // Handle decryption error
      throw new Exception("Decryption failed: Bad padding", e);
    } catch (Exception e) {
      // Handle other exceptions
      throw new Exception("Decryption failed", e);
    }

    return new String(decryptedData);
  }

  // Helper method to convert hex string to byte array
  private static byte[] hexStringToByteArray(String hex) {
    int len = hex.length();
    byte[] data = new byte[len / 2];
    for (int i = 0; i < len; i += 2) {
      data[i / 2] = (byte) ((Character.digit(hex.charAt(i), 16) << 4)
          + Character.digit(hex.charAt(i + 1), 16));
    }
    return data;
  }

  public static String encrypt(String plainText, String key) throws Exception {
    byte[] encryptedData;
    if (plainText == null) {
      throw new IllegalArgumentException("Plain text is null");
    }

    try {
      // Generate salt
      SecureRandom random = new SecureRandom();
      byte[] salt = new byte[16];
      random.nextBytes(salt);

      // Derive encryption key using PBKDF2
      SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA512");
      KeySpec spec = new PBEKeySpec(key.toCharArray(), salt, 65536, 256);
      SecretKey tmp = factory.generateSecret(spec);
      SecretKeySpec secretKey = new SecretKeySpec(tmp.getEncoded(), "AES");

      // Encrypt the plain text using AES-CBC
      Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
      cipher.init(Cipher.ENCRYPT_MODE, secretKey);
      AlgorithmParameters params = cipher.getParameters();
      byte[] iv = params.getParameterSpec(IvParameterSpec.class).getIV();
      encryptedData = cipher.doFinal(plainText.getBytes());

      // Encode ciphertext, IV, salt, and iterations into a JSON object and then into
      // Base64
      String jsonString = String.format("{\"ciphertext\":\"%s\",\"iv\":\"%s\",\"salt\":\"%s\",\"iterations\":%d}",
          Base64.getEncoder().encodeToString(encryptedData),
          bytesToHex(iv),
          bytesToHex(salt),
          65536);
      byte[] encodedBytes = jsonString.getBytes();
      return Base64.getEncoder().encodeToString(encodedBytes);
    } catch (Exception e) {
      // Handle encryption error
      throw new Exception("Encryption failed", e);
    }
  }

  // Helper method to convert byte array to hex string
  private static String bytesToHex(byte[] bytes) {
    StringBuilder result = new StringBuilder();
    for (byte b : bytes) {
      result.append(String.format("%02x", b));
    }
    return result.toString();
  }
}
