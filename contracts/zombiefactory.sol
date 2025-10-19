pragma solidity >=0.4.22 <0.9.0;

import "./ownable.sol";
import "./safemath.sol";

contract ZombieFactory is Ownable {

  using SafeMath for uint256;
  using SafeMath32 for uint32;
  using SafeMath16 for uint16;

  event NewZombie(uint zombieId, string name, uint dna);

  uint dnaDigits = 16;
  uint dnaModulus = 10 ** dnaDigits;
  uint cooldownTime = 1 days;

  struct Zombie {
    string name;
    uint dna;
    uint32 level;
    uint32 readyTime;
    uint16 winCount;
    uint16 lossCount;
  }

  Zombie[] public zombies;

  mapping (uint => address) public zombieToOwner;
  mapping (address => uint) ownerZombieCount;

  function _createZombie(string _name, uint _dna) internal {
  uint id = zombies.push(Zombie(_name, _dna, 1, uint32(now), 0, 0)) - 1;
    zombieToOwner[id] = msg.sender;
    ownerZombieCount[msg.sender] = ownerZombieCount[msg.sender].add(1);
    emit NewZombie(id, _name, _dna);
  }

  function _generateDnaFromNameAndLevel(string _name, uint32 _level) internal view returns (uint) {
    // Combine name and level for deterministic DNA generation
    uint rand = uint(keccak256(abi.encodePacked(_name, _level)));
    uint dna = rand % dnaModulus;
    
    // Ensure last 2 digits are 00 for random zombies
    dna = dna - dna % 100;
    
    return dna;
  }

  function createRandomZombie(string _name) public {
    require(ownerZombieCount[msg.sender] < 6);
    uint32 initialLevel = 1;
    uint dna = _generateDnaFromNameAndLevel(_name, initialLevel);
    _createZombie(_name, dna);
  }

  // Function to get current DNA based on name and level
  function getCurrentDna(uint _zombieId) public view returns (uint) {
    Zombie storage zombie = zombies[_zombieId];
    return _generateDnaFromNameAndLevel(zombie.name, zombie.level);
  }

}
