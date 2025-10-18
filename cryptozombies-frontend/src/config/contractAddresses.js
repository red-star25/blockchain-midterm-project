// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0x0C6dFDFDdfFF93F100E12703D769b487c95ff0C0",
  "zombieFactory": "0x982aBE06e503c2ec175BF6e4f5a6Dc4De59a9F07",
  "zombieFeeding": "0x6869dD8C9eFC135182101c53DCfd871C7c781ea1",
  "zombieHelper": "0x620Fc652979D0d4B3956225A628b76Cd9D4b4bB5",
  "zombieAttack": "0x5C339251626c855E3F1e13821dFC1df2BC2E24d5",
  "kittyCore": "0xF9aB9C1C78E09494c293e00Eeaa22f1ce242d7cf"
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
