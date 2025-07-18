import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Text,
  Alert,
  HStack,
} from "@chakra-ui/react";
import { Alchemy, Network } from "alchemy-sdk";
import { formatUnits, BrowserProvider } from "ethers";
import { useState, useEffect } from "react";

function App() {
  // Existing states
  const [userAddress, setUserAddress] = useState("");
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);

  // New wallet states
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");

  async function getTokenBalance() {
    const config = {
      apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
      network: Network.ETH_MAINNET,
    };

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(userAddress);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
  }

  // MetaMask detection
  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const provider = new BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();

        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setConnectedAddress(accounts[0].address);
          setUserAddress(accounts[0].address);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      setWalletError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return;
    }

    setIsConnecting(true);
    setWalletError("");

    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      setIsWalletConnected(true);
      setConnectedAddress(address);
      setUserAddress(address);
    } catch (error) {
      setWalletError("Failed to connect wallet. Please try again.");
      console.error("Wallet connection error:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setIsWalletConnected(false);
    setConnectedAddress("");
    setUserAddress("");
    setResults([]);
    setHasQueried(false);
    setTokenDataObjects([]);
  };

  // Check connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  return (
    <Box w="100vw">
      <Center>
        <Flex
          alignItems={"center"}
          justifyContent="center"
          flexDirection={"column"}
        >
          <Heading mb={0} fontSize={36}>
            ERC-20 Token Indexer
          </Heading>
          <Text>
            Connect your wallet or enter an address to check ERC-20 token
            balances!
          </Text>

          {/* Wallet Connection Section */}
          <Box mt={6}>
            {!isWalletConnected ? (
              <Button
                onClick={connectWallet}
                isLoading={isConnecting}
                loadingText="Connecting..."
                colorScheme="blue"
                size="lg"
              >
                Connect Wallet
              </Button>
            ) : (
              <HStack spacing={4}>
                <Text color="green.500">
                  Connected: {connectedAddress.slice(0, 6)}...
                  {connectedAddress.slice(-4)}
                </Text>
                <Button onClick={disconnectWallet} size="sm" variant="outline">
                  Disconnect
                </Button>
              </HStack>
            )}
          </Box>

          {/* Error Display */}
          {walletError && (
            <Alert status="error" mt={4} maxW="600px">
              <AlertIcon />
              {walletError}
            </Alert>
          )}
        </Flex>
      </Center>

      {/* Rest of existing UI */}
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={"center"}
      >
        <Heading mt={42}>
          Get all the ERC-20 token balances of this address:
        </Heading>
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          value={userAddress}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          placeholder={
            isWalletConnected
              ? "Connected wallet address"
              : "Enter Ethereum address"
          }
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={"90vw"} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex
                  flexDir={"column"}
                  color="white"
                  bg="blue"
                  w={"20vw"}
                  key={e.id}
                >
                  <Box>
                    <b>Symbol:</b> ${tokenDataObjects[i].symbol}&nbsp;
                  </Box>
                  <Box>
                    <b>Balance:</b>&nbsp;
                    {formatUnits(e.tokenBalance, tokenDataObjects[i].decimals)}
                  </Box>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
        ) : (
          "Please make a query! This may take a few seconds..."
        )}
      </Flex>
    </Box>
  );
}

export default App;
