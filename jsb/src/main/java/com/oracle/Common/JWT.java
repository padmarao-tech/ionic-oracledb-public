package com.oracle.Common;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.SignatureException;
import io.jsonwebtoken.UnsupportedJwtException;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.util.Date;
import java.util.Map;

import org.springframework.stereotype.Service;

@Service
public class JWT {

    private PrivateKey privateKey;
    private PublicKey publicKey;

    public JWT() {
        // Initialize RSA keys from files or other sources
        // For this example, let's generate a new RSA key pair
        KeyPair keyPair = generateRSAKeyPair();
        this.privateKey = keyPair.getPrivate();
        this.publicKey = keyPair.getPublic();
    }

    // Method to generate RSA key pair
    private KeyPair generateRSAKeyPair() {
        try {
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
            keyPairGenerator.initialize(2048); // Key size is 2048 bits
            return keyPairGenerator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error generating RSA key pair: " + e.getMessage(), e);
        }
    }

    // Method to generate JWT token
    public String generateToken(Map<String, Object> payload) {
        long nowMillis = System.currentTimeMillis();
        Date now = new Date(nowMillis);

        return Jwts.builder()
                .setClaims(payload)
                .setIssuedAt(now)
                .setExpiration(new Date(nowMillis + 600000)) // Token expires in 3600000milli 1 hour
                .signWith(SignatureAlgorithm.RS256, privateKey)
                .compact();
    }

    // Method to validate JWT token
    public Claims validateToken(String token) {
        try {
            String jwtToken = token.substring(7); // Remove "Bearer " prefix

            // Parse JWT token
            Claims claims = Jwts.parser().setSigningKey(publicKey).parseClaimsJws(jwtToken).getBody();
            // return Jwts.parser()
            // .setSigningKey(publicKey)
            // .parseClaimsJws(token)
            // .getBody();
            return claims;
        } catch (MalformedJwtException e) {
            // Token parsing failed due to malformed token
            System.out.println(e);
            throw new RuntimeException("Malformed JWT token");
        } catch (SignatureException e) {
            // Token parsing failed due to invalid signature
            System.out.println(e);
            throw new RuntimeException("Invalid JWT token signature");
        } catch (ExpiredJwtException e) {
            // Token parsing failed due to expired token
            System.out.println(e);
            throw new RuntimeException("Expired JWT token");
        } catch (UnsupportedJwtException e) {
            // Token parsing failed due to unsupported JWT token
            System.out.println(e);
            throw new RuntimeException("Unsupported JWT token");
        } catch (IllegalArgumentException e) {
            // Token parsing failed due to illegal argument
            System.out.println(e);
            throw new RuntimeException("Illegal argument");
        } catch (Exception e) {
            // Other exceptions
            System.out.println(e);
            throw new RuntimeException("Error processing JWT token");
        }
        // return null;
    }

    public static void main(String[] args) {
        JWT jwt = new JWT();

        // Example payload
        Map<String, Object> payload = Map.of("userId", "123", "username", "john_doe");

        // Generate JWT token
        String token = jwt.generateToken(payload);
        System.out.println("Generated JWT token: " + token);

        // Validate token
        Claims claims = jwt.validateToken(token);
        System.out.println("Token claims: " + claims);
    }
}
// public class JWT {

// private PrivateKey privateKey;
// private PublicKey publicKey;

// public JWT() {
// // Initialize RSA keys from files or other sources
// this.privateKey = loadPrivateKeyFromFile("keys/jwt-private.key");
// this.publicKey = loadPublicKeyFromFile("keys/jwt-public.key");
// }

// public String generateToken(Object payload) {
// Date now = new Date();
// Date expiryDate = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes

// return Jwts.builder()
// .setIssuer(getDomainName())
// .setAudience(getDomainName())
// .setId("4f1g23a12aa")
// .setIssuedAt(now)
// .setNotBefore(now)
// .setExpiration(expiryDate)
// .claim("payload", payload)
// .signWith(SignatureAlgorithm.RS256, privateKey)
// .compact();
// }

// private String getDomainName() {
// // Implement your logic to get the domain name
// return "example.com";
// }

// // Load private key from file
// private PrivateKey loadPrivateKeyFromFile(String filename) {
// try {
// InputStream inputStream =
// getClass().getClassLoader().getResourceAsStream(filename);
// if (inputStream == null) {
// System.err.println("Private key file '" + filename + "' not found in
// resources directory");
// return null;
// }
// byte[] keyBytes = inputStream.readAllBytes();
// PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
// KeyFactory kf = KeyFactory.getInstance("RSA");
// return kf.generatePrivate(spec);
// } catch (Exception e) {
// System.err.println("Error loading private key from file: " + e.getMessage());
// return null;
// }
// }

// private PublicKey loadPublicKeyFromFile(String filename) {
// try {
// InputStream inputStream =
// getClass().getClassLoader().getResourceAsStream(filename);
// if (inputStream == null) {
// System.err.println("Public key file '" + filename + "' not found in resources
// directory");
// return null;
// }
// byte[] keyBytes = inputStream.readAllBytes();
// X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
// KeyFactory kf = KeyFactory.getInstance("RSA");
// return kf.generatePublic(spec);
// } catch (Exception e) {
// System.err.println("Error loading public key from file: " + e.getMessage());
// return null;
// }
// }

