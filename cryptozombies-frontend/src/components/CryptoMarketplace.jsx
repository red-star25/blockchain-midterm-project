import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import Web3 from "web3";
import { getContractAddress } from "../config/contractAddresses";
import cryptoZombiesABI from "../cryptozombies_abi.json";
import kittyCoreABI from "../kittycore_abi.json";
import "./CryptoZombie.css";

const generateZombieImage = (dna) => {
  let dnaStr = String(dna);
  while (dnaStr.length < 16) {
    dnaStr = "0" + dnaStr;
  }

  const zombieDetails = {
    headChoice: (parseInt(dnaStr.substring(0, 2)) % 7) + 1,
    eyeChoice: (parseInt(dnaStr.substring(2, 4)) % 11) + 1,
    shirtChoice: (parseInt(dnaStr.substring(4, 6)) % 6) + 1,
    skinColorChoice: (parseInt(dnaStr.substring(6, 8)) / 100) * 360,
    eyeColorChoice: (parseInt(dnaStr.substring(8, 10)) / 100) * 360,
    clothesColorChoice: (parseInt(dnaStr.substring(10, 12)) / 100) * 360,
  };

  const dnaHash = `${zombieDetails.headChoice}${zombieDetails.eyeChoice}${
    zombieDetails.shirtChoice
  }${Math.floor(zombieDetails.skinColorChoice)}${Math.floor(
    zombieDetails.eyeColorChoice
  )}${Math.floor(zombieDetails.clothesColorChoice)}`;

  return `https://robohash.org/${dnaHash}?set=set2&size=200x200`;
};

const normalizeKittyData = (rawKitty, index) => {
  if (!rawKitty) {
    return {
      id: index,
      name: `Kitty${index}`,
      dna: "0",
      multiplier: 3,
    };
  }

  const nameValue = rawKitty.name ?? rawKitty[0] ?? `Kitty${index}`;
  const dnaValue = rawKitty.dna ?? rawKitty[1] ?? rawKitty.genes ?? "0";
  const multiplierRaw = Number(rawKitty.multiplier ?? rawKitty[2] ?? 3);
  const multiplier = Number.isFinite(multiplierRaw)
    ? Math.max(2, Math.min(6, multiplierRaw))
    : 3;

  return {
    id: index,
    name: nameValue,
    dna: dnaValue.toString(),
    multiplier,
  };
};

