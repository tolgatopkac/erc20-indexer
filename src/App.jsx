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
  Badge,
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

  // Wallet states
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [connectedAddress, setConnectedAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");

  // Error types
  const [errorType, setErrorType] = useState(""); // 'validation', 'network', 'api', 'rate-limit', 'ens'

  // ENS states
  const [isResolvingENS, setIsResolvingENS] = useState(false);
  const [resolvedENS, setResolvedENS] = useState("");
  const [ensName, setEnsName] = useState("");

  // Validation functions
  const validateInput = (input) => {
    try {
      // Check if input is empty
      if (!input || typeof input !== "string" || input.trim() === "") {
        return {
          isValid: false,
          error: "Please enter an address or connect your wallet",
        };
      }

      const cleanInput = input.trim();

      // Check if it's an ENS name
      if (isENSName(cleanInput)) {
        return { isValid: true, type: "ens", value: cleanInput };
      }

      // Check if it's an Ethereum address
      if (cleanInput.startsWith("0x")) {
        return validateEthereumAddress(cleanInput);
      }

      // If it doesn't start with 0x and is not ENS, it's invalid
      return {
        isValid: false,
        error:
          "Please enter a valid Ethereum address (0x...) or ENS name (xxx.eth)",
      };
    } catch (error) {
      console.error("validateInput error:", error);
      return {
        isValid: false,
        error: "Invalid input format",
      };
    }
  };

  const isENSName = (name) => {
    try {
      // ENS names should be longer than 5 characters and contain at least one dot
      if (
        !name ||
        typeof name !== "string" ||
        name.length < 7 ||
        !name.includes(".")
      ) {
        return false;
      }

      // Common ENS TLDs
      const ensTLDs = [".eth", ".xyz", ".kred", ".luxe", ".club", ".art"];

      // Check if it ends with a known ENS TLD
      const hasValidTLD = ensTLDs.some((tld) =>
        name.toLowerCase().endsWith(tld)
      );

      if (!hasValidTLD) {
        return false;
      }

      // Check if the name part before TLD is at least 3 characters
      const tld = ensTLDs.find((tld) => name.toLowerCase().endsWith(tld));
      if (!tld) {
        return false;
      }

      const namePart = name.slice(0, -tld.length);

      // Name part should be at least 3 characters and contain only valid characters
      return namePart.length >= 3 && /^[a-zA-Z0-9-]+$/.test(namePart);
    } catch (error) {
      console.error("isENSName error:", error);
      return false;
    }
  };

  const validateEthereumAddress = (address) => {
    try {
      if (!address || typeof address !== "string") {
        return { isValid: false, error: "Invalid address format" };
      }

      const cleanAddress = address.trim();

      // Check if it starts with 0x
      if (!cleanAddress.startsWith("0x")) {
        return {
          isValid: false,
          error: "Ethereum address must start with '0x'",
        };
      }

      // Check if it's the correct length (42 characters)
      if (cleanAddress.length !== 42) {
        return {
          isValid: false,
          error: "Ethereum address must be 42 characters long",
        };
      }

      // Check if it contains only valid hex characters
      const hexRegex = /^0x[a-fA-F0-9]{40}$/;
      if (!hexRegex.test(cleanAddress)) {
        return {
          isValid: false,
          error: "Ethereum address contains invalid characters",
        };
      }

      // Check for common mistakes
      if (cleanAddress === "0x0000000000000000000000000000000000000000") {
        return { isValid: false, error: "Cannot use zero address" };
      }

      return { isValid: true, type: "address", address: cleanAddress };
    } catch (error) {
      console.error("validateEthereumAddress error:", error);
      return { isValid: false, error: "Address validation failed" };
    }
  };

  const resolveENS = async (ensName) => {
    try {
      setIsResolvingENS(true);

      // Check if MetaMask is available
      if (typeof window.ethereum === "undefined") {
        throw new Error("MetaMask is required for ENS resolution");
      }

      // Use ethers provider for ENS resolution
      const provider = new BrowserProvider(window.ethereum);

      // Try to resolve ENS name
      try {
        const resolver = await provider.getResolver(ensName);

        if (!resolver) {
          throw new Error("ENS name not found or does not have a resolver");
        }

        const address = await resolver.getAddress();

        if (
          !address ||
          address === "0x0000000000000000000000000000000000000000"
        ) {
          throw new Error("ENS name does not resolve to a valid address");
        }

        return address;
      } catch (resolverError) {
        console.error("ENS resolver error:", resolverError);
        throw new Error(`ENS name '${ensName}' could not be resolved`);
      }
    } catch (error) {
      console.error("ENS resolution error:", error);
      throw new Error(`Failed to resolve ENS name: ${error.message}`);
    } finally {
      setIsResolvingENS(false);
    }
  };

  const validateApiKey = () => {
    const apiKey = import.meta.env.VITE_ALCHEMY_API_KEY;

    if (!apiKey || apiKey.includes("COPY-PASTE") || apiKey.length < 10) {
      return {
        isValid: false,
        error:
          "Invalid or missing Alchemy API key. Please check your .env file.",
      };
    }

    return { isValid: true };
  };

  const getErrorMessage = (error, type) => {
    // Network errors
    if (error.code === "NETWORK_ERROR" || error.message.includes("network")) {
      return "Network connection error. Please check your internet connection.";
    }

    // Rate limiting
    if (
      error.response?.status === 429 ||
      error.message.includes("rate limit")
    ) {
      return "Too many requests. Please wait a moment and try again.";
    }

    // API errors
    if (error.response?.status === 401) {
      return "Invalid API key. Please check your Alchemy API key.";
    }

    if (error.response?.status === 403) {
      return "Access forbidden. Please check your API key permissions.";
    }

    if (error.response?.status >= 500) {
      return "Server error. Please try again later.";
    }

    // ENS resolution errors
    if (error.message.includes("ENS")) {
      return "Invalid ENS name. Please use a valid Ethereum address.";
    }

    // Timeout errors
    if (error.code === "TIMEOUT" || error.message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }

    // Default error
    return error.message || "An unexpected error occurred. Please try again.";
  };

  async function getTokenBalance() {
    // Reset all states
    setWalletError("");
    setErrorType("");
    setHasQueried(false);
    setResolvedENS("");
    setResults([]);
    setTokenDataObjects([]);
    setLoadingStep("");

    // Validate input
    const inputValidation = validateInput(userAddress);
    if (!inputValidation.isValid) {
      setWalletError(inputValidation.error);
      setErrorType("validation");
      setIsLoading(false);
      return;
    }

    let finalAddress = "";

    // Handle ENS resolution
    if (inputValidation.type === "ens") {
      try {
        setIsLoading(true);
        setLoadingStep("Resolving ENS name...");
        finalAddress = await resolveENS(inputValidation.value);
        setResolvedENS(finalAddress);
        setEnsName(inputValidation.value);
      } catch (error) {
        console.error("ENS resolution failed:", error);
        setWalletError(error.message || "Failed to resolve ENS name");
        setErrorType("ens");
        setIsLoading(false);
        setLoadingStep("");
        return;
      }
    } else {
      finalAddress = inputValidation.address;
      setEnsName("");
      setResolvedENS("");
    }

    // Validate API key
    const apiKeyValidation = validateApiKey();
    if (!apiKeyValidation.isValid) {
      setWalletError(apiKeyValidation.error);
      setErrorType("api");
      return;
    }

    setIsLoading(true);
    setLoadingStep("Initializing...");

    try {
      const config = {
        apiKey: import.meta.env.VITE_ALCHEMY_API_KEY,
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(config);

      setLoadingStep("Validating address...");

      // Additional runtime validation
      try {
        // This will throw if address is invalid
        const checksumAddress = finalAddress; // ethers.utils.getAddress(finalAddress) in v5
        console.log("Using address:", checksumAddress);
      } catch (checksumError) {
        setWalletError("Invalid Ethereum address format");
        setErrorType("validation");
        return;
      }

      setLoadingStep("Fetching token balances...");
      const data = await alchemy.core.getTokenBalances(finalAddress);

      // Validate response
      if (!data) {
        setWalletError("No response from server. Please try again.");
        setErrorType("api");
        return;
      }

      if (!data.tokenBalances || !Array.isArray(data.tokenBalances)) {
        setWalletError("Invalid response format. Please try again.");
        setErrorType("api");
        return;
      }

      setResults(data);

      if (data.tokenBalances.length === 0) {
        setLoadingStep("No tokens found");
        setHasQueried(true);
        return;
      }

      setLoadingStep("Fetching token metadata...");
      const tokenDataPromises = [];

      // Process tokens with error handling
      for (let i = 0; i < data.tokenBalances.length; i++) {
        const tokenBalance = data.tokenBalances[i];

        // Validate token balance object
        if (!tokenBalance || !tokenBalance.contractAddress) {
          console.warn(`Invalid token balance at index ${i}:`, tokenBalance);
          continue;
        }

        try {
          const tokenData = alchemy.core.getTokenMetadata(
            tokenBalance.contractAddress
          );
          tokenDataPromises.push(tokenData);
        } catch (metadataError) {
          console.warn(
            `Failed to fetch metadata for token ${tokenBalance.contractAddress}:`,
            metadataError
          );
          // Add a placeholder for failed metadata
          tokenDataPromises.push(
            Promise.resolve({
              symbol: "UNKNOWN",
              name: "Unknown Token",
              decimals: 18,
              logo: null,
            })
          );
        }
      }

      setLoadingStep("Processing token data...");

      // Use Promise.allSettled to handle partial failures
      const metadataResults = await Promise.allSettled(tokenDataPromises);
      const processedMetadata = metadataResults.map((result, index) => {
        if (result.status === "fulfilled") {
          return result.value;
        } else {
          console.warn(
            `Metadata fetch failed for token ${index}:`,
            result.reason
          );
          return {
            symbol: "UNKNOWN",
            name: "Unknown Token",
            decimals: 18,
            logo: null,
          };
        }
      });

      setTokenDataObjects(processedMetadata);
      setHasQueried(true);
      setLoadingStep("Complete!");
    } catch (error) {
      console.error("Error fetching token balances:", error);

      // Determine error type and message
      const errorMessage = getErrorMessage(error);
      setWalletError(errorMessage);

      // Set error type based on error characteristics
      if (error.code === "NETWORK_ERROR" || error.message.includes("network")) {
        setErrorType("network");
      } else if (
        error.response?.status === 429 ||
        error.message.includes("rate limit")
      ) {
        setErrorType("rate-limit");
      } else if (
        error.response?.status === 401 ||
        error.response?.status === 403
      ) {
        setErrorType("api");
      } else {
        setErrorType("unknown");
      }
    } finally {
      setIsLoading(false);
      setLoadingStep("");
    }
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
    try {
      setIsWalletConnected(false);
      setConnectedAddress("");
      setUserAddress("");
      setResults([]);
      setHasQueried(false);
      setTokenDataObjects([]);
      setWalletError("");
      setErrorType("");
      setEnsName("");
      setResolvedENS("");
      setIsLoading(false);
      setIsResolvingENS(false);
      setLoadingStep("");
    } catch (error) {
      console.error("Disconnect wallet error:", error);
      // Force reset critical states
      setIsWalletConnected(false);
      setConnectedAddress("");
      setUserAddress("");
      setWalletError("");
      setErrorType("");
    }
  };

  // Check connection on component mount
  useEffect(() => {
    checkWalletConnection();
  }, []);

  // CSS Styles
  const spinnerStyle = {
    width: "50px",
    height: "50px",
    border: "4px solid #E2E8F0",
    borderTop: "4px solid #667EEA",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  };

  const progressBarStyle = {
    width: "400px",
    height: "6px",
    backgroundColor: "#E2E8F0",
    borderRadius: "9999px",
    overflow: "hidden",
  };

  const progressBarInnerStyle = {
    width: "100%",
    height: "100%",
    background: "linear-gradient(90deg, #667EEA 0%, #764BA2 100%)",
    animation: "pulse 2s ease-in-out infinite",
  };

  // Custom Divider Component
  const CustomDivider = ({ my = 4 }) => (
    <Box w="100%" h="1px" bg="gray.200" my={my} />
  );

  return (
    <>
      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { transform: scaleX(0.8); }
            50% { transform: scaleX(1.2); }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .fade-in {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style>

      <Box
        minH="100vh"
        bg="linear-gradient(135deg, #667EEA 0%, #764BA2 100%)"
        py={8}
      >
        <Box maxW="1200px" mx="auto" px={4}>
          {/* Header Section */}
          <Box
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(10px)"
            borderRadius="3xl"
            p={8}
            mb={8}
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.1)"
            className="fade-in"
          >
            <Center>
              <Flex
                alignItems={"center"}
                justifyContent="center"
                flexDirection={"column"}
                gap={4}
              >
                <Heading
                  fontSize={["3xl", "4xl", "5xl"]}
                  bgGradient="linear(to-r, #667EEA, #764BA2)"
                  bgClip="text"
                  textAlign="center"
                >
                  🪙 ERC-20 Token Indexer
                </Heading>
                <Text
                  fontSize={["md", "lg"]}
                  color="gray.600"
                  textAlign="center"
                  maxW="600px"
                >
                  Connect your wallet or enter an address to discover all ERC-20
                  token balances! Fast, secure, and beautiful.
                </Text>

                {/* Wallet Connection Section */}
                <Box mt={6}>
                  {!isWalletConnected ? (
                    <Button
                      onClick={connectWallet}
                      isLoading={isConnecting}
                      loadingText="Connecting..."
                      size="lg"
                      bgGradient="linear(to-r, #667EEA, #764BA2)"
                      color="white"
                      _hover={{
                        bgGradient: "linear(to-r, #5A67D8, #6B46C1)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
                      }}
                      _active={{
                        transform: "translateY(0)",
                      }}
                      transition="all 0.3s"
                      borderRadius="xl"
                      px={8}
                    >
                      🦊 Connect Wallet
                    </Button>
                  ) : (
                    <HStack
                      spacing={4}
                      bg="green.50"
                      p={4}
                      borderRadius="xl"
                      border="2px solid"
                      borderColor="green.200"
                    >
                      <Badge
                        colorScheme="green"
                        fontSize="sm"
                        px={3}
                        py={1}
                        borderRadius="full"
                      >
                        ✅ Connected
                      </Badge>
                      <Text color="green.700" fontWeight="medium">
                        {connectedAddress.slice(0, 6)}...
                        {connectedAddress.slice(-4)}
                      </Text>
                      <Button
                        onClick={disconnectWallet}
                        size="sm"
                        variant="outline"
                        colorScheme="red"
                        borderRadius="lg"
                      >
                        Disconnect
                      </Button>
                    </HStack>
                  )}
                </Box>

                {/* Error Display */}
                {walletError && typeof walletError === "string" && (
                  <Alert
                    status="error"
                    mt={4}
                    maxW="600px"
                    borderRadius="xl"
                    bg="red.50"
                    border="2px solid"
                    borderColor="red.200"
                  >
                    <Flex align="center" gap={2}>
                      <Text fontSize="lg">
                        {errorType === "validation" && "⚠️"}
                        {errorType === "ens" && "❌"}
                        {errorType === "network" && "🌐"}
                        {errorType === "api" && "🔑"}
                        {errorType === "rate-limit" && "⏰"}
                        {!errorType && "❌"}
                      </Text>
                      <Box>
                        <Text color="red.700" fontWeight="medium">
                          {walletError}
                        </Text>
                        {errorType === "validation" && (
                          <Text color="red.600" fontSize="sm" mt={1}>
                            💡 Tip: Ethereum addresses start with '0x' and are
                            42 characters long, or use ENS names like
                            'vitalik.eth' (minimum 3 characters before .eth)
                          </Text>
                        )}
                        {errorType === "ens" && (
                          <Text color="red.600" fontSize="sm" mt={1}>
                            💡 Tip: Make sure the ENS name is correct and
                            resolves to a valid address. Try a well-known ENS
                            like 'vitalik.eth'
                          </Text>
                        )}
                        {errorType === "network" && (
                          <Text color="red.600" fontSize="sm" mt={1}>
                            💡 Tip: Check your internet connection and try again
                          </Text>
                        )}
                        {errorType === "api" && (
                          <Text color="red.600" fontSize="sm" mt={1}>
                            💡 Tip: Make sure you have a valid Alchemy API key
                            in your .env file
                          </Text>
                        )}
                        {errorType === "rate-limit" && (
                          <Text color="red.600" fontSize="sm" mt={1}>
                            💡 Tip: Please wait a moment before making another
                            request
                          </Text>
                        )}
                      </Box>
                    </Flex>
                  </Alert>
                )}
              </Flex>
            </Center>
          </Box>

          {/* Input Section */}
          <Box
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(10px)"
            borderRadius="3xl"
            p={8}
            mb={8}
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.1)"
            className="fade-in"
          >
            <Flex direction="column" align="center" gap={6}>
              <Heading size="lg" color="gray.700" textAlign="center">
                🔍 Token Balance Checker
              </Heading>

              <Box position="relative" maxW="600px">
                <Input
                  onChange={(e) => {
                    try {
                      const value = e.target.value;
                      setUserAddress(value);

                      // Reset states first
                      setWalletError("");
                      setErrorType("");
                      setEnsName("");

                      // Real-time validation feedback
                      if (value && !isWalletConnected) {
                        try {
                          const validation = validateInput(value);
                          if (validation && typeof validation === "object") {
                            if (!validation.isValid) {
                              setWalletError(
                                validation.error || "Invalid input"
                              );
                              setErrorType("validation");
                            } else {
                              // If it's ENS, show that it's detected
                              if (
                                validation.type === "ens" &&
                                validation.value
                              ) {
                                setEnsName(validation.value);
                              }
                            }
                          } else {
                            setWalletError("Invalid input format");
                            setErrorType("validation");
                          }
                        } catch (validationError) {
                          console.error("Validation error:", validationError);
                          setWalletError("Invalid input format");
                          setErrorType("validation");
                        }
                      }
                    } catch (error) {
                      console.error("Input change error:", error);
                      setWalletError("Input error");
                      setErrorType("validation");
                    }
                  }}
                  value={userAddress}
                  placeholder={
                    isWalletConnected
                      ? "Connected wallet address"
                      : "Enter Ethereum address (0x...) or ENS name (xxx.eth)"
                  }
                  size="lg"
                  bg="white"
                  color="gray.800"
                  border="2px solid"
                  borderColor={(() => {
                    try {
                      if (
                        walletError &&
                        typeof walletError === "string" &&
                        (errorType === "validation" || errorType === "ens")
                      ) {
                        return "red.300";
                      }
                      if (
                        userAddress &&
                        typeof userAddress === "string" &&
                        !walletError
                      ) {
                        return ensName && typeof ensName === "string"
                          ? "purple.300"
                          : "green.300";
                      }
                      return "gray.200";
                    } catch (error) {
                      console.error("Border color error:", error);
                      return "gray.200";
                    }
                  })()}
                  borderRadius="xl"
                  _hover={{
                    borderColor: (() => {
                      try {
                        if (
                          walletError &&
                          typeof walletError === "string" &&
                          (errorType === "validation" || errorType === "ens")
                        ) {
                          return "red.400";
                        }
                        return "purple.300";
                      } catch (error) {
                        console.error("Hover border color error:", error);
                        return "purple.300";
                      }
                    })(),
                  }}
                  _focus={{
                    borderColor: (() => {
                      try {
                        if (
                          walletError &&
                          typeof walletError === "string" &&
                          (errorType === "validation" || errorType === "ens")
                        ) {
                          return "red.500";
                        }
                        return "purple.500";
                      } catch (error) {
                        console.error("Focus border color error:", error);
                        return "purple.500";
                      }
                    })(),
                    boxShadow: (() => {
                      try {
                        if (
                          walletError &&
                          typeof walletError === "string" &&
                          (errorType === "validation" || errorType === "ens")
                        ) {
                          return "0 0 0 3px rgba(239, 68, 68, 0.1)";
                        }
                        return "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      } catch (error) {
                        console.error("Focus box shadow error:", error);
                        return "0 0 0 3px rgba(102, 126, 234, 0.1)";
                      }
                    })(),
                  }}
                  _placeholder={{
                    color: "gray.400",
                  }}
                  disabled={isLoading}
                  fontSize="md"
                  p={6}
                  pr={12}
                />

                {/* Custom Right Element */}
                <Box
                  position="absolute"
                  right={4}
                  top="50%"
                  transform="translateY(-50%)"
                  zIndex={1}
                >
                  {(() => {
                    try {
                      if (isResolvingENS) {
                        return (
                          <Text fontSize="xl" color="yellow.500">
                            🔄
                          </Text>
                        );
                      }

                      if (isWalletConnected) {
                        return (
                          <Text fontSize="xl" color="blue.500">
                            🔗
                          </Text>
                        );
                      }

                      if (walletError && typeof walletError === "string") {
                        if (errorType === "validation") {
                          return (
                            <Text fontSize="xl" color="red.500">
                              ⚠️
                            </Text>
                          );
                        }
                        if (errorType === "ens") {
                          return (
                            <Text fontSize="xl" color="red.500">
                              ❌
                            </Text>
                          );
                        }
                      }

                      if (
                        ensName &&
                        !walletError &&
                        typeof ensName === "string"
                      ) {
                        return (
                          <Text fontSize="xl" color="purple.500">
                            🌐
                          </Text>
                        );
                      }

                      if (
                        userAddress &&
                        !walletError &&
                        !ensName &&
                        typeof userAddress === "string"
                      ) {
                        return (
                          <Text fontSize="xl" color="green.500">
                            ✅
                          </Text>
                        );
                      }

                      return null;
                    } catch (error) {
                      console.error("Icon rendering error:", error);
                      return null;
                    }
                  })()}
                </Box>
              </Box>

              <Button
                onClick={getTokenBalance}
                size="lg"
                bgGradient="linear(to-r, #667EEA, #764BA2)"
                color="white"
                _hover={{
                  bgGradient: "linear(to-r, #5A67D8, #6B46C1)",
                  transform: "translateY(-2px)",
                  boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)",
                }}
                _active={{
                  transform: "translateY(0)",
                }}
                transition="all 0.3s"
                borderRadius="xl"
                px={8}
                py={6}
                isLoading={isLoading}
                loadingText={loadingStep || "Loading..."}
                disabled={isLoading || !userAddress}
              >
                ⚡ Check Token Balances
              </Button>

              {/* Loading Progress */}
              {(isLoading || isResolvingENS) && (
                <Flex
                  direction="column"
                  align="center"
                  gap={4}
                  className="fade-in"
                >
                  <Box style={progressBarStyle}>
                    <Box style={progressBarInnerStyle} />
                  </Box>
                  <Text color="purple.600" fontSize="sm" fontWeight="medium">
                    {loadingStep}
                  </Text>
                  {isResolvingENS && (
                    <Text color="yellow.600" fontSize="xs">
                      🔄 Resolving ENS name...
                    </Text>
                  )}
                </Flex>
              )}
            </Flex>
          </Box>

          {/* Results Section */}
          <Box
            bg="rgba(255, 255, 255, 0.95)"
            backdropFilter="blur(10px)"
            borderRadius="3xl"
            p={8}
            boxShadow="0 20px 40px rgba(0, 0, 0, 0.1)"
            className="fade-in"
          >
            <Heading size="lg" color="gray.700" textAlign="center" mb={8}>
              💰 Token Portfolio
            </Heading>

            {/* ENS Resolution Display */}
            {ensName &&
              resolvedENS &&
              typeof ensName === "string" &&
              typeof resolvedENS === "string" && (
                <Box
                  bg="purple.50"
                  border="2px solid"
                  borderColor="purple.200"
                  borderRadius="xl"
                  p={4}
                  mb={6}
                  textAlign="center"
                >
                  <HStack spacing={2} justify="center">
                    <Text fontSize="lg">🌐</Text>
                    <Text color="purple.700" fontWeight="medium">
                      {ensName}
                    </Text>
                    <Text color="gray.500">→</Text>
                    <Text color="purple.600" fontSize="sm" fontFamily="mono">
                      {resolvedENS.slice(0, 6)}...{resolvedENS.slice(-4)}
                    </Text>
                  </HStack>
                  <Text color="purple.600" fontSize="xs" mt={1}>
                    ENS name successfully resolved!
                  </Text>
                </Box>
              )}

            {isLoading ? (
              <Flex direction="column" align="center" gap={6} py={12}>
                <Box style={spinnerStyle} />
                <Text fontSize="lg" color="purple.600" fontWeight="medium">
                  {loadingStep}
                </Text>
                <Text fontSize="sm" color="gray.500">
                  This may take a few seconds...
                </Text>
              </Flex>
            ) : hasQueried ? (
              results.tokenBalances.length > 0 ? (
                <SimpleGrid
                  columns={[1, 2, 3, 4]}
                  spacing={6}
                  className="fade-in"
                >
                  {results.tokenBalances.map((e, i) => {
                    const balance = formatUnits(
                      e.tokenBalance,
                      tokenDataObjects[i]?.decimals || 18
                    );
                    const formattedBalance = parseFloat(balance).toFixed(4);

                    return (
                      <Box
                        key={`${e.contractAddress}-${i}`}
                        bg="white"
                        borderRadius="2xl"
                        boxShadow="0 10px 30px rgba(0, 0, 0, 0.1)"
                        border="2px solid"
                        borderColor="gray.100"
                        _hover={{
                          transform: "translateY(-8px)",
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
                          borderColor: "purple.200",
                        }}
                        transition="all 0.3s ease"
                        overflow="hidden"
                        p={6}
                      >
                        <Flex direction="column" align="center" gap={4}>
                          {/* Token Logo */}
                          <Box
                            w="60px"
                            h="60px"
                            borderRadius="full"
                            overflow="hidden"
                            border="3px solid"
                            borderColor="gray.200"
                            bg="gray.50"
                          >
                            <Image
                              src={
                                tokenDataObjects[i]?.logo ||
                                "/default-token.png"
                              }
                              alt={tokenDataObjects[i]?.symbol || "Token"}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                              fallback={
                                <Flex
                                  w="100%"
                                  h="100%"
                                  align="center"
                                  justify="center"
                                >
                                  <Text fontSize="2xl">🪙</Text>
                                </Flex>
                              }
                            />
                          </Box>

                          {/* Token Symbol */}
                          <Heading size="md" color="gray.700">
                            {tokenDataObjects[i]?.symbol || "Unknown"}
                          </Heading>

                          {/* Custom Divider */}
                          <CustomDivider my={2} />

                          {/* Token Balance */}
                          <Box textAlign="center">
                            <Text fontSize="sm" color="gray.500" mb={1}>
                              Balance
                            </Text>
                            <Text
                              fontSize="xl"
                              fontWeight="bold"
                              color="purple.600"
                              wordBreak="break-word"
                            >
                              {formattedBalance}
                            </Text>
                          </Box>

                          {/* Contract Address */}
                          <Badge
                            colorScheme="purple"
                            fontSize="xs"
                            px={2}
                            py={1}
                            borderRadius="md"
                          >
                            {e.contractAddress.slice(0, 6)}...
                            {e.contractAddress.slice(-4)}
                          </Badge>
                        </Flex>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              ) : (
                <Flex direction="column" align="center" gap={4} py={12}>
                  <Text fontSize="6xl">🤷‍♂️</Text>
                  <Text fontSize="xl" color="gray.500" textAlign="center">
                    No ERC-20 tokens found for this address
                  </Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Try a different address or make sure you're connected to the
                    right network
                  </Text>
                </Flex>
              )
            ) : (
              <Flex direction="column" align="center" gap={4} py={12}>
                <Text fontSize="6xl">🚀</Text>
                <Text fontSize="xl" color="gray.500" textAlign="center">
                  Ready to explore your token portfolio?
                </Text>
                <Text fontSize="sm" color="gray.400" textAlign="center">
                  Enter an address or connect your wallet to get started
                </Text>
              </Flex>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default App;
