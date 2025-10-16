import { useEffect, useRef, useState } from "react";
import Web3 from "web3";
import cryptoZombiesABI from "../cryptozombies_abi.json";
import "./CryptoZombie.css";

const CryptoZombies = () => {
  const [web3, setWeb3] = useState(null);
  const [cryptoZombies, setCryptoZombies] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [zombies, setZombies] = useState([]);
  const [kitties, setKitties] = useState([]); // Store created kitties here
  const [status, setStatus] = useState("");
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
            cryptoZombiesABI,
            "0x5d9f4035D4D8408a503CDC388D60A8c012d618Ce" // ZombieOwnership contract address
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
  // Update Zombie Name
  const updateZombieName = async (zombieId) => {
    const newName = prompt("Enter new name for your zombie:", "");
    if (!newName) {
      setStatus("Please enter a valid name");
      return;
    }

    try {
      // Call contract method to change the zombie name
      await cryptoZombies.methods
        .changeName(zombieId, newName)
        .send({ from: userAccount });

      // Fetch updated zombies to show the new name on the screen
      fetchZombies(userAccount, cryptoZombies);

      // Set success message
      setStatus(`Zombie name updated to ${newName}`);
    } catch (error) {
      console.error("Error updating name:", error);
      setStatus("Failed to update zombie name");
    }
  };

  const updateZombieDNA = async (zombieId, zombieLevel) => {
    // Check if zombie level is 20 or higher
    alert("Zombie level should be 20 or higher to update DNA");
    if ((zombieLevel < 20) | 1) {
      return;
    }

    if (zombieLevel < 20) {
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
            to: "0x5d9f4035D4D8408a503CDC388D60A8c012d618Ce",
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
    setStatus("Leveling up your Zombie");
    await cryptoZombies.methods
      .levelUp(zombieId)
      .send({ from: userAccount, value: web3.utils.toWei("0.001", "ether") });
    fetchZombies(userAccount, cryptoZombies); // Refresh zombies
    setStatus("Power overwhelming! Zombie successfully leveled up");
  };

  return (
    <div className="apple-bg min-h-screen">
      <div className="apple-container">
        <div className="apple-header">
          <h1>Crypto Zombies</h1>
          <p className="apple-subtitle">Collect, breed, and battle your digital creatures</p>
        </div>
        {/* Network Switch Button */}
        <div className="apple-fade-in">
          <button
            className="apple-btn apple-btn-primary apple-ripple"
            onClick={switchToGanacheNetwork}
          >
            Switch to Ganache Network
          </button>
        </div>

        {/* Zombie Creation */}
        <div className="apple-form-group apple-fade-in-delay-1">
          <input
            type="text"
            ref={zombieNameRef}
            placeholder="Enter zombie name"
            className="apple-input"
          />
          <button
            className="apple-btn apple-btn-success apple-ripple"
            onClick={() => createRandomZombie()}
          >
            Create Zombie
          </button>
        </div>

        {/* Kitty Creation Input */}
        <div className="mb-8 liquid-float">
          <div className="flex justify-center items-center gap-4">
            <input
              type="text"
              ref={kittyNameRef}
              placeholder="🐱 Enter Kitty Name"
              className="text-white mx-2 py-3 px-6 rounded-full bg-black bg-opacity-50 backdrop-blur-lg border border-teal-400 border-opacity-30 focus:border-opacity-80 focus:scale-105 transition-all duration-300"
            />
            <button
              className="bg-teal-600 hover:bg-teal-400 text-white font-bold py-3 px-6 rounded-full shadow-lg ripple"
              onClick={() => createKitty()}
            >
              🎨 Create Kitty
            </button>
          </div>
        </div>

        {/* Status Message */}
        {status !== "" && (
          <div id="txStatus" className="mb-8 liquid-float">
            <p className="text-teal-400 text-lg font-semibold">{status}</p>
          </div>
        )}

        {/* Display Zombies */}
        <div className="flex flex-wrap -mx-3 p-6">
          {zombies.map((zombie, index) => (
            <div key={index} className="w-full md:w-1/3 px-3 mb-8 liquid-float">
              <div className="zombie shadow-lg rounded-lg p-6 flex flex-col items-center">
                <div className="w-48 h-48 mb-6 flex items-center justify-center rounded-full p-3 bg-gradient-to-br from-teal-500/20 to-purple-500/20 backdrop-blur-sm">
                  <img
                    src={`https://robohash.org/${index + zombie.name}?set=set1`}
                    alt="Zombie"
                    className="zombie-image object-cover rounded-full w-full h-full"
                  />
                </div>
                <div className="text-center w-full space-y-3">
                  <h2 className="text-xl font-bold text-teal-400 mb-2">
                    🧟‍♂️ {zombie.name}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-teal-300 font-semibold">DNA</p>
                      <p className="text-white">{Number(zombie.dna)}</p>
                    </div>
                    <div className="bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                      <p className="text-teal-300 font-semibold">Level</p>
                      <p className="text-white">{Number(zombie.level)}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 bg-black/20 rounded-lg p-2">
                    ⏰ Ready:{" "}
                    {new Date(Number(zombie.readyTime) * 1000).toLocaleString()}
                  </p>
                  {/* <button
                    className='bg-teal-600 hover:bg-teal-400 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline shadow-lg'
                    onClick={() => levelUp(index)}>
                    Level Up
                  </button> */}
                  <div className="btn-wrapper flex flex-wrap gap-2 justify-center mt-4">
                    {/* Level Up Button */}
                    <button
                      className="btn bg-green-500 hover:bg-green-700 text-white font-semibold py-2 px-4 text-sm rounded-full ripple"
                      onClick={() => levelUp(index)}
                    >
                      ⬆️ Level Up
                    </button>

                    {/* Update Name Button (Blue) */}
                    <button
                      className="btn bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 text-sm rounded-full ripple"
                      onClick={() => updateZombieName(index)}
                    >
                      ✏️ Update Name
                    </button>

                    {/* Update DNA Button (Purple) */}
                    <button
                      className="btn bg-purple-500 hover:bg-purple-700 text-white font-semibold py-2 px-4 text-sm rounded-full ripple"
                      onClick={() => updateZombieDNA(index)}
                    >
                      🧬 Update DNA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Display Kitties */}
          {kitties.length > 0 &&
            kitties.map((kitty) => (
              <div
                key={kitty.id}
                className="w-full md:w-1/3 px-3 mb-8 liquid-float"
              >
                <div className="kitty shadow-lg rounded-lg p-6 flex flex-col items-center">
                  <div className="w-48 h-48 mb-6 flex items-center justify-center rounded-full p-3 bg-gradient-to-br from-pink-500/20 to-blue-500/20 backdrop-blur-sm">
                    <img
                      src={`https://robohash.org/${
                        kitty.name + kitty.id
                      }?set=set4`} // Different image set for kitties
                      alt="Kitty"
                      className="kitty-image object-cover rounded-full w-full h-full"
                    />
                  </div>
                  <div className="text-center w-full space-y-3">
                    <h2 className="text-xl font-bold text-teal-400 mb-2">
                      🐱 {kitty.name}
                    </h2>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-teal-300 font-semibold">
                          Generation
                        </p>
                        <p className="text-white">{kitty.generation}</p>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3 backdrop-blur-sm">
                        <p className="text-teal-300 font-semibold">Color</p>
                        <p className="text-white">{kitty.color}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 bg-black/20 rounded-lg p-2">
                      🎂 Birthday:{" "}
                      {new Date(kitty.birthday).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CryptoZombies;
