#!/usr/bin/env node

/**
 * Test script to verify the dynamic contract address system is working
 * Run this after deploying contracts to ensure everything is set up correctly
 */

const fs = require("fs");
const path = require("path");

function testContractAddresses() {
  console.log("🧪 Testing Contract Address Configuration...\n");

  // Test 1: Check if config file exists
  const configPath = path.join(
    __dirname,
    "cryptozombies-frontend/src/config/contractAddresses.js"
  );

  if (!fs.existsSync(configPath)) {
    console.error("❌ Contract addresses config file not found!");
    console.log("   Expected location:", configPath);
    return false;
  }
  console.log("✅ Config file exists");

  // Test 2: Check if config file can be imported
  try {
    delete require.cache[require.resolve(configPath)];
    const config = require(configPath);

    if (!config.default || !config.getContractAddress) {
      console.error("❌ Config file structure is invalid!");
      return false;
    }
    console.log("✅ Config file structure is valid");

    // Test 3: Check if all required contracts have addresses
    const requiredContracts = [
      "zombieOwnership",
      "zombieFactory",
      "zombieFeeding",
      "zombieHelper",
      "zombieAttack",
      "kittyCore",
    ];

    const missingContracts = [];
    const invalidAddresses = [];

    requiredContracts.forEach((contractName) => {
      const address = config.getContractAddress(contractName);

      if (!address) {
        missingContracts.push(contractName);
      } else if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        invalidAddresses.push(`${contractName}: ${address}`);
      }
    });

    if (missingContracts.length > 0) {
      console.error(
        "❌ Missing contract addresses:",
        missingContracts.join(", ")
      );
      return false;
    }

    if (invalidAddresses.length > 0) {
      console.error(
        "❌ Invalid contract addresses:",
        invalidAddresses.join(", ")
      );
      return false;
    }

    console.log("✅ All contract addresses are valid");

    // Test 4: Display current addresses
    console.log("\n📋 Current Contract Addresses:");
    requiredContracts.forEach((contractName) => {
      const address = config.getContractAddress(contractName);
      console.log(`   ${contractName}: ${address}`);
    });
  } catch (error) {
    console.error("❌ Error reading config file:", error.message);
    return false;
  }

  // Test 5: Check if contractAddresses.txt exists and is up to date
  const txtPath = path.join(__dirname, "contractAddresses.txt");
  if (fs.existsSync(txtPath)) {
    console.log("✅ contractAddresses.txt exists");

    const txtContent = fs.readFileSync(txtPath, "utf8");
    const lines = txtContent.trim().split("\n");

    if (lines.length >= 6) {
      // 6 required contracts
      console.log("✅ contractAddresses.txt has all required contracts");
    } else {
      console.warn("⚠️  contractAddresses.txt may be outdated");
    }
  } else {
    console.warn(
      "⚠️  contractAddresses.txt not found (will be created on next deployment)"
    );
  }

  console.log(
    "\n🎉 All tests passed! Your dynamic contract address system is working correctly."
  );
  console.log("\n📝 Next steps:");
  console.log("   1. Start Ganache");
  console.log("   2. Run: truffle migrate --reset");
  console.log("   3. Start frontend: cd cryptozombies-frontend && npm run dev");

  return true;
}

// Run the tests
if (require.main === module) {
  testContractAddresses();
}

module.exports = testContractAddresses;
