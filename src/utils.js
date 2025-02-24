import { ethers } from "ethers";
import { uploadJson, getJson } from "./ipfs";
import { showNotification } from "./pages/Notification";

// Enum for roles, matching the smart contract
const Role = {
  User: 0,
  CareProvider: 1,
  Miner: 2,
  Researcher: 3,
};

const toBase64 = (arrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

const fromBase64 = (base64String) =>
  Uint8Array.from(atob(base64String), (c) => c.charCodeAt(0));

// Function to generate an RSA key pair and store them as JWK
const generateKeyPair = async () => {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
        hash: "SHA-256",
      },
      true, // whether the key is extractable (i.e., can be used outside WebCrypto)
      ["encrypt", "decrypt"] // can be used for these operations
    );

    // Export public and private keys to JWK format
    const publicKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );
    const privateKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );

    // Return both keys in JWK format
    return { publicKeyJwk, privateKeyJwk };
  } catch (error) {
    console.error("Error generating key pair:", error);
    throw error;
  }
};

// Function to store the key pair in local storage
const storeKeyPair = (address, publicKeyJwk, privateKeyJwk) => {
  const keyPair = JSON.stringify({
    publicKey: publicKeyJwk,
    privateKey: privateKeyJwk,
  });
  localStorage.setItem(`keyPair_${address}`, keyPair);
};

// Function to retrieve key pair from local storage
export const getKeyPair = (address) => {
  const keyPair = localStorage.getItem(`keyPair_${address}`);
  return keyPair ? JSON.parse(keyPair) : null;
};

export const registerUser = async (role, smartContractContext) => {
  const { contracts, signer } = smartContractContext;
  const address = signer.address;

  try {
    // Check if the user is already registered
    const registryContract = contracts.RegistryContract;
    // console.log(registryContract);

    const [isRegistered] = await registryContract.checkUser(address);
    // console.log(isRegistered);

    if (isRegistered) {
      console.log("User already registered");
      showNotification("User already registered", "warning");
      return;
    }

    const { publicKeyJwk, privateKeyJwk } = await generateKeyPair();
    storeKeyPair(address, publicKeyJwk, privateKeyJwk);

    const tx = await registryContract.registerUser(
      Role[role],
      JSON.stringify(publicKeyJwk)
    );
    await tx.wait();
    showNotification("User registered successfully!", "success");
    console.log(`User registered successfully with role: ${role}`);
    console.log(smartContractContext);
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

// Function to convert a JWK to a CryptoKey
const importPublicKey = async (publicKeyJwk) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );
};

export const encryptSymmetricKey = async (symmetricKey, publicKeyJwk) => {
  try {
    const publicKey = await importPublicKey(publicKeyJwk);
    const rawSymmetricKey = await window.crypto.subtle.exportKey(
      "raw",
      symmetricKey
    );
    const encryptedSymmetricKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      rawSymmetricKey
    );

    return toBase64(encryptedSymmetricKey);
  } catch (error) {
    console.error("Error encrypting symmetric key:", error);
    throw error;
  }
};

const generateSymmetricKey = async () => {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
};

const encryptData = async (data, key) => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    data
  );
  return { encryptedData, iv };
};

