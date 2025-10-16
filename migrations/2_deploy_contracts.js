var safemath = artifacts.require('./safemath.sol');
var zombiefactory = artifacts.require('./zombiefactory.sol');
var zombiefeeding = artifacts.require('./zombiefeeding.sol');
var zombiehelper = artifacts.require('./zombiehelper.sol');
var zombieattack = artifacts.require('./zombieattack.sol');
var zombieownership = artifacts.require('./zombieownership.sol');
var kittyCore = artifacts.require('./KittyCore.sol');

module.exports = function (deployer) {
  deployer.deploy(safemath);
  deployer.deploy(zombiefactory);
  deployer.deploy(zombiefeeding);
  deployer.deploy(zombiehelper);
  deployer.deploy(zombieattack);
  deployer.deploy(zombieownership);
  deployer.deploy(kittyCore);
};
