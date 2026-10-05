/**
 * ============================================================================
 * Módulo del Modelo MACFPO para Google Earth Engine
 * Universidad Simón Bolívar (USB) - Laboratorio LSIGMA
 * ============================================================================
 * 
 * Este módulo contiene las funciones de reclasificación de capas de uso y
 * cobertura vegetal de MapBiomas a Stock de Carbono e Incertidumbre.
 */

var config = {
  fromCodes: [3, 4, 6, 9, 11, 13, 15],
  carbonMeans: [331.9, 34.5, 359.3, 0.0, 143.7, 132.3, 47.3],
  carbonSDs: [143.4, 23.7, 121.2, 0.0, 96.1, 19.82, 27.8]
};

/**
 * Convierte una imagen de cobertura MapBiomas a Stock de Carbono (Mg C/ha)
 * 
 * @param {ee.Image} mapbiomasImage - Capa de clasificación de MapBiomas
 * @returns {ee.Image} Capa de Stock de Carbono en Mg C/ha
 */
exports.classifyCarbon = function(mapbiomasImage) {
  var carbonStock = mapbiomasImage.remap(
    config.fromCodes,
    config.carbonMeans,
    0
  ).rename('carbon_stock_mgc_ha');
  
  return carbonStock.copyProperties(mapbiomasImage, ['system:time_start', 'year']);
};

/**
 * Genera la capa de Incertidumbre (Desviación Estándar) del modelo
 * 
 * @param {ee.Image} mapbiomasImage - Capa de clasificación de MapBiomas
 * @returns {ee.Image} Capa de Incertidumbre en Mg C/ha
 */
exports.classifyUncertainty = function(mapbiomasImage) {
  var uncertainty = mapbiomasImage.remap(
    config.fromCodes,
    config.carbonSDs,
    0
  ).rename('carbon_sd_mgc_ha');
  
  return uncertainty.copyProperties(mapbiomasImage, ['system:time_start', 'year']);
};
