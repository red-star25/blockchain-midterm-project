pragma solidity >=0.4.22 <0.9.0;

import "./ownable.sol";

contract KittyCore is Ownable {
    struct Kitty {
        uint256 dna;
        string name;
        uint8 multiplier;
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
        uint8 multiplier = _generateMultiplier(_name);
        _createKitty(randDna, _name, multiplier);
    }

    function _createKitty(uint256 _dna, string memory _name, uint8 _multiplier) public {
        string memory kittyName = bytes(_name).length > 0 ? _name : "Nameless Kitty";
        uint8 multiplier = _normalizeMultiplier(_multiplier, kittyName);
        kitties.push(Kitty(_dna, kittyName, multiplier));
    }

    function _generateMultiplier(string memory _seed) internal view returns (uint8) {
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(_seed, block.timestamp, block.number, kitties.length, msg.sender)
            )
        );
        return uint8((rand % 5) + 2); // Range 2-6
    }

    function _normalizeMultiplier(uint8 _multiplier, string memory _seed) internal view returns (uint8) {
        if (_multiplier >= 2 && _multiplier <= 6) {
            return _multiplier;
        }
        return _generateMultiplier(_seed);
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

        delete kitties[lastIndex];
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
        require(_id < kitties.length, "Invalid kitty id");
        genes = kitties[_id].dna;
        return (false, true, 0, 0, 0, block.timestamp, 0, 0, 0, genes);
    }

    function getKittyMetadata(uint256 _id)
        external
        view
        returns (
            string memory name,
            uint256 dna,
            uint8 multiplier
        )
    {
        require(_id < kitties.length, "Invalid kitty id");
        Kitty storage kitty = kitties[_id];
        return (kitty.name, kitty.dna, kitty.multiplier);
    }
}
