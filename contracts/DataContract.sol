//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./RegistryContract.sol";

contract DataContract {
    RegistryContract public registry;

    struct Metadata {
        string publicKey;
        string dataHash;
        string dataType;
        string storedDataCID;
        string encryptedSymmetricKey;
        bool exists;
    }

    mapping(address => Metadata[]) private userMetadata;
    mapping(bytes32 => Metadata) private compositeKeyToMetadata;

    constructor(address registryContractAddress) {
        registry = RegistryContract(registryContractAddress);
    }

    modifier onlyUserOrCareProvider(address userAddress) {
        (
            bool isRegistered,
            RegistryContract.Role role,
            string memory publicKey
        ) = registry.checkUser(userAddress);
        require(isRegistered, "User not registered.");
        require(
            msg.sender == userAddress ||
                role == RegistryContract.Role.CareProvider,
            "No permission to add data."
        );
        _;
    }

    function generateCompositeKey(
        string memory dataHash,
        string memory publicKey
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(dataHash, publicKey));
    }

    function addData(
        address userAddress,
        address signerAddress,
        string memory publicKey,
        string memory dataHash,
        string memory dataType,
        string memory storedDataCID,
        string memory encryptedSymmetricKey
    ) external onlyUserOrCareProvider(signerAddress) {
        Metadata memory metadata = Metadata({
            publicKey: publicKey,
            dataHash: dataHash,
            dataType: dataType,
            storedDataCID: storedDataCID,
            encryptedSymmetricKey: encryptedSymmetricKey,
            exists: true
        });

        bytes32 compositeKey = generateCompositeKey(dataHash, publicKey);
        compositeKeyToMetadata[compositeKey] = metadata;

        userMetadata[userAddress].push(metadata);
    }

    function searchData(
        string memory dataHash,
        string memory publicKey
    ) external view returns (Metadata memory) {
        bytes32 compositeKey = generateCompositeKey(dataHash, publicKey);
        return compositeKeyToMetadata[compositeKey];
    }

    function viewUserFiles(
        address userAddress
    ) external view returns (Metadata[] memory) {
        return userMetadata[userAddress];
    }

    function metadataExists(
        string memory dataHash,
        string memory publicKey
    ) public view returns (bool) {
        bytes32 compositeKey = generateCompositeKey(dataHash, publicKey);
        return compositeKeyToMetadata[compositeKey].exists;
    }

    function addPermissionGrantedMetadata(
        address requester,
        string memory dataHash,
        string memory dataType,
        string memory storedDataCID,
        string memory encryptedSymmetricKeyWithRequester // uint256 age,
    ) external {
        (bool isRegistered, , string memory publicKey) = registry.checkUser(
            requester
        );

        require(isRegistered, "Owner not registered.");

        bytes32 compositeKey = generateCompositeKey(dataHash, publicKey);

        Metadata memory newMetadata = Metadata({
            publicKey: publicKey,
            dataHash: dataHash,
            dataType: dataType,
            storedDataCID: storedDataCID,
            encryptedSymmetricKey: encryptedSymmetricKeyWithRequester,
            exists: true
        });

        compositeKeyToMetadata[compositeKey] = newMetadata;
        userMetadata[requester].push(newMetadata);
    }
}