// public Map<String, Object> validateToken(String token) {
// if (token == null) {
// throw new IllegalArgumentException("JWT string cannot be null");
// }
// if (token.isEmpty()) {
// throw new IllegalArgumentException("JWT string cannot be empty");
// }
// Jws<Claims> jws = Jwts.parser()
// .setSigningKey(this.publicKey)
// .parseClaimsJws(token);
// Claims claims = jws.getBody();
// Date now = new Date();
// if (claims.getExpiration() != null && claims.getExpiration().before(now)) {
// throw new RuntimeException("Token is expired.");
// }
// System.out.println(claims);
// // Extracting claims and creating a Map
// Map<String, Object> claimsMap = new HashMap<>();
// claims.forEach((key, value) -> claimsMap.put(key, value));
// return claimsMap;
// }
// }

// *****************************************
// @Service
// public class JWT {

// private String privateKey;
// private PublicKey publicKey;

// public void JwtService() {
// // Load RSA keys from files
// // this.privateKey = loadPrivateKeyFromFile("jwt-private.key");
// // this.publicKey = loadPublicKeyFromFile("jwt-public.key");
// // this.privateKey = new GeneralFunctions().generateSecretKey();
// System.out.println(this.publicKey + ": is null");
// }

// public String generateToken(Object payload) {
// Date now = new Date();
// Date expiryDate = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
// // this.privateKey = loadPrivateKeyFromFile("jwt-private.key");
// this.privateKey = new GeneralFunctions().generateSecretKey();
// System.out.println(privateKey);
// return Jwts.builder()
// .setIssuer(getDomainName())
// .setAudience(getDomainName())
// .setId("4f1g23a12aa")
// .setIssuedAt(now)
// .setNotBefore(now)
// .setExpiration(expiryDate)
// .claim("payload", payload)
// .signWith(SignatureAlgorithm.HS512, privateKey)
// .compact();
// }

// private String getDomainName() {
// // Implement your logic to get the domain name
// return "example.com";
// }

// private PrivateKey loadPrivateKeyFromFile(String filename) {
// try {
// Path path = Paths.get(filename);
// byte[] keyBytes = Files.readAllBytes(path);
// PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
// KeyFactory kf = KeyFactory.getInstance("RSA");
// System.out.println("private Ex" + kf.generatePublic(spec));
// return kf.generatePrivate(spec);
// } catch (Exception e) {
// System.out.println("private" + e);
// e.printStackTrace();
// return null;
// }
// }

// private PublicKey loadPublicKeyFromFile(String filename) {
// try {
// Path path = Paths.get(filename);
// byte[] keyBytes = Files.readAllBytes(path);
// X509EncodedKeySpec spec = new X509EncodedKeySpec(keyBytes);
// KeyFactory kf = KeyFactory.getInstance("RSA");
// System.out.println("public" + kf.generatePublic(spec));

// return kf.generatePublic(spec);
// } catch (Exception e) {
// System.out.println("public Ex" + e);
// e.printStackTrace();
// return null;
// }
// }

// public Map<String, Object> validateToken(String token) {
// if (token == null) {
// throw new IllegalArgumentException("JWT string cannot be null");
// }

// if (token.isEmpty()) {
// throw new IllegalArgumentException("JWT string cannot be empty");
// }
// Jws<Claims> jws = Jwts.parser()
// .setSigningKey("MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAu1SU1LfVLPHCozMxH2Mo\r\n"
// + //
// "4lgOEePzNm0tRgeLezV6ffAt0gunVTLw7onLRnrq0/IzW7yWR7QkrmBL7jTKEn5u\r\n" + //
// "+qKhbwKfBstIs+bMY2Zkp18gnTxKLxoS2tFczGkPLPgizskuemMghRniWaoLcyeh\r\n" + //
// "kd3qqGElvW/VDL5AaWTg0nLVkjRo9z+40RQzuVaE8AkAFmxZzow3x+VJYKdjykkJ\r\n" + //
// "0iT9wCS0DRTXu269V264Vf/3jvredZiKRkgwlL9xNAwxXFg0x/XFw005UWVRIkdg\r\n" + //
// "cKWTjpBP2dPwVZ4WWC+9aGVd+Gyn1o0CLelf4rEjGoXbAAEgAqeGUxrcIlbjXfbc\r\n" + //
// "mwIDAQAB")
// .parseClaimsJws(token);

// Claims claims = jws.getBody();
// Date now = new Date();

// if (claims.getExpiration() != null && claims.getExpiration().before(now)) {
// throw new RuntimeException("Token is expired.");
// }
// System.out.println(claims);
// // Extracting claims and creating a Map
// Map<String, Object> claimsMap = new HashMap<>();
// claims.forEach((key, value) -> claimsMap.put(key, value));

// return claimsMap;
// }
// }

// import org.springframework.stereotype.Component;

// import io.jsonwebtoken.Claims;
// import io.jsonwebtoken.Jwts;
// import io.jsonwebtoken.SignatureAlgorithm;
// import java.util.Date;

// @Component
// public class JWT {
// // GeneralFunctions gn;

// public String generateToken(long userId) {
// Date now = new Date();
// Date expiryDate = new Date(now.getTime() + 10);

// return Jwts.builder()
// .setSubject(Long.toString(userId))
// .setIssuedAt(now)
// .setExpiration(expiryDate)
// .signWith(SignatureAlgorithm.HS512, new
// GeneralFunctions().generateSecretKey())
// .compact();
// // return new GeneralFunctions().generateSecretKey();
// }

// public Long getUserIdFromToken(String token) {
// Claims claims = Jwts.parser()
// .setSigningKey(new GeneralFunctions().generateSecretKey())
// .parseClaimsJws(token)
// .getBody();

// return Long.parseLong(claims.getSubject());
// }

// public boolean validateToken(String token) {
// try {
// Jwts.parser().setSigningKey(new
// GeneralFunctions().generateSecretKey()).parseClaimsJws(token);
// return true;
// } catch (Exception e) {
// return false;
// }
// }
// }
