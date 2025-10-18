import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import Web3 from "web3";
import { getContractAddress } from "../config/contractAddresses";
import cryptoZombiesABI from "../cryptozombies_abi.json";
import "./CryptoZombie.css";

// DNA-based zombie image generation
const generateZombieImage = (dna) => {
  let dnaStr = String(dna);

  // Pad DNA with leading zeroes if it's less than 16 characters
  while (dnaStr.length < 16) {
    dnaStr = "0" + dnaStr;
  }

  const zombieDetails = {
    // First 2 digits make up the head (7 possible heads)
    headChoice: (parseInt(dnaStr.substring(0, 2)) % 7) + 1,
    // 2nd 2 digits make up the eyes (11 variations)
    eyeChoice: (parseInt(dnaStr.substring(2, 4)) % 11) + 1,
    // 3rd 2 digits make up the shirt (6 variations)
    shirtChoice: (parseInt(dnaStr.substring(4, 6)) % 6) + 1,
    // Last 6 digits control color (360 degrees hue rotation)
    skinColorChoice: (parseInt(dnaStr.substring(6, 8)) / 100) * 360,
    eyeColorChoice: (parseInt(dnaStr.substring(8, 10)) / 100) * 360,
    clothesColorChoice: (parseInt(dnaStr.substring(10, 12)) / 100) * 360,
  };

  // Create DNA hash for consistent appearance
  const dnaHash = `${zombieDetails.headChoice}${zombieDetails.eyeChoice}${
    zombieDetails.shirtChoice
  }${Math.floor(zombieDetails.skinColorChoice)}${Math.floor(
    zombieDetails.eyeColorChoice
  )}${Math.floor(zombieDetails.clothesColorChoice)}`;

  // Use robohash for robot-like avatars
  const imageUrl = `https://robohash.org/${dnaHash}?set=set2&size=200x200`;

  return {
    imageUrl: imageUrl,
    details: zombieDetails,
  };
};

// Breeding Status Component
const BreedingStatus = () => {
  return (
    <div className="breeding-status breeding-ready">🧬 Ready to breed</div>
  );
};

BreedingStatus.propTypes = {
  zombieId: PropTypes.number.isRequired,
  cryptoZombies: PropTypes.object.isRequired,
};

