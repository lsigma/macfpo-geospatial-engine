/**
 * ============================================================================
 * Módulo del Modelo MACFPO para Google Earth Engine
 * Universidad Simón Bolívar (USB) - Laboratorio LSIGMA
 * ============================================================================
 * 
 * Este módulo realiza la reclasificación espacial de capas de uso y
 * cobertura vegetal (MapBiomas Venezuela Col. 2.0 / 3.0) a Stock de Carbono
 * e Incertidumbre (Desviación Estándar).
 */

// Parametrización unificada del modelo MACFPO (MapBiomas Venezuela Col. 2.0 / 3.0)
var config = {
  fromCodes:   [3,     6,     11,    12,   13,   15,   23,    33],
  carbonMeans: [331.9, 359.3, 132.3, 34.5, 47.3, 52.5, 143.7, 0.0],
  carbonSDs:   [143.4, 121.2, 19.82, 23.7, 27.8, 38.0, 96.1,  0.0]
};

/**
 * Reclasifica una imagen de MapBiomas a una imagen Multibanda con Stock e Incertidumbre.
 * Mantiene la máscara original para no contaminar estadísticas zonales.
 * Retorna un objeto ee.Image estricto blindado contra la degradación de tipos (Type Erasure).
 * 
 * @param {ee.Image} mapbiomasImage - Capa de clasificación de MapBiomas
 * @returns {ee.Image} Capa multibanda: ['carbon_stock', 'carbon_sd'] en Mg C/ha
 */
exports.classifyCarbonAll = function(mapbiomasImage) {
  // Reclasificación a Stock
  var stock = mapbiomasImage.remap({
    from: config.fromCodes,
    to: config.carbonMeans
  }).rename('carbon_stock');

  // Reclasificación a Incertidumbre (Desviación Estándar)
  var sd = mapbiomasImage.remap({
    from: config.fromCodes,
    to: config.carbonSDs
  }).rename('carbon_sd');

  // Empaquetado multibanda y conversión explícita de tipos de datos a float (Float32)
  var combined = ee.Image.cat([stock, sd])
    .cast({'carbon_stock': 'float', 'carbon_sd': 'float'});

  // Casteo explícito a ee.Image para prevenir pérdida de métodos al copiar propiedades
  return ee.Image(combined.copyProperties(mapbiomasImage, ['system:time_start', 'year']));
};

/**
 * Retorna únicamente la banda de Stock de Carbono (Mg C/ha)
 * 
 * @param {ee.Image} mapbiomasImage - Capa de clasificación de MapBiomas
 * @returns {ee.Image} Capa monobanda 'carbon_stock'
 */
exports.classifyCarbon = function(mapbiomasImage) {
  return exports.classifyCarbonAll(mapbiomasImage).select('carbon_stock');
};

/**
 * Retorna únicamente la banda de Incertidumbre (Mg C/ha)
 * 
 * @param {ee.Image} mapbiomasImage - Capa de clasificación de MapBiomas
 * @returns {ee.Image} Capa monobanda 'carbon_sd'
 */
exports.classifyUncertainty = function(mapbiomasImage) {
  return exports.classifyCarbonAll(mapbiomasImage).select('carbon_sd');
};
