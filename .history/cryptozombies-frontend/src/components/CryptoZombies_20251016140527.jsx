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
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const ganacheChainId = '0x539'; // 1337 in hex
      
      if (chainId !== ganacheChainId) {
        try {
          // Try to switch to Ganache network
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ganacheChainId }],
          });
        } catch (switchError) {
          // If the network doesn't exist, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: ganacheChainId,
                  chainName: 'Ganache',
                  rpcUrls: ['http://127.0.0.1:7545'],
                  nativeCurrency: {
                    name: 'ETH',
                    symbol: 'ETH',
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
      console.error('Failed to switch to Ganache network:', error);
      setStatus('Please switch to Ganache network manually in MetaMask');
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
            "0x7a2Fea1897CAaF9CE6A7CCE236cd1A4C03452E6D" // Updated contract address
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
            to: "0x7a2Fea1897CAaF9CE6A7CCE236cd1A4C03452E6D",
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
    <div className="bg-gray-900 min-h-screen text-white py-8">
      <div className="container mx-auto text-center">
        {/* Zombie Creation Input */}
        <div className="mb-8">
          <input
            type="text"
            ref={zombieNameRef}
            placeholder="Enter Zombie Name"
            className="text-black mx-2 py-2 px-4 rounded-l-full"
          />
          <button
            className="bg-teal-600 hover:bg-teal-400 text-white font-bold py-2 px-4 rounded-r-full shadow-lg"
            onClick={() => createRandomZombie()}
          >
            Create Zombie
          </button>
        </div>

        {/* Kitty Creation Input */}
        <div className="mb-8">
          <input
            type="text"
            ref={kittyNameRef} // Kitty name input reference
            placeholder="Enter Kitty Name"
            className="text-black mx-2 py-2 px-4 rounded-l-full"
          />
          <button
            className="bg-teal-600 hover:bg-teal-400 text-white font-bold py-2 px-4 rounded-r-full shadow-lg"
            onClick={() => createKitty()}
          >
            Create Kitty
          </button>
        </div>

        {/* Status Message */}
        {status !== "" && (
          <div id="txStatus" className="mb-4">
            <p className="text-teal-400 animate-pulse">{status}</p>
          </div>
        )}

        {/* Display Zombies */}
        <div className="flex flex-wrap -mx-3 p-6">
          {zombies.map((zombie, index) => (
            <div key={index} className="w-full md:w-1/3 px-3 mb-6">
              <div className="zombie bg-black shadow-lg rounded-lg p-4 flex flex-col items-center hover:shadow-teal-500 transition-transform duration-300 hover:scale-105">
                <div className="w-44 h-44 mb-4 flex items-center justify-center rounded-full p-2">
                  <img
                    src={`https://robohash.org/${index + zombie.name}?set=set1`}
                    alt="Zombie"
                    className="zombie-image object-cover rounded-none"
                  />
                </div>
                <div className="text-left w-full">
                  <h2 className="text-lg font-bold text-teal-400 mb-1">
                    Name: {zombie.name}
                  </h2>
                  <p className="text-md text-gray-300">
                    DNA: {Number(zombie.dna)}
                  </p>
                  <p className="text-md text-gray-300">
                    Level: {Number(zombie.level)}
                  </p>
                  <p className="text-sm mb-4 text-gray-500">
                    Ready Time:{" "}
                    {new Date(Number(zombie.readyTime) * 1000).toLocaleString()}
                  </p>
                  {/* <button
                    className='bg-teal-600 hover:bg-teal-400 text-white font-bold py-2 px-4 rounded-full focus:outline-none focus:shadow-outline shadow-lg'
                    onClick={() => levelUp(index)}>
                    Level Up
                  </button> */}
                  <div className="btn-wrapper flex space-x-2">
                    {/* Level Up Button */}
                    <button
                      className="btn bg-green-500 hover:bg-green-700 text-white font-semibold py-1 px-3 text-sm rounded-full"
                      onClick={() => levelUp(index)}
                    >
                      Level Up
                    </button>

                    {/* Update Name Button (Blue) */}
                    <button
                      className="btn bg-blue-500 hover:bg-blue-700 text-white font-semibold py-1 px-3 text-sm rounded-full"
                      onClick={() => updateZombieName(index)}
                    >
                      Update Name
                    </button>

                    {/* Update DNA Button (Purple) */}
                    <button
                      className="btn bg-purple-500 hover:bg-purple-700 text-white font-semibold py-1 px-3 text-sm rounded-full"
                      onClick={() => updateZombieDNA(index)}
                    >
                      Update DNA
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Display Kitties */}
          {kitties.length > 0 &&
            kitties.map((kitty) => (
              <div key={kitty.id} className="w-full md:w-1/3 px-3 mb-6">
                <div className="kitty bg-black shadow-lg rounded-lg p-4 flex flex-col items-center hover:shadow-teal-500 transition-transform duration-300 hover:scale-105">
                  <div className="w-44 h-44 mb-4 flex items-center justify-center rounded-full p-2">
                    <img
                      src={`https://robohash.org/${
                        kitty.name + kitty.id
                      }?set=set4`} // Different image set for kitties
                      alt="Kitty"
                      className="kitty-image object-cover rounded-none"
                    />
                  </div>
                  <div className="text-left w-full">
                    <h2 className="text-lg font-bold text-teal-400 mb-1">
                      Name: {kitty.name}
                    </h2>
                    <p className="text-md text-gray-300">
                      Generation: {kitty.generation}
                    </p>
                    <p className="text-md text-gray-300">
                      Color: {kitty.color}
                    </p>
                    <p className="text-sm mb-4 text-gray-500">
                      Birthday: {new Date(kitty.birthday).toLocaleDateString()}
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
