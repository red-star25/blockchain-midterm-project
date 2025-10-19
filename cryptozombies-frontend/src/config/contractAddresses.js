// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0x27b1CD571909dbecac0f4252566249ea3B9813E4",
  "zombieFactory": "0x73eB3f4DaFd2A7dA768B319a471A7ec9BB0BB71d",
  "zombieFeeding": "0x1C967399f95faB6A415a0DaFAA824A03D7523F6e",
  "zombieHelper": "0xEEcdd3216d7085cAd7eBA8896C49fc99BF890A4F",
  "zombieAttack": "0x7167a1cc8e226413c7b225e552c669AdC66dc9bd",
  "kittyCore": "0xda902CF27578e6e5D6c122d5595806C6675a8744"
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
