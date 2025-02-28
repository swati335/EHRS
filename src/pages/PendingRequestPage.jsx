import { useState, useEffect } from "react";
import { Spinner, Button } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";

import { getKeyPair, encryptSymmetricKey, decryptSymmetricKey,uploadData } from "../utils";
import { showNotification } from "./Notification";

const PendingRequestsPage = () => {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  const smartContractContext = useSmartContracts();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const signer = smartContractContext.signer;
      const dataContract = smartContractContext.contracts.DataContract;
      const permissionsContract =
        smartContractContext.contracts.PermissionContract;
      const registryContract = smartContractContext.contracts.RegistryContract;

      if (!permissionsContract) return;
    try {
    console.log("Fetching pending requests...");
    const permissionRequests = await permissionsContract.getPendingRequests();
    
    const myData = await registryContract.checkUser(signer.address);
    const publicKey = myData[2];

    let requestWithData = [];

    // Process normal permission requests
    for (let request of permissionRequests) {
      const data = await dataContract.searchData(request.dataHash, publicKey);
      requestWithData.push({ type: "Permission", request, data });
    }


    setRequests(requestWithData);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    showNotification("Error fetching pending requests.", "error");
  }

  setLoading(false);

    };
    fetchData();
  }, [smartContractContext]);



  const handleApprove = async (request, index) => {
    setLoading(true);
    const signer = smartContractContext.signer;
    const permissionsContract =
      smartContractContext.contracts.PermissionContract;
    const registryContract = smartContractContext.contracts.RegistryContract;

    // decrypt the symmetric key  
    const keyPair = getKeyPair(signer.address);
    console.log("Keypair private",keyPair.privateKey)
    const symmetricKey = await decryptSymmetricKey(
      request.data.encryptedSymmetricKey,
      keyPair.privateKey
    );

    const requesterData = await registryContract.checkUser(
      request.request.requester
    );
    const requesterPublicKey = JSON.parse(requesterData[2]);
    const encryptedSymmetricKey = await encryptSymmetricKey(
      symmetricKey,
      requesterPublicKey
    );
    const tx = await permissionsContract.grantPermission(
      index,
      encryptedSymmetricKey
    );
    await tx.wait();
    showNotification("Permission granted successfully","success");
  };

  const handleRemoveRequest = async (index) => {
    setLoading(true);
    const permissionsContract = smartContractContext.contracts.PermissionContract;

    const tx = await permissionsContract.rejectPermission(index);
    await tx.wait();

    showNotification("Request removed successfully", "success");
    setRequests((prevRequests) => prevRequests.filter((_, i) => i !== index));
    setLoading(false);
  };

  return (
  <Container>
  <ul>
    {requests.map((request, index) => (
      <li key={index} className="mt-2 border-1 p-3 rounded">
        <p>By: {request.request.requester}</p>
        <Button onPress={() => handleApprove(request, index)} className="mt-3">Approve</Button>
        <Button onPress={() => handleRemoveRequest(index)} className="ml-2">Remove</Button>
      </li>
    ))}
  </ul>
</Container>
  );
};

export default PendingRequestsPage;
