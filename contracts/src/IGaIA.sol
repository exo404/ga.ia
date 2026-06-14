// SPDX-License-Identifier: PPL
pragma solidity ^0.8.24;

/**
 * @title IGaIA
 * @author exo404
 * @notice GaIA contract interface
 */
interface IGaIA {
  /*///////////////////////////////////////////////////////////////
                            STRUTTURE
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Risk data structure
   * @param id data id
   * @param idTruss monitored truss id
   * @param risk risk level associated to the asset
   * @param consumed true if consumed byb the dashboard
   */
  struct RiskData {
    uint256 id;
    uint256 idTruss;
    uint256 risk;
    bool consumed;
  }

  /*///////////////////////////////////////////////////////////////
                            EVENTS
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Emit when a new risk event is registered
   * @param id unique identifier of the struct
   */
  event DataAdded(uint256 indexed id);

  /**
   * @notice Emite when a risk struct is updated
   * @param id unique identifier of the struct
   */
  event DataUpdated(uint256 indexed id);

  /**
   * @notice Emit when ownership changes
   * @param previousOwner previous owner
   * @param newOwner mew owner
   */
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /*///////////////////////////////////////////////////////////////
                            ERRORS
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Emit when risk data already exists
   * @param id unique identifier of the struct
   */
  error DataAlreadyExists(uint256 id);

  /**
   * @notice Emit when a risk struct isn't valid
   * @param id unique identifier of the struct
   */
  error DataNotValid(uint256 id);

  /**
   * @notice Emit when a risk struct can't be found
   * @param id unique identifier of the struct
   */
  error DataNotFound(uint256 id);

  /**
   * @notice Emit when a caller is unauthorized 
   * @param caller caller address
   */
  error UnauthorizedAccess(address caller);

  /**
   * @notice Emit when new owner address is invalid
   * @param newOwner New owner address
   */
  error InvalidOwner(address newOwner);

  /*///////////////////////////////////////////////////////////////
                            FUNCTIONS
  //////////////////////////////////////////////////////////////*/

  /**
   * @notice Add a new data struct to the registry
   * @param data of the risk event to be created
   */
  function addData(RiskData calldata data) external;

  /**
   * @notice Update a risk data struct
   * @param data of the risk event to be updated
   */
  function updateData(RiskData calldata data) external;

  /**
   * @notice Add or update a risk data struct
   * @param data of the risk event to be updated or created
   */
  function upsertData(RiskData calldata data) external;

  /**
   * @notice Add multiple risk data events in batch
   * @param data array of the risk events to be created
   */
  function addMultipleData(RiskData[] calldata data) external;

  /**
   * @notice Update multiple risk data events in batch
   * @param data array of the risk events to be updated
   */
  function updateMultipleData(RiskData[] calldata data) external;

  /**
   * @notice Update or create multiple risk data events in batch
   * @param data array of the risk events to be updated or created
   */
  function upsertMultipleData(RiskData[] calldata data) external;

  /**
   * @notice Recovers risk event data by id
   * @param id unique identifier of the struct
   * @return data of the risk event identified by the id
   */
  function getDataById(uint256 id) external view returns (RiskData memory data);

  /**
   * @notice Verify if a risk event exists
   * @param id unique identifier of the struct
   * @return exists true if the risk event data exists
   */
  function dataExists(uint256 id) external view returns (bool exists);

  /**
   * @notice Recovers data by truss id
   * @param idTruss id of monitored truss
   * @return data risk event data array by truss not consumed by the dashboard
   */
  function getAssetByTruss(uint256 idTruss) external view returns (RiskData[] memory data);

  /**
   * @notice Recovers a page of the risk events data not consumed by truss
   * @param idTruss id of monitored truss
   * @param offset start index
   * @param limit max number of data to be returned
   * @return data array of risk events by truss id
   */
  function getAssetByTrussRange(
    uint256 idTruss,
    uint256 offset,
    uint256 limit
  ) external view returns (RiskData[] memory data);

  /**
   * @notice Recovers the number of risk events not consumed by truss
   * @param idTruss id of the monitored truss
   * @return count of the risk events not consumed by truss
   */
  function getDataByTrussCount(uint256 idTruss) external view returns (uint256 count);

  /**
   * @notice Returns the current owner address
   * @return currentOwner address
   */
  function owner() external view returns (address currentOwner);

  /**
   * @notice Transfers ownership to the new owner
   * @param newOwner address
   */
  function transferOwnership(address newOwner) external;
}
