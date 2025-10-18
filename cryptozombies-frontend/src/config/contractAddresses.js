// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0xaA3BA316aa5Df45cB0E6Fa997112A288cb8e6A98",
  "zombieFactory": "0xCb7a2C41dB2678973DcE62de321A8d8C268f4A64",
  "zombieFeeding": "0xDBbA0F2211e13E536fAcAc00ED174A46084f9B04",
  "zombieHelper": "0x8a199A4aF5887389D8B7D158f7008a6c1B567acA",
  "zombieAttack": "0xddEA9d53B1254bB52aA22559AA163A9505b32446",
  "kittyCore": "0x8BD70a815FAA94ab6C78F0b60900863179C1f6FC"
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
