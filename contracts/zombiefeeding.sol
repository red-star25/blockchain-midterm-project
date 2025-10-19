pragma solidity >=0.4.22 <0.9.0;

import "./zombiefactory.sol";
import "./KittyCore.sol";

/*contract KittyInterface {
  function getKitty(uint256 _id) external view returns (
    bool isGestating,
    bool isReady,
    uint256 cooldownIndex,
    uint256 nextActionAt,
    uint256 siringWithId,
    uint256 birthTime,
    uint256 matronId,
    uint256 sireId,
    uint256 generation,
    uint256 genes
  );
}*/

contract ZombieFeeding is ZombieFactory {

  KittyCore kittyContract;

  event ZombieFed(uint zombieId, uint kittyId, uint32 newLevel);

  modifier onlyOwnerOf(uint _zombieId) {
    require(msg.sender == zombieToOwner[_zombieId]);
    _;
  }

  function setKittyContractAddress(address _address) external onlyOwner {
    kittyContract = KittyCore(_address);
  }

  function _triggerCooldown(Zombie storage _zombie) internal {
    _zombie.readyTime = uint32(now);
  }

  function _isReady(Zombie storage _zombie) internal view returns (bool) {
      return (_zombie.readyTime <= now);
  }

  function feedAndMultiply(uint _zombieId, uint _targetDna, string _species) internal onlyOwnerOf(_zombieId) {
    require(
      keccak256(abi.encodePacked(_species)) != keccak256(abi.encodePacked("kitty")),
      "Use feedOnKitty"
    );

    Zombie storage myZombie = zombies[_zombieId];
    require(_isReady(myZombie));
    _targetDna = _targetDna % dnaModulus;
    uint newDna = (myZombie.dna + _targetDna) / 2;
    _createZombie("NoName", newDna);
    _triggerCooldown(myZombie);
  }

  function feedOnKitty(uint _zombieId, uint _kittyId) public {
    require(address(kittyContract) != address(0));
    Zombie storage myZombie = zombies[_zombieId];
    require(_isReady(myZombie));

    (, uint kittyDna, uint8 multiplier) = kittyContract.getKittyMetadata(_kittyId);

    uint targetDna = kittyDna % dnaModulus;
    uint newDna = (myZombie.dna + targetDna) / 2;
    newDna = newDna - newDna % 100 + 99;

    myZombie.dna = newDna;
    myZombie.level = myZombie.level.add(uint32(multiplier));

    _triggerCooldown(myZombie);
    kittyContract.consumeKitty(_kittyId);
    emit ZombieFed(_zombieId, _kittyId, zombies[_zombieId].level);
  }

  function feedZombieWithKitty(uint _zombieId, uint _kittyId) external onlyOwnerOf(_zombieId) {
    feedOnKitty(_zombieId, _kittyId);
  }
}
