"use strict";

let blindSignatures = require("blind-signatures");
let IntelligenceAgency = require("./spyAgency.js").SpyAgency;

function createMessage(alias) {
  return "This document certifies that " + alias + " has top-level clearance.";
}

function conceal(msg, modulus, exponent) {
  return blindSignatures.blind({
    message: msg,
    N: modulus,
    E: exponent,
  });
}

function reveal(concealFactor, encryptedSig, modulus) {
  return blindSignatures.unblind({
    signed: encryptedSig,
    N: modulus,
    r: concealFactor,
  });
}

// Initialize the IntelligenceAgency
let agency = new IntelligenceAgency();
let aliases = [
  "Alpha One",
  "Beta Fox",
  "Delta Shadow",
  "Gamma Wolf",
  "Echo Viper",
  "Zeta Falcon",
  "Sigma Hawk",
  "Theta Lynx",
  "Omega Phantom",
  "Lambda Specter",
];

// Generate messages for each alias
let messages = aliases.map(createMessage);
let obscuredMessages = [];
let concealFactors = [];

// Conceal each message
messages.forEach(function (msg, idx) {
  let result = conceal(msg, agency.n, agency.e);
  let hiddenMsg = result.blinded;
  let concealFactor = result.r;

  console.log("🔹 Message " + idx + ": " + msg);
  console.log("🔹 Concealed: " + hiddenMsg + "\n🔹 Concealment Factor: " + concealFactor + "\n");

  obscuredMessages.push(hiddenMsg);
  concealFactors.push(concealFactor);
});

// Submit the concealed messages for signing
agency.signDocument(obscuredMessages, function (chosen, verifyAndSign) {
  console.log("✅ Chosen message number: " + chosen);

  let maskedFactors = concealFactors.map(function (r, idx) {
    return idx === chosen ? undefined : r;
  });

  let maskedMsgs = messages.map(function (msg, idx) {
    return idx === chosen ? undefined : msg;
  });

  try {
    let signedObscured = verifyAndSign(maskedFactors, maskedMsgs);
    let signedMsg = reveal(concealFactors[chosen], signedObscured, agency.n);

    console.log("\n✅ Message successfully signed!");
    console.log("📜 Original message: " + messages[chosen]);
    console.log("🖊 Signature: " + signedMsg);

    // Verify the signature
    let verification = blindSignatures.verify({
      message: messages[chosen],
      N: agency.n,
      E: agency.e,
      signed: signedMsg,
    });

    console.log("🔎 Signature verification result: " + (verification ? "✅ Valid" : "❌ Invalid"));
  } catch (error) {
    console.error("❌ Error during signing: " + error.message);
  }
});
