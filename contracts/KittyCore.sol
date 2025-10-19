pragma solidity >=0.4.22 <0.9.0;

import "./ownable.sol";

contract KittyCore is Ownable {
    struct Kitty {
        uint256 dna;
    }

    Kitty[] public kitties;
    address public zombieContract;

    modifier onlyZombieContract() {
        require(msg.sender == zombieContract, "Caller must be zombie contract");
        _;
    }

    function getKittyCount() external view returns (uint256) {
        return kitties.length;
    }

    function _generateRandomDna(string memory _str) private pure returns (uint256) {
        uint256 rand = uint256(keccak256(abi.encodePacked(_str)));
        return rand % (10 ** 16); // Ensure DNA is a 16-digit number
    }

    function createRandomKitty(string memory _name) public {
        uint256 randDna = _generateRandomDna(_name);
        _createKitty(randDna);
    }

    function _createKitty(uint256 _dna) public {
        kitties.push(Kitty(_dna));
    }

    function setZombieContract(address _zombieContract) external onlyOwner {
        require(_zombieContract != address(0), "Invalid zombie contract");
        require(zombieContract == address(0), "Zombie contract already set");
        zombieContract = _zombieContract;
    }

    function consumeKitty(uint256 _id) external onlyZombieContract {
        require(_id < kitties.length, "Invalid kitty id");
        uint256 lastIndex = kitties.length - 1;

        if (_id != lastIndex) {
            kitties[_id] = kitties[lastIndex];
        }

        kitties.length--;
    }

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
    ) {
        // Simplified response for compatibility with ZombieFeeding
        genes = kitties[_id].dna;
        return (false, true, 0, 0, 0, block.timestamp, 0, 0, 0, genes);
    }
}
