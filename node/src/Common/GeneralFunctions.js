// your_functions.js

// Function to generate a secret key
function generateSecretKey(strength = 16) {
  const permittedChars =
    "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (permittedChars.length < strength) {
    throw new Error(
      "Strength should not be greater than " + permittedChars.length
    );
  }

  let randomString = "";
  for (let i = 0; i < strength; i++) {
    randomString += permittedChars.charAt(
      Math.floor(Math.random() * permittedChars.length)
    );
  }

  return randomString;
}

// Function to get server time
function getServerTime() {
  // Implement your logic here
  return new Date().toISOString();
}

function addGeneralHeaders() {
  
}

function getIPAddress(req) {
  const forwardedIpsStr = req.headers['x-forwarded-for'];
  if (forwardedIpsStr) {
      // 'x-forwarded-for' header may return multiple IP addresses in the format: client IP, proxy 1 IP, proxy 2 IP,...
      const forwardedIps = forwardedIpsStr.split(',');
      // The first IP in the list is the client IP address
      return forwardedIps[0];
  }
  // If 'x-forwarded-for' is not present, use 'remoteAddress' property of the request object
  return req.connection.remoteAddress;
}

module.exports = { generateSecretKey, getServerTime, getIPAddress };