const CryptoZombies = () => {
  const [web3, setWeb3] = useState(null);
  const [cryptoZombies, setCryptoZombies] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [zombies, setZombies] = useState([]);
  const [kitties, setKitties] = useState([]); // Store created kitties here
  const [status, setStatus] = useState("");
  const breedingFee = "0.002"; // Breeding fee in ETH
  const [selectedZombies, setSelectedZombies] = useState([]); // For breeding selection
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const zombieNameRef = useRef("");
  const kittyNameRef = useRef(""); // Kitty name input

  // Function to switch to Ganache network
  const switchToGanacheNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const ganacheChainId = "0x539"; // 1337 in hex

      if (chainId !== ganacheChainId) {
        try {
          // Try to switch to Ganache network
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ganacheChainId }],
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: ganacheChainId,
                  chainName: "Ganache",
                  rpcUrls: ["http://127.0.0.1:7545"],
                  nativeCurrency: {
                    name: "ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                },
              ],
            });
          } else {
            throw switchError;
          }
        }
      }
    } catch (error) {
      console.error("Failed to switch to Ganache network:", error);
      setStatus("Please switch to Ganache network manually in MetaMask");
    }
  };

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        try {
          // Check and switch to Ganache network
          await switchToGanacheNetwork();

          await window.ethereum.request({ method: "eth_requestAccounts" });
          const accounts = await web3Instance.eth.getAccounts();
          setUserAccount(accounts[0]);

          // Initialize the contract instance for zombies
          const cryptoZombiesContract = new web3Instance.eth.Contract(
            cryptoZombiesABI.abi, // Use the abi property from the JSON object
            getContractAddress("zombieOwnership") // Dynamic contract address
          );

          setCryptoZombies(cryptoZombiesContract);

          // Fetch the zombies and kitties owned by the user
          fetchZombies(accounts[0], cryptoZombiesContract);
        } catch (error) {
          console.error("Could not connect to wallet", error);
        }
      } else {
        console.log("Please install MetaMask!");
      }
    };

    initWeb3();
  }, []);

  const fetchZombies = async (owner, contract) => {
    const ids = await contract.methods.getZombiesByOwner(owner).call(); // Get zombie IDs owned by the user
    const zombiesPromise = ids.map((id) => contract.methods.zombies(id).call());
    const zombies = await Promise.all(zombiesPromise);
    setZombies(zombies); // Set the zombies into the state
  };

  const createRandomZombie = async () => {
    const name = zombieNameRef.current.value;
    if (!name) {
      setStatus("Please enter a name for your zombie");
      return;
    }

    if (!cryptoZombies || !userAccount) {
      setStatus("Contract not loaded or wallet not connected");
      return;
    }

    try {
      setStatus("Creating zombie...");

      // Estimate gas with a buffer
      const gasEstimate = await cryptoZombies.methods
        .createRandomZombie(name)
        .estimateGas({ from: userAccount });

      const gas = Math.floor(Number(gasEstimate) * 1.2); // Add 20% buffer

      await cryptoZombies.methods.createRandomZombie(name).send({
        from: userAccount,
        gas: gas,
        gasPrice: web3.utils.toWei("20", "gwei"), // Set reasonable gas price
      });

      zombieNameRef.current.value = ""; // Clear the input field
      fetchZombies(userAccount, cryptoZombies); // Refresh zombies
      setStatus("Zombie created successfully!");
    } catch (error) {
      console.error("Error creating zombie:", error);
      setStatus(`Error: ${error.message}`);
    }
  };

  // Update Zombie Name
  const updateZombieName = async (zombieId) => {
    const newName = prompt("Enter new name for your zombie:", "");
    if (!newName) {
      setStatus("Please enter a valid name");
      return;
    }

    try {
      setStatus("Changing zombie name... DNA and appearance will update");
      // Call contract method to change the zombie name
      await cryptoZombies.methods
        .changeName(zombieId, newName)
        .send({ from: userAccount });

      // Fetch updated zombies to show the new name on the screen
      fetchZombies(userAccount, cryptoZombies);

      // Set success message
      setStatus(
        `Zombie name updated to ${newName} - DNA and appearance updated!`
      );
    } catch (error) {
      console.error("Error updating name:", error);
      setStatus("Failed to update zombie name");
    }
  };

  const updateZombieDNA = async (zombieId, zombieLevel) => {
    // Check if zombie level is 20 or higher
    alert("Zombie level should be 20 or higher to update DNA");
    if ((zombieLevel < 1) | 1) {
      return;
    }

    if (zombieLevel < 1) {
      window.scrollTo(0, 0); // Scroll to the top for the status message
      alert("Zombie level should be 20 or higher to update DNA");
      return;
    }

    // Prompt user to enter a new DNA
    const dna = prompt("Enter new DNA for your zombie:", "");
    if (!dna) {
      setStatus("Please enter a valid DNA");
      return;
    }

    try {
      // Send transaction to update the zombie's DNA
      const transactionHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: userAccount,
            to: getContractAddress("zombieOwnership"), // Dynamic contract address
            data: cryptoZombies.methods.changeDna(zombieId, dna).encodeABI(),
          },
        ],
      });

      // Log the transaction hash
      console.log("Transaction Hash:", transactionHash);

      // Fetch updated zombies to show the new DNA on the screen
      fetchZombies(userAccount, cryptoZombies);

      // Set success message
      setStatus(`Zombie DNA updated to ${dna}`);
    } catch (error) {
      console.error("Error updating DNA:", error);
      setStatus("Failed to update zombie DNA");
    }
  };

  const createKitty = async () => {
    const name = kittyNameRef.current.value;
    if (!name) {
      setStatus("Please enter a name for your kitty");
      return;
    }

    // Simulate kitty creation (you can replace with actual contract interaction)
    const newKitty = {
      id: kitties.length + 1, // Generate an ID for the kitty
      name: name,
      generation: Math.floor(Math.random() * 10), // Random generation number
      color: "blue", // Placeholder color
      birthday: Date.now(), // Current timestamp for birthday
    };

    setKitties([...kitties, newKitty]); // Add the new kitty to the state
    kittyNameRef.current.value = ""; // Clear the input field
  };

  const levelUp = async (zombieId) => {
    if (!cryptoZombies || !userAccount) {
      setStatus("Contract not loaded or wallet not connected");
      return;
    }

    setStatus("Leveling up your Zombie... DNA and appearance will update");
    await cryptoZombies.methods
      .levelUp(zombieId)
      .send({ from: userAccount, value: web3.utils.toWei("0.001", "ether") });
    fetchZombies(userAccount, cryptoZombies); // Refresh zombies
    setStatus(
      "Power overwhelming! Zombie leveled up - DNA and appearance updated!"
    );
  };

  // Breeding Functions
  const selectZombieForBreeding = (zombieId) => {
    if (selectedZombies.includes(zombieId)) {
      setSelectedZombies(selectedZombies.filter((id) => id !== zombieId));
    } else if (selectedZombies.length < 2) {
      setSelectedZombies([...selectedZombies, zombieId]);
    } else {
      setStatus("You can only select 2 zombies for breeding");
    }
  };

  const breedZombies = async () => {
    if (selectedZombies.length !== 2) {
      setStatus("Please select exactly 2 zombies to breed");
      return;
    }

    if (!cryptoZombies || !userAccount) {
      setStatus("Contract not loaded or wallet not connected");
      return;
    }

    const [zombieId1, zombieId2] = selectedZombies;

    // All zombies are always ready to breed - no need to check

    try {
      setStatus("Breeding zombies... This may take a moment");

      const breedingFeeWei = web3.utils.toWei(breedingFee, "ether");

      await cryptoZombies.methods.breedZombies(zombieId1, zombieId2).send({
        from: userAccount,
        value: breedingFeeWei,
        gas: 500000, // Increased gas limit for breeding
      });

      // Clear selection and close modal
      setSelectedZombies([]);
      setShowBreedingModal(false);

      // Refresh zombies to show the new offspring
      fetchZombies(userAccount, cryptoZombies);
      setStatus(
        "Breeding successful! A new zombie offspring has been created!"
      );
    } catch (error) {
      console.error("Error breeding zombies:", error);
      setStatus(`Breeding failed: ${error.message}`);
    }
  };

  const openBreedingModal = () => {
    if (zombies.length < 2) {
      setStatus("You need at least 2 zombies to breed");
      return;
    }
    setShowBreedingModal(true);
    setSelectedZombies([]);
  };

  const closeBreedingModal = () => {
    setShowBreedingModal(false);
    setSelectedZombies([]);
  };

  return (
    <div className="modern-bg">
      <div className="modern-container">
        <div className="modern-header">
          <h1 className="modern-title">Crypto Zombies</h1>
          <p className="modern-subtitle">
            Collect, breed, and battle your digital creatures on the blockchain
          </p>
        </div>
        {/* Network Switch Button */}
        {/* <div className="fade-in">
          <button
            className="modern-btn modern-btn-primary"
            onClick={switchToGanacheNetwork}
          >
            Switch to Ganache Network
          </button>
        </div> */}

        {/* Zombie Creation */}
        <div className="modern-form-group fade-in-delay-1">
          <input
            type="text"
            ref={zombieNameRef}
            placeholder="Enter zombie name"
            className="modern-input"
          />
          <button
            className="modern-btn modern-btn-secondary"
            onClick={() => createRandomZombie()}
          >
            Create Zombie
          </button>
        </div>

        {/* Kitty Creation */}
        <div className="modern-form-group fade-in-delay-2">
          <input
            type="text"
            ref={kittyNameRef}
            placeholder="Enter kitty name"
            className="modern-input"
          />
          <button
            className="modern-btn modern-btn-outline"
            onClick={() => createKitty()}
          >
            Create Kitty
          </button>
        </div>

        {/* Breeding Section */}
        <div className="modern-form-group fade-in-delay-3">
          <button
            className="modern-btn modern-btn-primary"
            onClick={openBreedingModal}
            disabled={zombies.length < 2}
          >
            🧬 Breed Zombies ({breedingFee} ETH)
          </button>
        </div>

        {/* Status Message */}
        {status !== "" && (
          <div id="txStatus" className="modern-status">
            <p>{status}</p>
          </div>
        )}

        {/* Breeding Modal */}
        {showBreedingModal && (
          <div className="breeding-modal-overlay">
            <div className="breeding-modal">
              <div className="breeding-modal-header">
                <h2>🧬 Breed Your Zombies</h2>
                <button className="close-btn" onClick={closeBreedingModal}>
                  ×
                </button>
              </div>
              <div className="breeding-modal-content">
                <p className="breeding-info">
                  Select 2 zombies to breed. The offspring will inherit traits
                  from both parents.
                  <br />
                  <strong>Cost: {breedingFee} ETH</strong>
                </p>
                <div className="breeding-zombie-grid">
                  {zombies.map((zombie, index) => (
                    <div
                      key={index}
                      className={`breeding-zombie-card ${
                        selectedZombies.includes(index) ? "selected" : ""
                      }`}
                      onClick={() => selectZombieForBreeding(index)}
                    >
                      <img
                        key={`breeding-zombie-${index}-${zombie.dna}`}
                        src={generateZombieImage(zombie.dna).imageUrl}
                        alt="Zombie"
                        className="breeding-zombie-image"
                      />
                      <h4>{zombie.name}</h4>
                      <div className="breeding-zombie-stats">
                        <div>Level: {Number(zombie.level)}</div>
                        <div>DNA: {Number(zombie.dna)}</div>
                      </div>
                      {selectedZombies.includes(index) && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="breeding-modal-actions">
                  <button
                    className="modern-btn modern-btn-secondary"
                    onClick={breedZombies}
                    disabled={selectedZombies.length !== 2}
                  >
                    Breed Selected Zombies
                  </button>
                  <button
                    className="modern-btn modern-btn-outline"
                    onClick={closeBreedingModal}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Display Zombies */}
        <div className="modern-grid">
          {zombies.map((zombie, index) => (
            <div key={index} className="creature-card fade-in-delay-3">
              <img
                key={`zombie-${index}-${zombie.dna}`}
                src={generateZombieImage(zombie.dna).imageUrl}
                alt="Zombie"
                className="creature-image"
              />
              <h3 className="creature-name">{zombie.name}</h3>
              <div className="creature-stats">
                <div className="stat-item">
                  <div className="stat-label">DNA</div>
                  <div className="stat-value">{Number(zombie.dna)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Level</div>
                  <div className="stat-value">{Number(zombie.level)}</div>
                </div>
              </div>
              <div className="creature-meta">
                Ready:{" "}
                {new Date(Number(zombie.readyTime) * 1000).toLocaleString()}
              </div>
              <div className="breeding-status-container">
                <BreedingStatus
                  zombieId={index}
                  cryptoZombies={cryptoZombies}
                />
              </div>
              <div className="creature-actions">
                <button
                  className="action-btn action-btn-level"
                  onClick={() => levelUp(index)}
                >
                  Level Up
                </button>
                <button
                  className="action-btn action-btn-rename"
                  onClick={() => updateZombieName(index)}
                >
                  Rename
                </button>
                {/* <button
                  className="action-btn action-btn-dna"
                  onClick={() => updateZombieDNA(index)}
                >
                  Update DNA
                </button> */}
              </div>
            </div>
          ))}

          {/* Display Kitties */}
          {kitties.length > 0 &&
            kitties.map((kitty) => (
              <div key={kitty.id} className="creature-card fade-in-delay-3">
                <img
                  src={`https://robohash.org/${kitty.name + kitty.id}?set=set4`}
                  alt="Kitty"
                  className="creature-image"
                />
                <h3 className="creature-name">{kitty.name}</h3>
                <div className="creature-stats">
                  <div className="stat-item">
                    <div className="stat-label">Generation</div>
                    <div className="stat-value">{kitty.generation}</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-label">Color</div>
                    <div className="stat-value">{kitty.color}</div>
                  </div>
                </div>
                <div className="creature-meta">
                  Birthday: {new Date(kitty.birthday).toLocaleDateString()}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoZombies;
