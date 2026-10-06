/**
 * ============================================================================
 * Módulo del Modelo MACFPO para Google Earth Engine
 * Universidad Simón Bolívar (USB) - Laboratorio LSIGMA
 * ============================================================================
 */

var config = {
  fromCodes:   [3,     6,     11,    12,   13,   15,   23,    33],
  carbonMeans: [331.9, 359.3, 132.3, 34.5, 47.3, 52.5, 143.7, 0.0],
  carbonSDs:   [143.4, 121.2, 19.82, 23.7, 27.8, 38.0, 96.1,  0.0]
};

var MACFPO = {};

MACFPO.classifyCarbonAll = function(mapbiomasImage) {
  // 1. Extraer máscara válida del dataset original (descarta NoData y ceros no clasificados)
  var validMask = mapbiomasImage.mask().and(mapbiomasImage.neq(0));

  // 2. Reclasificación a Floats de 32-bits
  var stock = mapbiomasImage.remap(config.fromCodes, config.carbonMeans, 0)
    .rename('carbon_stock')
    .float();

  var sd = mapbiomasImage.remap(config.fromCodes, config.carbonSDs, 0)
    .rename('carbon_sd')
    .float();

  // 3. Combinar y re-aplicar máscara espacial estricta
  var combined = ee.Image.cat([stock, sd]).updateMask(validMask);

  // 4. Extracción dinámica del año desde el nombre de la banda (ej. "classification_2020" -> 2020)
  var bandName = mapbiomasImage.bandNames().get(0);
  var yearDerived = ee.Number.parse(ee.String(bandName).split('_').get(1));

  // 5. Asignar metadatos
  var resultWithMeta = combined
    .copyProperties(mapbiomasImage, ['system:time_start'])
    .set({
      'model': 'MACFPO_v1',
      'year': yearDerived,
      'units': 'Mg C/ha',
      'institution': 'USB_LSIGMA'
    });

  // CORRECCIÓN CLAVE:
  // Se fuerza el casteo explícito a ee.Image para evitar la degradación de tipos a ee.Element.
  return ee.Image(resultWithMeta);
};

// Exportar como Módulo si se requiere
if (typeof exports !== 'undefined') {
  exports.MACFPO = MACFPO;
  exports.config = config;
}

// ============================================================================
// BLOQUE DE EJECUCIÓN Y PRUEBA (ENTORNO DE DESARROLLO)
// ============================================================================

// 1. Cargar el asset como ee.Image
var mapbiomasAsset = ee.Image('projects/mapbiomas-public/assets/venezuela/lulc/collection3/mapbiomas_venezuela_collection3_coverage_v1');

// 2. Extraer banda de trabajo
var mapbiomas2020 = mapbiomasAsset.select('classification_2020');

// 3. Invocación del modelo
var carbonResult = MACFPO.classifyCarbonAll(mapbiomas2020);

// 4. Inspección estructural en consola
print('Metadatos y estructura del resultado MACFPO:', carbonResult);

// 5. Parámetros de visualización espacial
var visStock = {
  min: 0,
  max: 360,
  palette: ['#f7fcb9', '#addd8e', '#31a354', '#006837']
};

var visSD = {
  min: 0,
  max: 150,
  palette: ['#fef0d9', '#fdcc8a', '#fc8d59', '#d7301f']
};

// 6. Renderizado en el mapa
Map.centerObject(mapbiomasAsset, 6);
Map.addLayer(mapbiomas2020, {}, 'MapBiomas Cobertura Original (2020)', false);
Map.addLayer(carbonResult.select('carbon_stock'), visStock, 'Stock de Carbono (Mg C/ha)');
Map.addLayer(carbonResult.select('carbon_sd'), visSD, 'Incertidumbre - SD (Mg C/ha)');
