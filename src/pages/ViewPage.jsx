
import { useState, useEffect } from "react";
import { Button, Spinner } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";
import { decryptAndDownloadFile, retrieveUserData } from "../utils";

const ViewPage = () => {
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState([]);
  const [selectedUserData, setSelectedUserData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  const smartContractsContext = useSmartContracts();

  useEffect(() => {
    const fetchData = async () => {
      const dataContract = smartContractsContext.contracts.DataContract;
      if (!dataContract) return;

      const user = await dataContract.viewUserFiles(smartContractsContext.signer.address);
      console.log(user);
      setUserData(user);
      setLoading(false);
    };
    fetchData();
  }, [smartContractsContext]);

  const handleDownload = async (file) => {
    await decryptAndDownloadFile(file, smartContractsContext);
    console.log("Downloading", file);
  };

  const handleFetchDetails = async (details) => {
    const storedDataCID = details[3]; // Assuming details[3] is the CID for the data
    const userDetails = await retrieveUserData(storedDataCID,details[4], smartContractsContext);

    setSelectedUserData(userDetails);
    setIsModalOpen(true); // Open the modal when user details are fetched
  };

  const closeModal = () => {
    setIsModalOpen(false); // Close the modal
    setSelectedUserData(null); // Reset the selected user data when closing the modal
  };

  return (
    <Container>
      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="p-8">
          <h2 className="text-2xl mb-4">Your Health Records</h2>
          <ul>
            {userData && userData.length > 0 ? (
              userData.map((detail, index) => (
                <div key={index} className="flex justify-between items-center mb-3">
                  <p className="mb-1 w-full p-2 text-white bg-stone-600 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200">
                    Record {index + 1}
                  </p>
                  <Button
                    onPress={() => handleFetchDetails(detail)} // Passing function reference
                    className="ml-3"
                    color="primary"
                    size="sm"
                  >
                    View Data
                  </Button>
                </div>
              ))
            ) : (
              <p>No user details available</p>
            )}
          </ul>
        </div>
      )}

      {/* Modal for displaying user details */}
     
      {isModalOpen && selectedUserData && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-gray-700 bg-opacity-75">
          <div className="relative bg-white p-6 rounded-lg w-1/2 max-w-lg shadow-lg flex">
           <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 text-2xl font-bold transition"
            >
              &times;
            </button>
            {/*User Details */}
            <div className="w-2/3 p-4">
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">User Details</h3>
              <div className="space-y-2 text-gray-700">
                <div className="border-b pb-2"><strong>Name:</strong> {selectedUserData.name}</div>
                <div className="border-b pb-2"><strong>Age:</strong> {selectedUserData.age}</div>
                <div className="border-b pb-2"><strong>Sex:</strong> {selectedUserData.sex}</div>
                <div className="border-b pb-2"><strong>City:</strong> {selectedUserData.city}</div>
                <div className="border-b pb-2"><strong>Province:</strong> {selectedUserData.province}</div>
                <div className="border-b pb-2"><strong>Country:</strong> {selectedUserData.country}</div>
                <div className="border-b pb-2"><strong>Symptoms:</strong> {selectedUserData.symptoms}</div>
                <div className="border-b pb-2"><strong>Date of Admission:</strong> {selectedUserData.dateOfAdmission}</div>
              </div>
            </div>

            
            </div>
          </div>
        
      )}
    </Container>
  );
};

export default ViewPage;
