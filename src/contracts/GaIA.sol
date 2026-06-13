// SPDX-License-Identifier: PPL
pragma solidity ^0.8.24;

import {IConfiscatedAssets} from 'interfaces/IConfiscatedAssets.sol';

/**
 * @title Contratto ConfiscatedAssets
 * @author exo404
 * @notice Implementazione dell'interfaccia IConfiscatedAssets
 */
contract ConfiscatedAssets is IConfiscatedAssets {
  /**
   * @notice Proprietario del contratto
   */
  address public owner;

  /**
   * @notice Mapping per verificare se un asset esiste gia'
   */
  mapping(string sBene => bool exists) public assetExists;

  /**
   * @notice Mapping da sBene a AssetData
   */
  mapping(string sBene => AssetData data) public assetsById;

  /**
   * @notice Mapping da sBene a AssetTraceability
   */
  mapping(string sBene => AssetTraceability data) private traceabilityById;

  /**
   * @notice Mapping degli asset per regione
   */
  mapping(string nomeRegione => string[] ids) private assetIdsByRegion;

  /**
   * @notice Mapping degli sBene degli asset agli indici nell'array precedente per regione
   */
  mapping(string nomeRegione => mapping(string sBene => uint256 indexPlusOne)) private assetIndexByRegion;

  /**
   * @notice Mapping degli asset per provincia
   */
  mapping(string nomeProvincia => string[] ids) private assetIdsByProvince;

  /**
   * @notice Mapping degli sBene degli asset agli indici nell'array precedente per provincia
   */
  mapping(string nomeProvincia => mapping(string sBene => uint256 indexPlusOne)) private assetIndexByProvince;

  /**
   * @notice Mapping degli asset per comune
   */
  mapping(string nomeComune => string[] ids) private assetIdsByMunicipality;

  /**
   * @notice Mapping degli sBene degli asset agli indici nell'array precedente per comune
   */
  mapping(string nomeComune => mapping(string sBene => uint256 indexPlusOne)) private assetIndexByMunicipality;

  /**
   * @notice Esegue revert se la funzione non viene chiamata dal proprietario del contratto
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

  /// @inheritdoc IConfiscatedAssets
  function addAsset(AssetData calldata asset) external onlyOwner {
    if (!_validateAsset(asset)) {
      revert AssetNotValid(asset.sBene);
    }

    if (assetExists[asset.sBene]) {
      revert AssetAlreadyExists(asset.sBene);
    }

    _storeAsset(asset);

    emit AssetAdded(asset.sBene);
  }

  /// @inheritdoc IConfiscatedAssets
  function addAssets(AssetData[] calldata assets) external onlyOwner {
    for (uint256 i = 0; i < assets.length; i++) {
      AssetData calldata asset = assets[i];
      if (!_validateAsset(asset)) {
        revert AssetNotValid(asset.sBene);
      }

      if (assetExists[asset.sBene]) {
        revert AssetAlreadyExists(asset.sBene);
      }

      _storeAsset(asset);
      emit AssetAdded(asset.sBene);
    }
  }

  /// @inheritdoc IConfiscatedAssets
  function updateAsset(AssetData calldata asset) external onlyOwner {
    if (!_validateAsset(asset)) {
      revert AssetNotValid(asset.sBene);
    }

    if (!assetExists[asset.sBene]) {
      revert AssetNotFound(asset.sBene);
    }

    _updateAsset(asset);
    emit AssetUpdated(asset.sBene);
  }

  /// @inheritdoc IConfiscatedAssets
  function updateAssets(AssetData[] calldata assets) external onlyOwner {
    for (uint256 i = 0; i < assets.length; i++) {
      AssetData calldata asset = assets[i];
      if (!_validateAsset(asset)) {
        revert AssetNotValid(asset.sBene);
      }

      if (!assetExists[asset.sBene]) {
        revert AssetNotFound(asset.sBene);
      }

      _updateAsset(asset);

      emit AssetUpdated(asset.sBene);
    }
  }

  /// @inheritdoc IConfiscatedAssets
  function upsertAsset(AssetData calldata asset) external onlyOwner {
    if (!_validateAsset(asset)) {
      revert AssetNotValid(asset.sBene);
    }

    if (assetExists[asset.sBene]) {
      _updateAsset(asset);
      emit AssetUpdated(asset.sBene);
      return;
    }

    _storeAsset(asset);
    emit AssetAdded(asset.sBene);
  }

  /// @inheritdoc IConfiscatedAssets
  function upsertAssets(AssetData[] calldata assets) external onlyOwner {
    for (uint256 i = 0; i < assets.length; i++) {
      AssetData calldata asset = assets[i];
      if (!_validateAsset(asset)) {
        revert AssetNotValid(asset.sBene);
      }

      if (assetExists[asset.sBene]) {
        _updateAsset(asset);
        emit AssetUpdated(asset.sBene);
        continue;
      }

      _storeAsset(asset);
      emit AssetAdded(asset.sBene);
    }
  }

  /// @inheritdoc IConfiscatedAssets
  function setAssetTraceability(AssetTraceability calldata traceability) external onlyOwner {
    _upsertAssetTraceability(traceability);
    emit AssetTraceabilityUpdated(traceability.sBene);
  }

  /// @inheritdoc IConfiscatedAssets
  function setAssetTraceabilities(AssetTraceability[] calldata traceabilities) external onlyOwner {
    for (uint256 i = 0; i < traceabilities.length; i++) {
      _upsertAssetTraceability(traceabilities[i]);
      emit AssetTraceabilityUpdated(traceabilities[i].sBene);
    }
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetById(string calldata sBene) external view returns (AssetData memory asset) {
    return assetsById[sBene];
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetTraceabilityById(string calldata sBene) external view returns (AssetTraceability memory traceability) {
    traceability = traceabilityById[sBene];
    if (bytes(traceability.sBene).length == 0 && assetExists[sBene]) {
      traceability.sBene = sBene;
    }
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByRegion(string calldata nomeRegione) external view returns (AssetData[] memory assets) {
    return _getAssetsByIds(assetIdsByRegion[nomeRegione]);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByRegionRange(
    string calldata nomeRegione,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets) {
    return _getAssetsByIdsRange(assetIdsByRegion[nomeRegione], offset, limit);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByRegionCount(string calldata nomeRegione) external view returns (uint256 count) {
    return assetIdsByRegion[nomeRegione].length;
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByProvince(string calldata nomeProvincia) external view returns (AssetData[] memory assets) {
    return _getAssetsByIds(assetIdsByProvince[nomeProvincia]);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByProvinceRange(
    string calldata nomeProvincia,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets) {
    return _getAssetsByIdsRange(assetIdsByProvince[nomeProvincia], offset, limit);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByProvinceCount(string calldata nomeProvincia) external view returns (uint256 count) {
    return assetIdsByProvince[nomeProvincia].length;
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByMunicipality(string calldata nomeComune) external view returns (AssetData[] memory assets) {
    return _getAssetsByIds(assetIdsByMunicipality[nomeComune]);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByMunicipalityRange(
    string calldata nomeComune,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets) {
    return _getAssetsByIdsRange(assetIdsByMunicipality[nomeComune], offset, limit);
  }

  /// @inheritdoc IConfiscatedAssets
  function getAssetByMunicipalityCount(string calldata nomeComune) external view returns (uint256 count) {
    return assetIdsByMunicipality[nomeComune].length;
  }

  /// @inheritdoc IConfiscatedAssets
  function transferOwnership(address newOwner) external onlyOwner {
    if (newOwner == address(0)) {
      revert InvalidOwner(newOwner);
    }
    address previousOwner = owner;
    owner = newOwner;
    emit OwnershipTransferred(previousOwner, newOwner);
  }

  /**
   * @notice Valida i dati dell'asset
   * @param asset Dati dell'asset da validare
   * @return bool true se i dati dell'asset sono validi, altrimenti false
   */
  function _validateAsset(AssetData calldata asset) internal pure returns (bool) {
    if (bytes(asset.sBene).length == 0) {
      return false;
    }
    if (bytes(asset.nomeRegione).length == 0) {
      return false;
    }
    if (bytes(asset.nomeProvincia).length == 0) {
      return false;
    }
    if (bytes(asset.nomeComune).length == 0) {
      return false;
    }
    return true;
  }

  /**
   * @notice Memorizza un nuovo asset
   * @param asset Dati dell'asset da memorizzare
   */
  function _storeAsset(AssetData calldata asset) internal {
    assetExists[asset.sBene] = true;
    assetsById[asset.sBene] = asset;
    traceabilityById[asset.sBene].sBene = asset.sBene;
    _addToRegionIndex(asset.nomeRegione, asset.sBene);
    _addToProvinceIndex(asset.nomeProvincia, asset.sBene);
    _addToMunicipalityIndex(asset.nomeComune, asset.sBene);
  }

  /**
   * @notice Aggiorna i dati di tracciabilita' per un asset esistente
   * @param traceability Dati di tracciabilita' dell'asset
   */
  function _upsertAssetTraceability(AssetTraceability calldata traceability) internal {
    if (!_validateAssetTraceability(traceability)) {
      revert AssetNotValid(traceability.sBene);
    }

    if (!assetExists[traceability.sBene]) {
      revert AssetNotFound(traceability.sBene);
    }

    traceabilityById[traceability.sBene] = traceability;
  }

  /**
   * @notice Valida i dati minimi della tracciabilita'
   * @param traceability Dati di tracciabilita' da validare
   * @return bool true se i dati sono validi, altrimenti false
   */
  function _validateAssetTraceability(AssetTraceability calldata traceability) internal pure returns (bool) {
    return bytes(traceability.sBene).length != 0;
  }

  /**
   * @notice Aggiorna un asset esistente
   * @param asset Dati dell'asset da aggiornare
   */
  function _updateAsset(AssetData calldata asset) internal {
    AssetData storage current = assetsById[asset.sBene];

    if (!_sameString(current.nomeRegione, asset.nomeRegione)) {
      _removeFromRegionIndex(current.nomeRegione, asset.sBene);
      _addToRegionIndex(asset.nomeRegione, asset.sBene);
    }

    if (!_sameString(current.nomeProvincia, asset.nomeProvincia)) {
      _removeFromProvinceIndex(current.nomeProvincia, asset.sBene);
      _addToProvinceIndex(asset.nomeProvincia, asset.sBene);
    }

    if (!_sameString(current.nomeComune, asset.nomeComune)) {
      _removeFromMunicipalityIndex(current.nomeComune, asset.sBene);
      _addToMunicipalityIndex(asset.nomeComune, asset.sBene);
    }

    assetsById[asset.sBene] = asset;
  }

  /**
   * @notice Aggiunge un asset all'indice per regione
   * @param nomeRegione Nome della regione
   * @param sBene Identificativo dell'asset
   */
  function _addToRegionIndex(string memory nomeRegione, string memory sBene) internal {
    assetIdsByRegion[nomeRegione].push(sBene);
    assetIndexByRegion[nomeRegione][sBene] = assetIdsByRegion[nomeRegione].length;
  }

  /**
   * @notice Rimuove un asset dall'indice per regione
   * @param nomeRegione Nome della regione
   * @param sBene Identificativo dell'asset
   */
  function _removeFromRegionIndex(string memory nomeRegione, string memory sBene) internal {
    _removeFromIndex(assetIdsByRegion[nomeRegione], assetIndexByRegion[nomeRegione], sBene);
  }

  /**
   * @notice Aggiunge un asset all'indice per provincia
   * @param nomeProvincia Nome della provincia
   * @param sBene Identificativo dell'asset
   */
  function _addToProvinceIndex(string memory nomeProvincia, string memory sBene) internal {
    assetIdsByProvince[nomeProvincia].push(sBene);
    assetIndexByProvince[nomeProvincia][sBene] = assetIdsByProvince[nomeProvincia].length;
  }

  /**
   * @notice Rimuove un asset dall'indice per provincia
   * @param nomeProvincia Nome della provincia
   * @param sBene Identificativo dell'asset
   */
  function _removeFromProvinceIndex(string memory nomeProvincia, string memory sBene) internal {
    _removeFromIndex(assetIdsByProvince[nomeProvincia], assetIndexByProvince[nomeProvincia], sBene);
  }

  /**
   * @notice Aggiunge un asset all'indice per comune
   * @param nomeComune Nome del comune
   * @param sBene Identificativo dell'asset
   */
  function _addToMunicipalityIndex(string memory nomeComune, string memory sBene) internal {
    assetIdsByMunicipality[nomeComune].push(sBene);
    assetIndexByMunicipality[nomeComune][sBene] = assetIdsByMunicipality[nomeComune].length;
  }

  /**
   * @notice Rimuove un asset dall'indice per comune
   * @param nomeComune Nome del comune
   * @param sBene Identificativo dell'asset
   */
  function _removeFromMunicipalityIndex(string memory nomeComune, string memory sBene) internal {
    _removeFromIndex(assetIdsByMunicipality[nomeComune], assetIndexByMunicipality[nomeComune], sBene);
  }

  /**
   * @notice Rimuove un asset da un indice
   * @param ids Array degli identificativi asset
   * @param indexById Mapping degli identificativi asset ai rispettivi indici
   * @param sBene Identificativo dell'asset da rimuovere
   */
  function _removeFromIndex(string[] storage ids, mapping(string => uint256) storage indexById, string memory sBene) internal {
    uint256 indexPlusOne = indexById[sBene];
    if (indexPlusOne == 0) {
      return;
    }

    uint256 index = indexPlusOne - 1;
    uint256 lastIndex = ids.length - 1;

    if (index != lastIndex) {
      string memory lastId = ids[lastIndex];
      ids[index] = lastId;
      indexById[lastId] = index + 1;
    }

    ids.pop();
    delete indexById[sBene];
  }

  /**
   * @notice Recupera gli asset tramite i loro identificativi
   * @param ids Array degli identificativi asset
   * @return assets Array di AssetData
   */
  function _getAssetsByIds(string[] storage ids) internal view returns (AssetData[] memory assets) {
    assets = new AssetData[](ids.length);
    for (uint256 i = 0; i < ids.length; i++) {
      assets[i] = assetsById[ids[i]];
    }
  }

  /**
   * @notice Recupera gli asset tramite identificativo entro un intervallo specificato
   * @param ids Array degli identificativi asset
   * @param offset Indice iniziale
   * @param limit Numero massimo di asset da recuperare
   * @return assets Array di AssetData
   */
  function _getAssetsByIdsRange(string[] storage ids, uint256 offset, uint256 limit) internal view returns (AssetData[] memory assets) {
    if (offset >= ids.length) {
      return new AssetData[](0);
    }

    uint256 end = offset + limit;
    if (end > ids.length) {
      end = ids.length;
    }

    uint256 size = end - offset;
    assets = new AssetData[](size);
    for (uint256 i = 0; i < size; i++) {
      assets[i] = assetsById[ids[offset + i]];
    }
  }

  /**
   * @notice Confronta due stringhe per verificarne l'uguaglianza
   * @param first Prima stringa
   * @param second Seconda stringa
   * @return bool true se le stringhe sono uguali, altrimenti false
   */
  function _sameString(string memory first, string memory second) internal pure returns (bool) {
    return keccak256(bytes(first)) == keccak256(bytes(second));
  }
}
