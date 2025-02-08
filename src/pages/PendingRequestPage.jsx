import { useState, useEffect } from "react";
import { Spinner, Button } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";

import { getKeyPair, encryptSymmetricKey, decryptSymmetricKey } from "../utils";

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

      const requests = await permissionsContract.getPendingRequests();
      let requestWithData = [];
      const myData = await registryContract.checkUser(signer.address);
      const publicKey = myData[2];

      
      if (requests) {
        for (let i = 0; i < requests.length; i++) {
          const request = requests[i];
          
          const data = await dataContract.searchData(
            request.dataHash,
            publicKey
          );
          requestWithData.push({ request: requests[i], data });
        }
      }
      setRequests(requestWithData);
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

    

    // call the grantPermission method
    const tx = await permissionsContract.grantPermission(
      index,
      encryptedSymmetricKey
    );
    await tx.wait();

    alert("Permission granted successfully");
  };

  return (
    <Container>
      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="p-8">
          <h2 className="text-2xl mb-4">Pending Requests</h2>
          
          <ul>
            {requests.map((request, index) => (
              <li key={index} className="mt-2 border-1 p-3 rounded">
                <p>By: {request.request.requester}</p>
                <p>File: {request.data.dateOfAdmission}</p>
                

                <Button
                  flat
                  auto
                  onPress={() => handleApprove(request, index)}
                  className="mt-3"
                >
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Container>
  );
};

export default PendingRequestsPage;
