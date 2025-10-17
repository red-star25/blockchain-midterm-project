// Contract addresses configuration
// This file is automatically updated when contracts are deployed

const contractAddresses = {
  "zombieOwnership": "0xBB954240A241C029864fefFec575fD0fbed507A5",
  "zombieFactory": "0xa379F705971aC39a2D597cF9D5F336e1D80b8B8F",
  "zombieFeeding": "0x7Ed45fA6941169CaA84AC6B81CA0d15a8DC26B3a",
  "zombieHelper": "0x4df78327b1e9e966671F429981E5c6CB7Ace946f",
  "zombieAttack": "0xA4e2Ce0437f150D68211710ff15FB5045179e7Cb",
  "kittyCore": "0x22C23a20437Cb9EbeDBCDC97cB43d199f4D3E49D"
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
