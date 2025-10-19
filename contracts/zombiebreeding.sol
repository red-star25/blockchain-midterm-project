pragma solidity >=0.4.22 <0.9.0;

import "./zombiehelper.sol";

contract ZombieBreeding is ZombieHelper {
    
    uint breedingFee = 0.002 ether; // Cost to breed zombies
    
    // Track offspring count for each parent pair
    mapping(bytes32 => uint) public parentPairOffspringCount;
    
    // Breeding events
    event ZombieBreeding(uint zombieId1, uint zombieId2, uint newZombieId);
    
    modifier onlyOwnerOf(uint _zombieId) {
        require(msg.sender == zombieToOwner[_zombieId]);
        _;
    }
    
    modifier validBreedingPair(uint _zombieId1, uint _zombieId2) {
        require(_zombieId1 != _zombieId2, "Cannot breed zombie with itself");
        require(zombieToOwner[_zombieId1] == zombieToOwner[_zombieId2], "Both zombies must be owned by the same player");
        _;
    }
    
    function _generateOffspringDna(uint _zombieId1, uint _zombieId2) internal view returns (uint) {
        Zombie storage zombie1 = zombies[_zombieId1];
        Zombie storage zombie2 = zombies[_zombieId2];
        
        // Generate DNA for offspring based on parent names and levels
        uint rand = uint(keccak256(abi.encodePacked(now, msg.sender, zombie1.name, zombie1.level, zombie2.name, zombie2.level)));
        
        // Mix parent DNAs
        uint offspringDna = (zombie1.dna + zombie2.dna) / 2;
        
        // Add genetic variation (mutations)
        uint mutation = rand % 1000;
        if (mutation < 50) { // 5% chance of mutation
            offspringDna = offspringDna ^ (rand % dnaModulus);
        }
        
        offspringDna = offspringDna % dnaModulus;
        return offspringDna;
    }
    
    function breedZombies(uint _zombieId1, uint _zombieId2) external payable 
        validBreedingPair(_zombieId1, _zombieId2) {
        
        require(msg.value >= breedingFee, "Insufficient breeding fee");
        
        // Get parent zombies
        Zombie storage zombie1 = zombies[_zombieId1];
        Zombie storage zombie2 = zombies[_zombieId2];
        
        // Generate offspring DNA
        uint offspringDna = _generateOffspringDna(_zombieId1, _zombieId2);
        
        // Create the offspring with combined parent names and counter
        uint newZombieId = zombies.length;
        
        // Create a unique key for this parent pair (order doesn't matter)
        bytes32 parentPairKey;
        if (_zombieId1 < _zombieId2) {
            parentPairKey = keccak256(abi.encodePacked(_zombieId1, _zombieId2));
        } else {
            parentPairKey = keccak256(abi.encodePacked(_zombieId2, _zombieId1));
        }
        
        // Increment counter for this parent pair
        parentPairOffspringCount[parentPairKey]++;
        
        // Create offspring name with counter
        string memory offspringName = string(abi.encodePacked(
            zombie1.name, 
            "_", 
            zombie2.name, 
            "_", 
            uint2str(parentPairOffspringCount[parentPairKey])
        ));
        
        _createZombie(offspringName, offspringDna);
        
        emit ZombieBreeding(_zombieId1, _zombieId2, newZombieId);
    }
    
    function isReadyToBreed(uint _zombieId) external view returns (bool) {
        // All zombies are always ready to breed
        return true;
    }
    
    function setBreedingFee(uint _fee) external onlyOwner {
        breedingFee = _fee;
    }
    
    function getBreedingFee() external view returns (uint) {
        return breedingFee;
    }
    
    // Helper function to convert uint to string
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }
    
    // Function to get all zombies owned by a player (all are breedable)
    function getBreedableZombies(address _owner) external view returns (uint[]) {
        uint[] memory result = new uint[](ownerZombieCount[_owner]);
        uint counter = 0;
        
        for (uint i = 0; i < zombies.length; i++) {
            if (zombieToOwner[i] == _owner) {
                result[counter] = i;
                counter++;
            }
        }
        
        // Resize array to actual count
        uint[] memory finalResult = new uint[](counter);
        for (uint j = 0; j < counter; j++) {
            finalResult[j] = result[j];
        }
        
        return finalResult;
    }
}
