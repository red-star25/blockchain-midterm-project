var safemath = artifacts.require("./safemath.sol");
var zombiefactory = artifacts.require("./zombiefactory.sol");
var zombiefeeding = artifacts.require("./zombiefeeding.sol");
var zombiehelper = artifacts.require("./zombiehelper.sol");
var zombieattack = artifacts.require("./zombieattack.sol");
var zombieownership = artifacts.require("./zombieownership.sol");
var kittyCore = artifacts.require("./KittyCore.sol");

const fs = require("fs");
const path = require("path");

module.exports = async function (deployer) {
  // Deploy contracts
  await deployer.deploy(safemath);
  await deployer.deploy(zombiefactory);
  await deployer.deploy(zombiefeeding);
  await deployer.deploy(zombiehelper);
  await deployer.deploy(zombieattack);
  await deployer.deploy(zombieownership);
  await deployer.deploy(kittyCore);

  const zombieOwnershipInstance = await zombieownership.deployed();
  const kittyCoreInstance = await kittyCore.deployed();

  await zombieOwnershipInstance.setKittyContractAddress(kittyCoreInstance.address);

  // Get deployed contract addresses
  const contractAddresses = {
    zombieOwnership: zombieownership.address,
    zombieFactory: zombiefactory.address,
    zombieFeeding: zombiefeeding.address,
    zombieHelper: zombiehelper.address,
    zombieAttack: zombieattack.address,
    kittyCore: kittyCore.address,
  };

  // Write addresses to contractAddresses.txt
  const addressesText = Object.entries(contractAddresses)
    .map(([name, address]) => `${name}: ${address}`)
    .join("\n");

  fs.writeFileSync("contractAddresses.txt", addressesText + "\n");

  // Write addresses to frontend config file
  const frontendConfigPath = path.join(
    __dirname,
    "../cryptozombies-frontend/src/config/contractAddresses.js"
  );
  const configContent = `// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = ${JSON.stringify(contractAddresses, null, 2)};

// Function to get contract address by name
export const getContractAddress = (contractName) => {
  return contractAddresses[contractName];
};

// Function to update contract addresses (used by deployment scripts)
export const updateContractAddresses = (newAddresses) => {
  Object.assign(contractAddresses, newAddresses);
};

export default contractAddresses;
`;

  fs.writeFileSync(frontendConfigPath, configContent);

  console.log("Contract addresses written to configuration files:");
  console.log(contractAddresses);
};
