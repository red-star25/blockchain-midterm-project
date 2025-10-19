// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0xe5e9Ea9189C1f1E77275AC8B848DCDd5c8ecE286",
  "zombieFactory": "0xa1Ef4c5011Ed07d7301A455796b4e971a1a39187",
  "zombieFeeding": "0xAdA27c13E8826153B3560699ec678BD44b255E4D",
  "zombieHelper": "0x359cdEAeD6E3722Ba7E909f2b295EE8e0d2E8dA5",
  "zombieAttack": "0xd70f49486D9615048b969ce6c8F138f8df1B1EC0",
  "kittyCore": "0x7177cce16aE21BB0cD1859c1D2420c353C9BeBD5"
};

// Function to get contract address by name
export const getContractAddress = (contractName) => {
  return contractAddresses[contractName];
};

// Function to update contract addresses (used by deployment scripts)
export const updateContractAddresses = (newAddresses) => {
  Object.assign(contractAddresses, newAddresses);
};

export default contractAddresses;
