const fs = require('fs');

function writeContractAddressesToFile(contractAddresses) {
  const filePath = 'contractAddresses.txt';
  const stream = fs.createWriteStream(filePath, { flags: 'a' });
  
  // Write each contract address to the file
  for (const [contractName, address] of Object.entries(contractAddresses)) {
    stream.write(`${contractName}: ${address}\n`);
  }
  
  stream.end();
  console.log('Contract addresses written to', filePath);
}

module.exports = writeContractAddressesToFile;