const CryptoMarketplace = ({ onGoToDashboard }) => {
  const [web3, setWeb3] = useState(null);
  const [cryptoZombies, setCryptoZombies] = useState(null);
  const [kittyContract, setKittyContract] = useState(null);
  const [userAccount, setUserAccount] = useState(null);
  const [zombies, setZombies] = useState([]);
  const [kitties, setKitties] = useState([]);
  const [listedZombies, setListedZombies] = useState([]);
  const [listedKitties, setListedKitties] = useState([]);
  const [status, setStatus] = useState("");
  const [showZombiePicker, setShowZombiePicker] = useState(false);
  const [showKittyPicker, setShowKittyPicker] = useState(false);

  const switchToGanacheNetwork = async () => {
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const ganacheChainId = "0x539";

      if (chainId !== ganacheChainId) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: ganacheChainId }],
          });
        } catch (switchError) {
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
    const init = async () => {
      if (!window.ethereum) {
        setStatus("MetaMask not detected. Please install MetaMask.");
        return;
      }

      const web3Instance = new Web3(window.ethereum);
      setWeb3(web3Instance);

      try {
        await switchToGanacheNetwork();
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const accounts = await web3Instance.eth.getAccounts();
        const account = accounts[0];
        setUserAccount(account);

        const cryptoZombiesContract = new web3Instance.eth.Contract(
          cryptoZombiesABI.abi,
          getContractAddress("zombieOwnership")
        );
        setCryptoZombies(cryptoZombiesContract);

        const kittyCoreContract = new web3Instance.eth.Contract(
          kittyCoreABI.abi,
          getContractAddress("kittyCore")
        );
        setKittyContract(kittyCoreContract);

        await Promise.all([
          fetchZombies(account, cryptoZombiesContract),
          fetchKitties(kittyCoreContract),
        ]);
        setStatus("");
      } catch (error) {
        console.error("Error initialising marketplace:", error);
        setStatus("Failed to load marketplace data.");
      }
    };

    init();
  }, []);

  const fetchZombies = async (owner, contract) => {
    if (!contract || !owner) {
      return;
    }

    try {
      const ids = await contract.methods.getZombiesByOwner(owner).call();
      const zombiesData = await Promise.all(
        ids.map(async (id) => {
          const zombie = await contract.methods.zombies(id).call();
          return {
            id: Number(id),
            name: zombie.name,
            dna: zombie.dna,
            level: zombie.level,
          };
        })
      );
      setZombies(zombiesData);
    } catch (error) {
      console.error("Error fetching zombies:", error);
    }
  };

  const fetchKitties = async (contract) => {
    if (!contract) {
      return;
    }

    try {
      const kittyCount = Number(await contract.methods.getKittyCount().call());
      if (!kittyCount) {
        setKitties([]);
        return;
      }

      const kittyData = await Promise.all(
        Array.from({ length: kittyCount }, (_, index) =>
          contract.methods.getKittyMetadata(index).call()
        )
      );

      setKitties(kittyData.map((kitty, index) => normalizeKittyData(kitty, index)));
    } catch (error) {
      console.error("Error fetching kitties:", error);
    }
  };

  const unlistedZombies = useMemo(
    () =>
      zombies.filter(
        (zombie) => !listedZombies.some((listed) => listed.id === zombie.id)
      ),
    [zombies, listedZombies]
  );

  const unlistedKitties = useMemo(
    () =>
      kitties.filter(
        (kitty) => !listedKitties.some((listed) => listed.id === kitty.id)
      ),
    [kitties, listedKitties]
  );

  const addZombieToMarket = (zombie) => {
    setListedZombies((current) => {
      if (current.some((item) => item.id === zombie.id)) {
        return current;
      }
      return [...current, zombie];
    });
    setShowZombiePicker(false);
    setStatus(`${zombie.name} listed on marketplace.`);
  };

  const addKittyToMarket = (kitty) => {
    setListedKitties((current) => {
      if (current.some((item) => item.id === kitty.id)) {
        return current;
      }
      return [...current, kitty];
    });
    setShowKittyPicker(false);
    setStatus(`${kitty.name} listed on marketplace.`);
  };

  const removeZombieFromMarket = (id) => {
    setListedZombies((current) => current.filter((zombie) => zombie.id !== id));
    setStatus("Zombie removed from marketplace.");
  };

  const removeKittyFromMarket = (id) => {
    setListedKitties((current) => current.filter((kitty) => kitty.id !== id));
    setStatus("Kitty removed from marketplace.");
  };

  return (
    <div className="modern-bg">
      <div className="modern-container marketplace-container">
        <div className="modern-header header-with-action">
          <div className="header-text">
            <h1 className="modern-title">CryptoZombies Marketplace</h1>
            <p className="modern-subtitle">
              Showcase your zombies and kitties to the community.
            </p>
          </div>
          {onGoToDashboard && (
            <button
              className="modern-btn modern-btn-outline header-switch-btn"
              onClick={onGoToDashboard}
            >
              Back to Dashboard
            </button>
          )}
        </div>

        <div className="marketplace-actions">
          <button
            className="modern-btn modern-btn-secondary"
            onClick={() => setShowZombiePicker(true)}
            disabled={!unlistedZombies.length}
          >
            List Zombie
          </button>
          <button
            className="modern-btn modern-btn-outline"
            onClick={() => setShowKittyPicker(true)}
            disabled={!unlistedKitties.length}
          >
            List Kitty
          </button>
        </div>

        {status && (
          <div className="modern-status">
            <p>{status}</p>
          </div>
        )}

        <div className="marketplace-columns">
          <section className="marketplace-column">
            <header className="marketplace-column-header">
              <h2>Zombies</h2>
              <span>{listedZombies.length} listed</span>
            </header>
            {listedZombies.length === 0 ? (
              <p className="marketplace-empty">No zombies listed yet.</p>
            ) : (
              <div className="marketplace-grid">
                {listedZombies.map((zombie) => (
                  <div key={`listed-zombie-${zombie.id}`} className="creature-card">
                    <img
                      src={generateZombieImage(zombie.dna)}
                      alt={zombie.name}
                      className="creature-image"
                    />
                    <h3 className="creature-name">{zombie.name}</h3>
                    <div className="creature-stats">
                      <div className="stat-item">
                        <div className="stat-label">Level</div>
                        <div className="stat-value">{Number(zombie.level)}</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">DNA</div>
                        <div className="stat-value">{String(zombie.dna)}</div>
                      </div>
                    </div>
                    <button
                      className="modern-btn modern-btn-outline marketplace-remove"
                      onClick={() => removeZombieFromMarket(zombie.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="marketplace-column">
            <header className="marketplace-column-header">
              <h2>Kitties</h2>
              <span>{listedKitties.length} listed</span>
            </header>
            {listedKitties.length === 0 ? (
              <p className="marketplace-empty">No kitties listed yet.</p>
            ) : (
              <div className="marketplace-grid">
                {listedKitties.map((kitty) => (
                  <div key={`listed-kitty-${kitty.id}`} className="creature-card">
                    <img
                      src={`https://robohash.org/${kitty.name + kitty.id}?set=set4`}
                      alt={kitty.name}
                      className="creature-image"
                    />
                    <h3 className="creature-name">{kitty.name}</h3>
                    <div className="creature-stats">
                      <div className="stat-item">
                        <div className="stat-label">Boost</div>
                        <div className="stat-value">+{kitty.multiplier}</div>
                      </div>
                      <div className="stat-item">
                        <div className="stat-label">DNA</div>
                        <div className="stat-value">{kitty.dna}</div>
                      </div>
                    </div>
                    <button
                      className="modern-btn modern-btn-outline marketplace-remove"
                      onClick={() => removeKittyFromMarket(kitty.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {showZombiePicker && (
        <div className="breeding-modal-overlay">
          <div className="breeding-modal">
            <div className="breeding-modal-header">
              <h2>Select Zombie to List</h2>
              <button className="close-btn" onClick={() => setShowZombiePicker(false)}>
                ×
              </button>
            </div>
            <div className="breeding-modal-content">
              {unlistedZombies.length === 0 ? (
                <p className="breeding-info">
                  You have no additional zombies available to list.
                </p>
              ) : (
                <div className="breeding-zombie-grid">
                  {unlistedZombies.map((zombie) => (
                    <div
                      key={`picker-zombie-${zombie.id}`}
                      className="breeding-zombie-card"
                      onClick={() => addZombieToMarket(zombie)}
                    >
                      <img
                        src={generateZombieImage(zombie.dna)}
                        alt={zombie.name}
                        className="breeding-zombie-image"
                      />
                      <h4>{zombie.name}</h4>
                      <div className="breeding-zombie-stats">
                        <div>Level: {Number(zombie.level)}</div>
                        <div>DNA: {String(zombie.dna)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="breeding-modal-actions">
                <button
                  className="modern-btn modern-btn-outline"
                  onClick={() => setShowZombiePicker(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showKittyPicker && (
        <div className="breeding-modal-overlay">
          <div className="breeding-modal">
            <div className="breeding-modal-header">
              <h2>Select Kitty to List</h2>
              <button className="close-btn" onClick={() => setShowKittyPicker(false)}>
                ×
              </button>
            </div>
            <div className="breeding-modal-content">
              {unlistedKitties.length === 0 ? (
                <p className="breeding-info">You have no kitties available to list.</p>
              ) : (
                <div className="breeding-zombie-grid">
                  {unlistedKitties.map((kitty) => (
                    <div
                      key={`picker-kitty-${kitty.id}`}
                      className="breeding-zombie-card"
                      onClick={() => addKittyToMarket(kitty)}
                    >
                      <img
                        src={`https://robohash.org/${kitty.name + kitty.id}?set=set4&size=200x200`}
                        alt={kitty.name}
                        className="breeding-zombie-image"
                      />
                      <h4>{kitty.name}</h4>
                      <div className="breeding-zombie-stats">
                        <div>Boost: +{kitty.multiplier}</div>
                        <div>DNA: {kitty.dna}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="breeding-modal-actions">
                <button
                  className="modern-btn modern-btn-outline"
                  onClick={() => setShowKittyPicker(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CryptoMarketplace.propTypes = {
  onGoToDashboard: PropTypes.func,
};

export default CryptoMarketplace;
