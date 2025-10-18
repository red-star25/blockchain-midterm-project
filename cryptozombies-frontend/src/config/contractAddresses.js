// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0x545BC97Bea893d06BAF8007CF23f11F7630FF43B",
  "zombieFactory": "0xC7658F981721BdeD4724C00836e7427c134011C3",
  "zombieFeeding": "0x3E8230f9E8d5A2D2d667932e7C2Ba022dA572357",
  "zombieHelper": "0x124Fe9f06cb2A5A2D883799284a8858B01241776",
  "zombieAttack": "0xB9Ae591c18d5fCF75b94Dabd692B73e16dEa5Bf0",
  "kittyCore": "0x0a5AA4B4A4aaa0Bd4B378a48C36944Da26376392"
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
