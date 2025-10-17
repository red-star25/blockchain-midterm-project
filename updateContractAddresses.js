#!/usr/bin/env node

/**
 * Script to manually update contract addresses in the frontend configuration
 * Usage: node updateContractAddresses.js <contractName> <newAddress>
 * Example: node updateContractAddresses.js zombieOwnership 0x1234...
 */

const fs = require("fs");
const path = require("path");

function updateContractAddress(contractName, newAddress) {
  const configPath = path.join(
    __dirname,
    "cryptozombies-frontend/src/config/contractAddresses.js"
  );

  try {
    // Read the current config file
    let configContent = fs.readFileSync(configPath, "utf8");

    // Find and replace the contract address
    const regex = new RegExp(`(${contractName}:\\s*")[^"]*(")`, "g");
    const updatedContent = configContent.replace(regex, `$1${newAddress}$2`);

    if (updatedContent === configContent) {
      console.error(
        `Contract name "${contractName}" not found in configuration.`
      );
      console.log(
        "Available contracts:",
        [
          "zombieOwnership",
          "zombieFactory",
          "zombieFeeding",
          "zombieHelper",
          "zombieAttack",
          "kittyCore",
        ].join(", ")
      );
      process.exit(1);
    }

    // Write the updated content
    fs.writeFileSync(configPath, updatedContent);
    console.log(
      `Successfully updated ${contractName} address to ${newAddress}`
    );
  } catch (error) {
    console.error("Error updating contract address:", error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
if (args.length !== 2) {
  console.log(
    "Usage: node updateContractAddresses.js <contractName> <newAddress>"
  );
  console.log(
    "Example: node updateContractAddresses.js zombieOwnership 0x1234..."
  );
  process.exit(1);
}

const [contractName, newAddress] = args;

// Validate address format
if (!/^0x[a-fA-F0-9]{40}$/.test(newAddress)) {
  console.error(
    "Invalid address format. Address must be 40 hex characters prefixed with 0x"
  );
  process.exit(1);
}

updateContractAddress(contractName, newAddress);
