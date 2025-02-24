import { useState, useEffect } from "react";
import { Button, Spinner, Input } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";
import { uploadData } from "../utils";
import { showNotification } from "./Notification";

const UploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(""); // Track user role
  const [userId, setUserId] = useState(""); // User ID (for doctor uploading on behalf of a user)
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [dateOfAdmission, setDateOfAdmission] = useState("");

  const smartContractsContext = useSmartContracts();
  const { signer, contracts } = smartContractsContext;
  const registryContract = contracts.RegistryContract;

  const fetchUserRole = async () => {
    setLoading(true);
    try {
      if (!registryContract) {
        console.error("RegistryContract is not available.");
        showNotification("Error: RegistryContract not found.", "error");
        setLoading(false);
        return;
      }


      const [isRegistered, role, publicKey] = await registryContract.checkUser(
      signer.address);  
      // console.log(userData);
      const roleId = role.toString(); 
      
      let roleName = "";
      if(roleId=="1")
      {
        roleName="careProvider"
      }
      setRole(roleName);
    } catch (error) {
      console.error("Error fetching user role:", error);
      showNotification("Error fetching user role.", "error");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (contracts.RegistryContract) {
      fetchUserRole();
    }
  }, [contracts]);

  const handleUpload = async () => {
    setLoading(true);

    const userData = {
      name,
      age,
      sex,
      city,
      province,
      country,
      symptoms,
      dateOfAdmission,
    };

    try {
      if (role === "careProvider") {
        // Doctor uploads data directly on behalf of the user
        if (!userId) {
          showNotification("Please enter a User ID.", "error");
          setLoading(false);
          return;
        }
        await uploadData(userData, smartContractsContext, userId);
        showNotification("Data uploaded successfully for the user.", "success");
      } else {
        // Normal user uploads data for themselves
        await uploadData(userData, smartContractsContext);
        showNotification("Data uploaded successfully.", "success");
      }
    } catch (error) {
      console.error("Error uploading data:", error);
      showNotification("Upload failed.", "error");
    }

    setLoading(false);
  };

  return (
    <Container>
      {loading && role !== "" ? (
        <Spinner size="lg" />
      ) : (
        <div className="p-4 w-1/3 flex flex-col items-center">
          <h2 className="text-2xl mb-2">Upload User Data</h2>

          {role === "careProvider" && (
            <Input
              type="text"
              placeholder="Enter User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            />
          )}

          <Input
            type="text"
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <Input
            type="number"
            placeholder="Enter Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="mb-2 w-full p-2 rounded-md bg-default-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          >
            <option value="">Select Sex</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>

          <Input
            type="text"
            placeholder="Enter City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <Input
            type="text"
            placeholder="Enter Province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <Input
            type="text"
            placeholder="Enter Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <textarea
            placeholder="Enter Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="mb-2 w-full p-2 rounded-md bg-default-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            rows="3"
          />

          <Input
            type="date"
            placeholder="Enter Date of Admission"
            value={dateOfAdmission}
            onChange={(e) => setDateOfAdmission(e.target.value)}
            className="mb-2 text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />

          <Button onPress={handleUpload} className="mt-3" color="primary">
            {role === "CareProvider" ? "Upload for User" : "Upload Data"}
          </Button>
        </div>
      )}
    </Container>
  );
};

export default UploadPage;

