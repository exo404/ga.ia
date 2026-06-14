// SPDX-License-Identifier: PPL
pragma solidity ^0.8.24;

import {IGaIA} from './IGaIA.sol';

/**
 * @title GaIA
 * @author exo404
 * @notice Registry for truss risk events.
 */
contract GaIA is IGaIA {
  /**
   * @notice Current contract owner.
   */
  address public owner;

  /**
   * @notice Tracks whether a risk event exists.
   */
  mapping(uint256 id => bool exists) public dataExists;

  /**
   * @notice Risk data indexed by event id.
   */
  mapping(uint256 id => RiskData data) private dataById;

  /**
   * @notice Unconsumed risk event ids grouped by truss id.
   */
  mapping(uint256 idTruss => uint256[] ids) private dataIdsByTruss;

  /**
   * @notice Position of an event id inside `dataIdsByTruss`, stored as index + 1.
   */
  mapping(uint256 idTruss => mapping(uint256 id => uint256 indexPlusOne)) private dataIndexByTruss;

  /**
   * @notice Restricts execution to the owner.
   */
  modifier onlyOwner() {
    if (msg.sender != owner) {
      revert UnauthorizedAccess(msg.sender);
    }
    _;
  }

  constructor() {
    owner = msg.sender;
    emit OwnershipTransferred(address(0), msg.sender);
  }

  /// @inheritdoc IGaIA
  function addData(RiskData calldata data) external onlyOwner {
    _validateDataOrRevert(data);

    if (dataExists[data.id]) {
      revert DataAlreadyExists(data.id);
    }

    _storeData(data);
    emit DataAdded(data.id);
  }

  /// @inheritdoc IGaIA
  function updateData(RiskData calldata data) external onlyOwner {
    _validateDataOrRevert(data);

    if (!dataExists[data.id]) {
      revert DataNotFound(data.id);
    }

    _updateStoredData(data);
    emit DataUpdated(data.id);
  }

  /// @inheritdoc IGaIA
  function upsertData(RiskData calldata data) external onlyOwner {
    _validateDataOrRevert(data);

    if (dataExists[data.id]) {
      _updateStoredData(data);
      emit DataUpdated(data.id);
      return;
    }

    _storeData(data);
    emit DataAdded(data.id);
  }

  /// @inheritdoc IGaIA
  function addMultipleData(RiskData[] calldata data) external onlyOwner {
    for (uint256 i = 0; i < data.length; i++) {
      RiskData calldata item = data[i];
      _validateDataOrRevert(item);

      if (dataExists[item.id]) {
        revert DataAlreadyExists(item.id);
      }

      _storeData(item);
      emit DataAdded(item.id);
    }
  }

  /// @inheritdoc IGaIA
  function updateMultipleData(RiskData[] calldata data) external onlyOwner {
    for (uint256 i = 0; i < data.length; i++) {
      RiskData calldata item = data[i];
      _validateDataOrRevert(item);

      if (!dataExists[item.id]) {
        revert DataNotFound(item.id);
      }

      _updateStoredData(item);
      emit DataUpdated(item.id);
    }
  }

  /// @inheritdoc IGaIA
  function upsertMultipleData(RiskData[] calldata data) external onlyOwner {
    for (uint256 i = 0; i < data.length; i++) {
      RiskData calldata item = data[i];
      _validateDataOrRevert(item);

      if (dataExists[item.id]) {
        _updateStoredData(item);
        emit DataUpdated(item.id);
        continue;
      }

      _storeData(item);
      emit DataAdded(item.id);
    }
  }

  /// @inheritdoc IGaIA
  function getDataById(uint256 id) external view returns (RiskData memory data) {
    return dataById[id];
  }

  /// @inheritdoc IGaIA
  function getAssetByTruss(uint256 idTruss) external view returns (RiskData[] memory data) {
    return _getDataByIds(dataIdsByTruss[idTruss]);
  }

  /// @inheritdoc IGaIA
  function getAssetByTrussRange(
    uint256 idTruss,
    uint256 offset,
    uint256 limit
  ) external view returns (RiskData[] memory data) {
    return _getDataByIdsRange(dataIdsByTruss[idTruss], offset, limit);
  }

  /// @inheritdoc IGaIA
  function getDataByTrussCount(uint256 idTruss) external view returns (uint256 count) {
    return dataIdsByTruss[idTruss].length;
  }

  /// @inheritdoc IGaIA
  function transferOwnership(address newOwner) external onlyOwner {
    if (newOwner == address(0)) {
      revert InvalidOwner(newOwner);
    }

    address previousOwner = owner;
    owner = newOwner;
    emit OwnershipTransferred(previousOwner, newOwner);
  }

  /**
   * @notice Validates the minimum fields required for a risk event.
   */
  function _validateData(RiskData calldata data) internal pure returns (bool) {
    return data.id != 0 && data.idTruss != 0;
  }

  /**
   * @notice Reverts when a risk event is invalid.
   */
  function _validateDataOrRevert(RiskData calldata data) internal pure {
    if (!_validateData(data)) {
      revert DataNotValid(data.id);
    }
  }

  /**
   * @notice Stores a new risk event and indexes it if still unconsumed.
   */
  function _storeData(RiskData calldata data) internal {
    dataExists[data.id] = true;
    dataById[data.id] = data;

    if (!data.consumed) {
      _addToTrussIndex(data.idTruss, data.id);
    }
  }

  /**
   * @notice Updates an existing risk event and keeps truss indexes consistent.
   */
  function _updateStoredData(RiskData calldata data) internal {
    RiskData storage current = dataById[data.id];

    if (!current.consumed) {
      _removeFromTrussIndex(current.idTruss, data.id);
    }

    if (!data.consumed) {
      _addToTrussIndex(data.idTruss, data.id);
    }

    dataById[data.id] = data;
  }

  /**
   * @notice Adds an unconsumed event id to a truss index.
   */
  function _addToTrussIndex(uint256 idTruss, uint256 id) internal {
    if (dataIndexByTruss[idTruss][id] != 0) {
      return;
    }

    dataIdsByTruss[idTruss].push(id);
    dataIndexByTruss[idTruss][id] = dataIdsByTruss[idTruss].length;
  }

  /**
   * @notice Removes an event id from a truss index.
   */
  function _removeFromTrussIndex(uint256 idTruss, uint256 id) internal {
    uint256 indexPlusOne = dataIndexByTruss[idTruss][id];
    if (indexPlusOne == 0) {
      return;
    }

    uint256 index = indexPlusOne - 1;
    uint256 lastIndex = dataIdsByTruss[idTruss].length - 1;

    if (index != lastIndex) {
      uint256 lastId = dataIdsByTruss[idTruss][lastIndex];
      dataIdsByTruss[idTruss][index] = lastId;
      dataIndexByTruss[idTruss][lastId] = index + 1;
    }

    dataIdsByTruss[idTruss].pop();
    delete dataIndexByTruss[idTruss][id];
  }

  /**
   * @notice Resolves a full truss page of unconsumed events.
   */
  function _getDataByIds(uint256[] storage ids) internal view returns (RiskData[] memory data) {
    data = new RiskData[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      data[i] = dataById[ids[i]];
    }
  }

  /**
   * @notice Resolves a paginated slice of unconsumed events.
   */
  function _getDataByIdsRange(
    uint256[] storage ids,
    uint256 offset,
    uint256 limit
  ) internal view returns (RiskData[] memory data) {
    if (offset >= ids.length || limit == 0) {
      return new RiskData[](0);
    }

    uint256 end = offset + limit;
    if (end > ids.length) {
      end = ids.length;
    }

    uint256 size = end - offset;
    data = new RiskData[](size);
    for (uint256 i = 0; i < size; i++) {
      data[i] = dataById[ids[offset + i]];
    }
  }
}
