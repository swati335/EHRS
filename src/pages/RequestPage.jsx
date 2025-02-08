import { useState, useRef } from "react";
import { Button, Input, Spinner } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";

const RequestPage = () => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [userData, setUserData] = useState([]);
  
  const smartContractContext = useSmartContracts();

  const { contracts } = smartContractContext;
  const dataContract = contracts.DataContract;
  const permissionsContract = contracts.PermissionContract;

  const ownerOfData = useRef();

  const fetchUserData = async (id) => {
    setLoading(true);
    try {
      const data = await dataContract.viewUserFiles(id);
      if (data) {
        setUserData(data); // Store data in an array for mapping
        ownerOfData.current = id;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
    setLoading(false);
  };

  const requestPermission = async (dataHash) => {
    console.log("data", dataHash);
    setLoading(true);
    try {
      const tx = await permissionsContract.requestPermission(
        ownerOfData.current,
        dataHash
      );
      await tx.wait();
      alert("Request sent to the owner of the data.");
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
    setLoading(false);
  };

  // NEW FUNCTION TO CHECK PERMISSION STATUS
  

  const handleSubmit = () => {
    fetchUserData(accountId);
  };

  return (
    <Container>
      <div className="p-8 w-1/3">
        <h2 className="text-2xl mb-4">Request User Data</h2>
        <Input
          placeholder="Enter Account ID"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className="mb-1 w-full p-2 "
        />
        <Button onPress={handleSubmit} className="mt-4 " color="primary" size="sm">
          Request Data
        </Button>

        {loading ? (
          <Spinner size="lg" className="mt-4" />
        ) : (
          <ul>
            {userData.map((data, index) => (
              <li key={index} className="mt-2 flex flex-col gap-3 border-1 rounded p-5">
                <p className="font-bold text-lg">Record {index + 1}</p>

                {/* Request Access Button */}
                <Button flat auto onPress={() => requestPermission(data.dataHash)}>
                  Request Access
                </Button>

               
              </li>
            ))}
          </ul>
        )}
      </div>
    </Container>
  );
};

export default RequestPage;



