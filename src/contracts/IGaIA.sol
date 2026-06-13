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
   * @param idAsset monitored asset id
   * @param risk risk level associated to the asset
   * @param consumed true if consumed byb the dashboard
   */
  struct RiskData {
    uint256 id;
    uint256 idAsset;
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
  event RiskAdded(uint256 indexed id);

  /**
   * @notice Emite when a risk is updated
   * @param id unique identifier of the struct
   */
  event RiskUpdated(uint256 indexed id);

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
  error RiskAlreadyExists(uint256 id);

  /**
   * @notice Emit when a risk struct isn't valid
   * @param id unique identifier of the struct
   */
  error RiskNotValid(uint256 id);

  /**
   * @notice Emit when a risk can't be found
   * @param id unique identifier of the struct
   */
  error RiskNotFound(uint256 id);

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
   * @notice Aggiunge un nuovo asset al registro
   * @param asset Dati dell'asset da aggiungere
   */
  function addAsset(AssetData calldata asset) external;

  /**
   * @notice Aggiorna un asset esistente
   * @param asset Dati dell'asset da aggiornare
   */
  function updateAsset(AssetData calldata asset) external;

  /**
   * @notice Aggiunge o aggiorna un asset in base alla sua esistenza
   * @param asset Dati dell'asset da sottoporre a upsert
   */
  function upsertAsset(AssetData calldata asset) external;

  /**
   * @notice Aggiunge piu' asset in batch
   * @param assets Array di dati asset da aggiungere
   */
  function addAssets(AssetData[] calldata assets) external;

  /**
   * @notice Aggiorna piu' asset in batch
   * @param assets Array di dati asset da aggiornare
   */
  function updateAssets(AssetData[] calldata assets) external;

  /**
   * @notice Aggiunge o aggiorna piu' asset in base alla loro esistenza
   * @param assets Array di dati asset da sottoporre a upsert
   */
  function upsertAssets(AssetData[] calldata assets) external;

  /**
   * @notice Aggiorna i dati di tracciabilita' per un singolo asset esistente
   * @param traceability Dati di tracciabilita' da aggiornare
   */
  function setAssetTraceability(AssetTraceability calldata traceability) external;

  /**
   * @notice Aggiorna i dati di tracciabilita' per piu' asset esistenti
   * @param traceabilities Array di dati di tracciabilita' da aggiornare
   */
  function setAssetTraceabilities(AssetTraceability[] calldata traceabilities) external;

  /**
   * @notice Recupera i dati di un asset tramite il suo identificativo univoco
   * @param sBene Identificativo univoco dell'asset
   * @return asset Dati dell'asset associato all'identificativo fornito
   */
  function getAssetById(string calldata sBene) external view returns (AssetData memory asset);

  /**
   * @notice Recupera i dati di tracciabilita' di un asset tramite il suo identificativo univoco
   * @param sBene Identificativo univoco dell'asset
   * @return traceability Dati di tracciabilita' associati all'identificativo fornito
   */
  function getAssetTraceabilityById(string calldata sBene) external view returns (AssetTraceability memory traceability);

  /**
   * @notice Verifica se un asset esiste
   * @param sBene Identificativo univoco dell'asset
   * @return exists true se l'asset esiste
   */
  function assetExists(string calldata sBene) external view returns (bool exists);

  /**
   * @notice Recupera gli asset per nome regione
   * @param nomeRegione Nome della regione
   * @return assets Array di dati asset presenti nella regione specificata
   */
  function getAssetByRegion(string calldata nomeRegione) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera gli asset per nome regione con paginazione
   * @param nomeRegione Nome della regione
   * @param offset Indice iniziale
   * @param limit Numero massimo di asset da restituire
   * @return assets Array di dati asset presenti nella regione specificata
   */
  function getAssetByRegionRange(
    string calldata nomeRegione,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera il numero di asset in una regione
   * @param nomeRegione Nome della regione
   * @return count Numero di asset nella regione
   */
  function getAssetByRegionCount(string calldata nomeRegione) external view returns (uint256 count);

  /**
   * @notice Recupera gli asset per nome provincia
   * @param nomeProvincia Nome della provincia
   * @return assets Array di dati asset presenti nella provincia specificata
   */
  function getAssetByProvince(string calldata nomeProvincia) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera gli asset per nome provincia con paginazione
   * @param nomeProvincia Nome della provincia
   * @param offset Indice iniziale
   * @param limit Numero massimo di asset da restituire
   * @return assets Array di dati asset presenti nella provincia specificata
   */
  function getAssetByProvinceRange(
    string calldata nomeProvincia,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera il numero di asset in una provincia
   * @param nomeProvincia Nome della provincia
   * @return count Numero di asset nella provincia
   */
  function getAssetByProvinceCount(string calldata nomeProvincia) external view returns (uint256 count);

  /**
   * @notice Recupera gli asset per nome comune
   * @param nomeComune Nome del comune
   * @return assets Array di dati asset presenti nel comune specificato
   */
  function getAssetByMunicipality(string calldata nomeComune) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera gli asset per nome comune con paginazione
   * @param nomeComune Nome del comune
   * @param offset Indice iniziale
   * @param limit Numero massimo di asset da restituire
   * @return assets Array di dati asset presenti nel comune specificato
   */
  function getAssetByMunicipalityRange(
    string calldata nomeComune,
    uint256 offset,
    uint256 limit
  ) external view returns (AssetData[] memory assets);

  /**
   * @notice Recupera il numero di asset in un comune
   * @param nomeComune Nome del comune
   * @return count Numero di asset nel comune
   */
  function getAssetByMunicipalityCount(string calldata nomeComune) external view returns (uint256 count);

  /**
   * @notice Restituisce l'indirizzo del proprietario corrente
   * @return currentOwner Indirizzo del proprietario del contratto
   */
  function owner() external view returns (address currentOwner);

  /**
   * @notice Trasferisce la proprieta' a un nuovo proprietario
   * @param newOwner Indirizzo del nuovo proprietario
   */
  function transferOwnership(address newOwner) external;
}
