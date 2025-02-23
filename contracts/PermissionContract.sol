//SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DataContract.sol";
import "./RegistryContract.sol";

contract PermissionContract {
    struct PermissionRequest {
        address requester;
        address approver;
        string dataHash;
        bool exists;
    }

    struct DoctorUploadRequest {
        address doctor;
        address user;
        string userData;
        bool exists;
    }

    mapping(address => PermissionRequest[]) public pendingRequests;
    mapping(address => DoctorUploadRequest[]) public doctorUploadRequests;

    DataContract public dataContract;
    RegistryContract public registryContract;

    event PermissionRequested(
        address indexed requester,
        address indexed approver,
        string dataHash
    );
    event PermissionGranted(
        address indexed requester,
        address indexed approver,
        string dataHash,
        string encryptedSymmetricKey
    );
    event PermissionRejected(
        address indexed requester,
        address indexed approver,
        string dataHash
    );

    event DoctorUploadRequested(
        address indexed doctor,
        address indexed user,
        string userData
    );
    event DoctorUploadApproved(address indexed user, address indexed doctor);
    event DoctorUploadRejected(address indexed user, address indexed doctor);

    constructor(address dataContractAddress, address registryContractAddress) {
        dataContract = DataContract(dataContractAddress);
        registryContract = RegistryContract(registryContractAddress);
    }

    modifier requestExists(address approver, uint index) {
        require(
            pendingRequests[approver][index].exists,
            "Permission request does not exist."
        );
        _;
    }

    function requestPermission(
        address approver,
        string memory dataHash
    ) external {
        PermissionRequest memory newRequest = PermissionRequest({
            requester: msg.sender,
            approver: approver,
            dataHash: dataHash,
            exists: true
        });

        pendingRequests[approver].push(newRequest);
        emit PermissionRequested(msg.sender, approver, dataHash);
    }

    function getPendingRequests()
        external
        view
        returns (PermissionRequest[] memory)
    {
        return (pendingRequests[msg.sender]);
    }

    function grantPermission(
        uint index,
        string memory encryptedSymmetricKeyWithRequester
    ) external requestExists(msg.sender, index) {
        PermissionRequest memory request = pendingRequests[msg.sender][index];

        (bool isRegistered, , string memory publicKey) = registryContract
            .checkUser(msg.sender);

        require(isRegistered, "Approver not registered.");
        require(
            dataContract.metadataExists(request.dataHash, publicKey),
            "File metadata does not exist for approver."
        );

        DataContract.Metadata memory metadata = dataContract.searchData(
            request.dataHash,
            publicKey
        );

        dataContract.addPermissionGrantedMetadata(
            request.requester,
            request.dataHash,
            metadata.dataType,
            metadata.storedDataCID,
            encryptedSymmetricKeyWithRequester
        );
        _removeRequest(msg.sender, index);
        emit PermissionGranted(
            request.requester,
            msg.sender,
            request.dataHash,
            encryptedSymmetricKeyWithRequester
        );
    }

    function rejectPermission(
        uint index
    ) external requestExists(msg.sender, index) {
        PermissionRequest memory request = pendingRequests[msg.sender][index];
        emit PermissionRejected(
            request.requester,
            msg.sender,
            request.dataHash
        );
        _removeRequest(msg.sender, index);
    }

    function _removeRequest(address approver, uint index) internal {
        uint lastIndex = pendingRequests[approver].length - 1;

        pendingRequests[approver][index] = pendingRequests[approver][lastIndex];
        pendingRequests[approver].pop();
    }

    function checkPermissionGranted(
        address requester,
        string memory dataHash
    ) external view returns (bool) {
        (bool isRegistered, , string memory publicKey) = registryContract
            .checkUser(requester);
        require(isRegistered, "Requester not registered.");

        return dataContract.metadataExists(dataHash, publicKey);
    }

    function requestDoctorUpload(address user, string memory userData) public {
        doctorUploadRequests[user].push(
            DoctorUploadRequest({
                doctor: msg.sender,
                user: user,
                userData: userData,
                exists: true
            })
        );
        emit DoctorUploadRequested(msg.sender, user, userData);
    }

    function getDoctorUploadRequests()
        external
        view
        returns (DoctorUploadRequest[] memory)
    {
        return doctorUploadRequests[msg.sender];
    }

    function approveDoctorUpload(uint index) public {
        require(
            index < doctorUploadRequests[msg.sender].length,
            "Invalid request index."
        );

        DoctorUploadRequest memory request = doctorUploadRequests[msg.sender][
            index
        ];

        _removeDoctorRequest(msg.sender, index);
        emit DoctorUploadApproved(msg.sender, request.doctor);
    }

    function rejectDoctorUpload(uint index) public {
        require(
            index < doctorUploadRequests[msg.sender].length,
            "Invalid request index."
        );

        DoctorUploadRequest memory request = doctorUploadRequests[msg.sender][
            index
        ];

        _removeDoctorRequest(msg.sender, index);
        emit DoctorUploadRejected(msg.sender, request.doctor);
    }

    function _removeDoctorRequest(address user, uint index) internal {
        uint lastIndex = doctorUploadRequests[user].length - 1;

        if (index != lastIndex) {
            doctorUploadRequests[user][index] = doctorUploadRequests[user][
                lastIndex
            ];
        }

        doctorUploadRequests[user].pop();
    }
}
