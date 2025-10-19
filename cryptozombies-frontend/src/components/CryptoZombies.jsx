import PropTypes from "prop-types";
import { useEffect, useRef, useState } from "react";
import Web3 from "web3";
import { getContractAddress } from "../config/contractAddresses";
import cryptoZombiesABI from "../cryptozombies_abi.json";
import kittyCoreABI from "../kittycore_abi.json";
import "./CryptoZombie.css";

const MINIMUM_BREEDING_LEVEL = 3;

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
const BreedingStatus = ({ level }) => {
  const isReady = Number(level) >= MINIMUM_BREEDING_LEVEL;

  return (
    <div
      className={`breeding-status ${
        isReady ? "breeding-ready" : "breeding-locked"
      }`}
    >
      {isReady
        ? "🧬 Ready to breed"
        : `🧬 Reach level ${MINIMUM_BREEDING_LEVEL} to breed`}
    </div>
  );
};

BreedingStatus.propTypes = {
  level: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

const CryptoZombies = () => {
  const [web3, setWeb3] = useState(null);
  const [cryptoZombies, setCryptoZombies] = useState(null);
  const [kittyContract, setKittyContract] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [zombies, setZombies] = useState([]);
  const [kitties, setKitties] = useState([]); // Store created kitties here
  const [status, setStatus] = useState("");
  const breedingFee = "0.002"; // Breeding fee in ETH
  const [selectedZombies, setSelectedZombies] = useState([]); // For breeding selection
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [showFeedingModal, setShowFeedingModal] = useState(false);
  const [selectedFeedingZombie, setSelectedFeedingZombie] = useState(null);
  const [selectedFeedingKitty, setSelectedFeedingKitty] = useState(null);
  const zombieNameRef = useRef("");
  const kittyNameRef = useRef(""); // Kitty name input

  const getEligibleBreedingZombies = () =>
    zombies.filter((zombie) => Number(zombie.level) >= MINIMUM_BREEDING_LEVEL);

  const normalizeKittyData = (rawKitty, index, fallbackKitty) => {
    const fallbackName = fallbackKitty?.name;
    const fallbackBirthday = fallbackKitty?.birthday;

    if (!rawKitty) {
      return {
        id: index,
        name: fallbackName ?? `Kitty ${index}`,
        birthday: fallbackBirthday ?? Date.now(),
        dna: "0",
      };
    }

    // Web3 returns both array-style and key-based properties.
    const nameValue =
      rawKitty.name ?? rawKitty[0] ?? fallbackName ?? `Kitty ${index}`;
    const genesValue =
      rawKitty.dna ?? rawKitty[1] ?? rawKitty.genes ?? rawKitty[0] ?? "0";

    return {
      id: index,
      name: nameValue,
      birthday: fallbackBirthday ?? Date.now(),
      dna: genesValue.toString(),
    };
  };

  const fetchKitties = async (contract) => {
    if (!contract) {
      return;
    }

    try {
      const kittyCount = Number(await contract.methods.getKittyCount().call());

      if (kittyCount === 0) {
        setKitties([]);
        return;
      }

      const kittyData = await Promise.all(
        Array.from({ length: kittyCount }, (_, index) =>
          contract.methods.getKittyMetadata(index).call()
        )
      );

      setKitties((existingKitties) =>
        kittyData.map((kitty, index) =>
          normalizeKittyData(
            kitty,
            index,
            existingKitties.find((existingKitty) => existingKitty.id === index)
          )
        )
      );
    } catch (error) {
      console.error("Error fetching kitties:", error);
      setStatus("Error fetching kitties");
    }
  };

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

          const kittyCoreContract = new web3Instance.eth.Contract(
            kittyCoreABI.abi,
            getContractAddress("kittyCore")
          );

          setKittyContract(kittyCoreContract);

          // Fetch the zombies and kitties owned by the user
          fetchZombies(accounts[0], cryptoZombiesContract);
          fetchKitties(kittyCoreContract);
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
    const zombiesPromise = ids.map(async (id) => {
      const zombieData = await contract.methods.zombies(id).call();
      return {
        id: Number(id),
        name: zombieData.name,
        dna: zombieData.dna,
        level: zombieData.level,
        readyTime: zombieData.readyTime,
        winCount: zombieData.winCount,
        lossCount: zombieData.lossCount,
      };
    });
    const ownedZombies = await Promise.all(zombiesPromise);
    setZombies(ownedZombies); // Set the zombies into the state
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
      setStatus("Changing zombie name...");
      // Call contract method to change the zombie name
      await cryptoZombies.methods
        .changeName(zombieId, newName)
        .send({ from: userAccount });

      // Fetch updated zombies to show the new name on the screen
      fetchZombies(userAccount, cryptoZombies);

      // Set success message
      setStatus(`Zombie name updated to ${newName}!`);
    } catch (error) {
      console.error("Error updating name:", error);
      setStatus("Failed to update zombie name");
    }
  };

  // Removed DNA update functionality

  const createKitty = async () => {
    const name = kittyNameRef.current.value;
    if (!name) {
      setStatus("Please enter a name for your kitty");
      return;
    }

    if (!kittyContract || !userAccount) {
      setStatus("Kitty contract not loaded or wallet not connected");
      return;
    }

    try {
      setStatus("Creating kitty on-chain...");

      const tx = await kittyContract.methods
        .createRandomKitty(name)
        .send({ 
          from: userAccount,
          gas: 300000 // Add gas limit
        });

      const kittyCount = await kittyContract.methods.getKittyCount().call();
      const kittyId = Number(kittyCount) - 1;
      const kittyData = await kittyContract.methods
        .getKittyMetadata(kittyId)
        .call();

      const newKitty = normalizeKittyData(kittyData, kittyId, {
        name,
        birthday: Date.now(),
      });

  setKitties((existingKitties) => [...existingKitties, newKitty]);
  fetchKitties(kittyContract);
      kittyNameRef.current.value = "";
      setStatus("Kitty created successfully!");
    } catch (error) {
      console.error("Error creating kitty:", error);
      setStatus(`Error creating kitty: ${error.message}`);
    }
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
    const zombie = zombies.find((z) => z.id === zombieId);
    if (!zombie || Number(zombie.level) < MINIMUM_BREEDING_LEVEL) {
      setStatus(`Only zombies level ${MINIMUM_BREEDING_LEVEL}+ can breed`);
      return;
    }

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

    const eligibleZombies = getEligibleBreedingZombies();
    const selectedAreEligible = selectedZombies.every((zombieId) =>
      eligibleZombies.some((zombie) => zombie.id === zombieId)
    );

    if (!selectedAreEligible) {
      setStatus(
        `Selected zombies must be level ${MINIMUM_BREEDING_LEVEL} or higher to breed`
      );
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
    const eligibleZombies = getEligibleBreedingZombies();

    if (eligibleZombies.length < 2) {
      setStatus(
        `You need at least 2 zombies at level ${MINIMUM_BREEDING_LEVEL} or higher to breed`
      );
      return;
    }
    setShowBreedingModal(true);
    setSelectedZombies([]);
  };

  const closeBreedingModal = () => {
    setShowBreedingModal(false);
    setSelectedZombies([]);
  };

  const openFeedingModal = () => {
    if (zombies.length === 0) {
      setStatus("You need at least 1 zombie to feed");
      return;
    }

    if (kitties.length === 0) {
      setStatus("Create or import a kitty before feeding your zombies");
      return;
    }

    setShowFeedingModal(true);
    setSelectedFeedingZombie(null);
    setSelectedFeedingKitty(null);
  };

  const closeFeedingModal = () => {
    setShowFeedingModal(false);
    setSelectedFeedingZombie(null);
    setSelectedFeedingKitty(null);
  };

  const selectZombieForFeeding = (zombieId) => {
    setSelectedFeedingZombie(zombieId === selectedFeedingZombie ? null : zombieId);
  };

  const selectKittyForFeeding = (kittyId) => {
    setSelectedFeedingKitty(kittyId === selectedFeedingKitty ? null : kittyId);
  };

  const feedZombie = async () => {
    if (selectedFeedingZombie === null || selectedFeedingKitty === null) {
      setStatus("Select both a zombie and a kitty to feed");
      return;
    }

    if (!cryptoZombies || !userAccount) {
      setStatus("Contract not loaded or wallet not connected");
      return;
    }

    try {
      setStatus("Feeding zombie... Level will increase by 3");

      // First get the zombie data to check readyTime
      const zombieData = await cryptoZombies.methods.zombies(selectedFeedingZombie).call();
      const now = Math.floor(Date.now() / 1000);
      if (Number(zombieData.readyTime) > now) {
        setStatus("Zombie is not ready to feed yet!");
        return;
      }

      // Check if kitty exists
      try {
        await kittyContract.methods.kitties(selectedFeedingKitty).call();
      } catch (error) {
        setStatus("This kitty doesn't exist or has already been eaten!");
        return;
      }

      // Call feedOnKitty function from the contract
      const tx = await cryptoZombies.methods
        .feedOnKitty(selectedFeedingZombie, selectedFeedingKitty)
        .send({ 
          from: userAccount,
          gas: 500000 // Increased gas limit
        });

      console.log("Feeding transaction:", tx);

      // Update kitties list
  setKitties(kitties.filter(kitty => kitty.id !== selectedFeedingKitty));
  await fetchKitties(kittyContract);

      // Refresh zombies to show updated level
      await fetchZombies(userAccount, cryptoZombies);
      
      closeFeedingModal();
      setStatus("Zombie fed successfully! Level increased by 3");
    } catch (error) {
      console.error("Error feeding zombie:", error);
      setStatus(`Feeding failed: ${error.message}`);
    }
  };

  const eligibleBreedingZombies = getEligibleBreedingZombies();

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
            disabled={eligibleBreedingZombies.length < 2}
          >
            🧬 Breed Zombies ({breedingFee} ETH)
          </button>
        </div>

        {/* Feeding Section */}
        <div className="modern-form-group fade-in-delay-3">
          <button className="modern-btn modern-btn-primary" onClick={openFeedingModal}>
            🍖 Feed Zombies (Gain 3 Levels)
          </button>
        </div>

        {/* Status Message */}
        {status !== "" && (
          <div id="txStatus" className="modern-status">
            <p>{status}</p>
          </div>
        )}

        {/* Feeding Modal */}
        {showFeedingModal && (
          <div className="breeding-modal-overlay">
            <div className="breeding-modal">
              <div className="breeding-modal-header">
                <h2>🍖 Feed Your Zombie</h2>
                <button className="close-btn" onClick={closeFeedingModal}>×</button>
              </div>
              <div className="breeding-modal-content">
                <p className="breeding-info">
                  Select a zombie and a kitty for feeding. The zombie will gain 3 levels, and the kitty will be consumed.
                </p>
                <div className="breeding-section">
                  <h3>Select Zombie to Feed</h3>
                  <div className="breeding-zombie-grid">
                    {zombies.map((zombie) => (
                      <div
                        key={zombie.id}
                        className={`breeding-zombie-card ${selectedFeedingZombie === zombie.id ? "selected" : ""}`}
                        onClick={() => selectZombieForFeeding(zombie.id)}
                      >
                        <img
                          src={generateZombieImage(zombie.dna).imageUrl}
                          alt="Zombie"
                          className="breeding-zombie-image"
                        />
                        <h4>{zombie.name}</h4>
                        <div className="breeding-zombie-stats">
                          <div>Level: {Number(zombie.level)}</div>
                        </div>
                        {selectedFeedingZombie === zombie.id && (
                          <div className="selected-indicator">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="breeding-section">
                  <h3>Select Kitty to Feed</h3>
                  <div className="breeding-zombie-grid">
                    {kitties.map((kitty) => (
                      <div
                        key={kitty.id}
                        className={`breeding-zombie-card ${selectedFeedingKitty === kitty.id ? "selected" : ""}`}
                        onClick={() => selectKittyForFeeding(kitty.id)}
                      >
                        <img
                          src={`https://robohash.org/${kitty.name + kitty.id}?set=set4&size=200x200`}
                          alt="Kitty"
                          className="breeding-zombie-image"
                        />
                        <h4>{kitty.name}</h4>
                        <div className="stat-item">
                          <div className="stat-label">DNA</div>
                          <div className="stat-value">{kitty.dna}</div>
                        </div>
                        {selectedFeedingKitty === kitty.id && (
                          <div className="selected-indicator">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="breeding-modal-actions">
                  <button
                    className="modern-btn modern-btn-secondary"
                    onClick={feedZombie}
                    disabled={selectedFeedingZombie === null || selectedFeedingKitty === null}
                  >
                    Feed Zombie
                  </button>
                  <button className="modern-btn modern-btn-outline" onClick={closeFeedingModal}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
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
                {eligibleBreedingZombies.length === 0 ? (
                  <p className="breeding-info">
                    No zombies at level {MINIMUM_BREEDING_LEVEL} or higher are available.
                    Level up your zombies to unlock breeding.
                  </p>
                ) : (
                  <div className="breeding-zombie-grid">
                    {eligibleBreedingZombies.map((zombie) => (
                      <div
                        key={zombie.id}
                        className={`breeding-zombie-card ${
                          selectedZombies.includes(zombie.id) ? "selected" : ""
                        }`}
                        onClick={() => selectZombieForBreeding(zombie.id)}
                      >
                        <img
                          key={`breeding-zombie-${zombie.id}-${zombie.dna}`}
                          src={generateZombieImage(zombie.dna).imageUrl}
                          alt="Zombie"
                          className="breeding-zombie-image"
                        />
                        <h4>{zombie.name}</h4>
                        <div className="breeding-zombie-stats">
                          <div>Level: {Number(zombie.level)}</div>
                          <div>DNA: {Number(zombie.dna)}</div>
                        </div>
                        {selectedZombies.includes(zombie.id) && (
                          <div className="selected-indicator">✓ Selected</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

        {/* Feeding Modal */}
        {showFeedingModal && (
          <div className="breeding-modal-overlay">
            <div className="breeding-modal">
              <div className="breeding-modal-header">
                <h2>🍖 Feed Your Zombies</h2>
                <button className="close-btn" onClick={closeFeedingModal}>
                  ×
                </button>
              </div>
              <div className="breeding-modal-content">
                <p className="breeding-info">
                  Select a zombie and a kitty. Feeding increases the zombie&apos;s level by 3
                  instantly.
                </p>
                <h3 className="modal-section-title">Choose a Zombie</h3>
                <div className="breeding-zombie-grid">
                  {zombies.map((zombie) => (
                    <div
                      key={`feed-zombie-${zombie.id}`}
                      className={`breeding-zombie-card ${
                        selectedFeedingZombie === zombie.id ? "selected" : ""
                      }`}
                      onClick={() => selectZombieForFeeding(zombie.id)}
                    >
                      <img
                        key={`feed-zombie-${zombie.id}-${zombie.dna}`}
                        src={generateZombieImage(zombie.dna).imageUrl}
                        alt="Zombie"
                        className="breeding-zombie-image"
                      />
                      <h4>{zombie.name}</h4>
                      <div className="breeding-zombie-stats">
                        <div>Level: {Number(zombie.level)}</div>
                        <div>DNA: {Number(zombie.dna)}</div>
                      </div>
                      {selectedFeedingZombie === zombie.id && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
                <h3 className="modal-section-title">Choose a Kitty</h3>
                <div className="breeding-zombie-grid">
                  {kitties.map((kitty) => (
                    <div
                      key={`feed-kitty-${kitty.id}`}
                      className={`breeding-zombie-card ${
                        selectedFeedingKitty === kitty.id ? "selected" : ""
                      }`}
                      onClick={() => selectKittyForFeeding(kitty.id)}
                    >
                      <img
                        src={`https://robohash.org/${kitty.name + kitty.id}?set=set4`}
                        alt="Kitty"
                        className="breeding-zombie-image"
                      />
                      <div className="kitty-info">
                        <h4>{kitty.name}</h4>
                        <div className="kitty-dna">DNA: {kitty.dna}</div>
                      </div>
                      <h4>{kitty.name}</h4>
                      <div className="breeding-zombie-stats">
                        <div>DNA: {String(kitty.dna).padStart(16, '0')}</div>
                        <div>ID: #{kitty.id}</div>
                      </div>
                      {selectedFeedingKitty === kitty.id && (
                        <div className="selected-indicator">✓ Selected</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="breeding-modal-actions">
                  <button
                    className="modern-btn modern-btn-secondary"
                    onClick={feedZombie}
                    disabled={selectedFeedingZombie === null || selectedFeedingKitty === null}
                  >
                    Feed Selected
                  </button>
                  <button
                    className="modern-btn modern-btn-outline"
                    onClick={closeFeedingModal}
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
          {zombies.map((zombie) => (
            <div key={zombie.id} className="creature-card fade-in-delay-3">
              <img
                key={`zombie-${zombie.id}-${zombie.dna}`}
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
                <BreedingStatus level={zombie.level} />
              </div>
              <div className="creature-actions">
                <button
                  className="action-btn action-btn-level"
                  onClick={() => levelUp(zombie.id)}
                >
                  Level Up
                </button>
                <button
                  className="action-btn action-btn-rename"
                  onClick={() => updateZombieName(zombie.id)}
                >
                  Rename
                </button>
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
                    <div className="stat-label">DNA</div>
                    <div className="stat-value">{kitty.dna}</div>
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
