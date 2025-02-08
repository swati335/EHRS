import { useState } from "react";
import { Button, Spinner, Input } from "@nextui-org/react";
import Container from "../components/Container";
import { useSmartContracts } from "../SmartContractProvider";
import { uploadData } from "../utils";
import "../App.css"

const UploadPage = () => {
  const [loading, setLoading] = useState(false);
  const [record,setRecord]=useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [country, setCountry] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [dateOfAdmission, setDateOfAdmission] = useState("");

  const smartContractsContext = useSmartContracts();

  const handleUpload = async () => {
    console.log("Uploading user data:", {
      age, sex, name, city, province, country, symptoms, dateOfAdmission
    });

    const userData = {
      age,
      sex,
      name,
      city,
      province,
      country,
      symptoms,
      dateOfAdmission
    };

    setLoading(true);
    await uploadData(userData, smartContractsContext);
    setLoading(false);
  };

  return (
    <Container >
      {loading ? (
        <Spinner size="lg" />
      ) : (
        <div className="p-4 w-1/2">
          <h2 className="text-2xl mb-2">Upload User Data</h2>

          <Input
            type="number"
            placeholder="Enter Age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="mb-2 w-full  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            aria-label="Age"
            
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
            placeholder="Enter Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-2  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            
          />

          <Input
            type="text"
            placeholder="Enter City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mb-2  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            
          />

          <Input
            type="text"
            placeholder="Enter Province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="mb-2  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            
          />

          <Input
            type="text"
            placeholder="Enter Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mb-2  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 "
            
          />

          <textarea
            placeholder="Enter Symptoms"
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            className="mb-2 w-full p-2 rounded-md  bg-default-100 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            rows="3"
            
          />

          <Input
            type="date"
            placeholder="Enter Date of Admission"
            value={dateOfAdmission}
            onChange={(e) => setDateOfAdmission(e.target.value)}
            className="mb-2  text-white bg-gray-800 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            
          />

          <Button
            onPress={handleUpload}
            className="mt-3"
            color="primary"
          >
            Upload Data
          </Button>
        </div>
      )}
    </Container>
  );
};

export default UploadPage;
