import { decryptData, getSymmetricKey } from "./utils";
import { create } from "ipfs-http-client";

// Create a new instance of the IPFS client pointing to your local IPFS Kubo node
const ipfs = create({ url: "http://localhost:5001/api/v0" });

export async function uploadJson(jsonData) {
  const blob = new Blob([JSON.stringify(jsonData)], {
    type: "application/json",
  });

  try {
    // Upload the JSON data to IPFS using the ipfs-http-client
    const added = await ipfs.add(blob);
    // console.log("JSON data uploaded to IPFS. CID:", added.path);

    return added.path; // return the Content Identifier (CID) of the uploaded data
  } catch (error) {
    console.error("Error uploading JSON data to IPFS:", error);
    return null;
  }
}

export async function getJson(cid, encryptedSymmetricKey, userAddress) {
  if (!cid) {
    console.error("CID is null");
    return null;
  }

  try {
    // Fetch the encrypted JSON from IPFS
    const ipfsGatewayUrl = `http://localhost:8080/ipfs/${cid}`;
    const response = await fetch(ipfsGatewayUrl);

    if (!response.ok) {
      throw new Error(
        `Failed to fetch JSON from IPFS. Status: ${response.status}`
      );
    }

    const encryptedJson = await response.json();

    const { data, iv } = encryptedJson;

    // Retrieve the symmetric key (Ensure `getSymmetricKey` is implemented)
    const symmetricKey = await getSymmetricKey(
      userAddress,
      encryptedSymmetricKey
    );
    if (!symmetricKey) {
      throw new Error("Failed to retrieve the symmetric key.");
    }

    // Decrypt the data
    const decryptedString = await decryptData(data, iv, symmetricKey);

    // Parse the decrypted JSON
    const textData = new TextDecoder("utf-8").decode(decryptedString);
    const originalJson = JSON.parse(textData);

    return originalJson;
  } catch (error) {
    console.error("Error decrypting JSON data from IPFS:", error);
    return null;
  }
}