const generateFileHash = async (data) => {
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export const uploadData = async (
  userData,
  smartContractContext,
  userId = null
) => {
  const { signer } = smartContractContext;
  const address = signer.address;
  const dataContract = smartContractContext.contracts.DataContract;
  const registryContract = smartContractContext.contracts.RegistryContract;

  try {
    const keyPair = getKeyPair(userId || address);
    console.log(keyPair);

    if (!keyPair) {
      throw new Error("Key pair not found. Please register first.");
    }

    const publicKeyJwk = keyPair.publicKey;
    const symmetricKey = await generateSymmetricKey();

    // Convert userData object to string and encrypt
    const userDataString = JSON.stringify(userData);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(userDataString);

    const { encryptedData, iv } = await encryptData(encodedData, symmetricKey);

    const encryptedSymmetricKey = await encryptSymmetricKey(
      symmetricKey,
      publicKeyJwk
    );

    // Generate hash of the structured data
    const dataHash = await generateFileHash(encodedData);

    // Upload encrypted data to IPFS
    console.log("Upload data to IPFS");

    const storedDataCID = await uploadJson({
      data: toBase64(encryptedData),

      iv: toBase64(iv),
    });

    console.log("Calling smart contract");
    // Call the smart contract to store metadata

    const tx = await dataContract.addData(
      userId || address,
      address,
      JSON.stringify(publicKeyJwk),
      dataHash,
      "UserData", // Static label for structured data
      storedDataCID,
      encryptedSymmetricKey
    );
    await tx.wait();
    // showNotification("Data uploaded successfully!", "success");
    console.log("Data uploaded");
  } catch (error) {
    console.error("Error uploading data:", error);
    throw error;
  }
};

export const retrieveUserData = async (
  storedDataCID,
  encryptedSymmetricKey,
  smartContractContext
) => {
  try {
    const { signer } = smartContractContext;
    const address = signer.address;
    const storedData = await getJson(
      storedDataCID,
      encryptedSymmetricKey,
      address
    );

    return storedData;
  } catch (error) {
    console.error("Error retrieving user data:", error);
    throw error;
  }
};

// Function to convert a JWK to a CryptoKey (for private key)
const importPrivateKey = async (privateKeyJwk) => {
  return await window.crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    {
      name: "RSA-OAEP",
      hash: { name: "SHA-256" },
    },
    true,
    ["decrypt"]
  );
};

// Function to decrypt the symmetric key with a private key
export const decryptSymmetricKey = async (
  encryptedSymmetricKeyBase64,
  privateKeyJwk
) => {
  try {
    const encryptedSymmetricKey = fromBase64(encryptedSymmetricKeyBase64);

    const privateKey = await importPrivateKey(privateKeyJwk);
    const symmetricKey = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedSymmetricKey
    );
    // return symmetricKey;
    return await window.crypto.subtle.importKey(
      "raw",
      symmetricKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error("Error decrypting symmetric key:", error);
    throw error;
  }
};

// Function to decrypt data using AES-GCM and symmetric key
export const decryptData = async (
  encryptedDataBase64,
  ivBase64,
  symmetricKey
) => {
  try {
    const iv = fromBase64(ivBase64);
    const encryptedData = fromBase64(encryptedDataBase64);

    // Decrypt the file data using AES-GCM and the symmetric key
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      symmetricKey,
      encryptedData
    );

    return decryptedData;
  } catch (error) {
    console.error("Error decrypting data:", error);
    throw error;
  }
};

// Function to download and decrypt the file
export const decryptAndDownloadFile = async (
  fileMetadata,
  smartContractContext
) => {
  try {
    const storedData = await getJson(fileMetadata.storedDataCID);
    const address = smartContractContext.signer.address;

    const keyPair = getKeyPair(address);
    const privateKeyJwk = keyPair.privateKey;

    // Decrypt the symmetric key using the private key
    const symmetricKey = await decryptSymmetricKey(
      fileMetadata.encryptedSymmetricKey,
      privateKeyJwk
    );

    // Decrypt the file data using the decrypted symmetric key and AES-GCM
    const decryptedData = await decryptData(
      storedData.data,
      storedData.iv,
      symmetricKey
    );

    // Convert the decrypted data back to Blob for download or display
    const decryptedBlob = new Blob([decryptedData], {
      type: fileMetadata.dataType,
    });

    // Create a download link for the decrypted file
    const downloadUrl = URL.createObjectURL(decryptedBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = fileMetadata.fileName;
    link.click();

    // Revoke the URL after download
    URL.revokeObjectURL(downloadUrl);

    console.log(
      `File ${fileMetadata.fileName} decrypted and downloaded successfully.`
    );
  } catch (error) {
    console.error("Error downloading or decrypting file:", error);
    throw error;
  }
};
export async function getSymmetricKey(userAddress, encryptedSymmetricKey) {
  const keyPair = getKeyPair(userAddress);
  if (!keyPair) {
    console.error("Key pair not found. Please register first.");
    return null;
  }

  return await decryptSymmetricKey(encryptedSymmetricKey, keyPair.privateKey);
}
