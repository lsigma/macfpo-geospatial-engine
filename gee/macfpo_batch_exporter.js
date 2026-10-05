// ===============================================================
// 1. Descripción
// En este repositorio electrónico se encuentran disponibles para su inspección: (i) el mapa del MACFPO - Stock de Carbono en Mg C/ha (Carbono Total), 
// (ii) el mapa MACFPO Desviación Estándar en Mg C/ha (Incertidumbre), y (iii) el modelo de referencia global del UNEP-WCMC - Stock de Carbono en 
// Mg C/ha (Soto-Navarro et al., 2020) utilizado para la validación cruzada.
// 
// Utilizando la herramienta INSPECTOR haga clic en el mapa para inspeccionar los valores de cada pixel en los mapas. 
// ===============================================================


// ===============================================================
// 2. CARGA DE DATOS Y CONFIGURACIÓN
// ===============================================================
var ImageMacfpo = ee.Image('projects/lsigma2025/assets/MACFPO');
var ImageMacfpoSD = ee.Image('projects/lsigma2025/assets/MACFPO_SD');
var ImageBiomass = ee.Image('projects/ee-lauraugas/assets/Biomass_carb');

// ===============================================================
// Cambie el año para visualizar la serie temporal (1985-2023)
// ===============================================================

var yearVisua = 2010;

// Paleta compartida (8 niveles)
var sharedPalette = ['0D118B', '21438B', '1F84A4', '3CBF97', '45B96F', '67F034', 'BFF266', 'FFFF95'];

// Rangos de Leyenda
var stockLabels = ['0', '1 - 34.5', '34.6 - 47.3', '47.4 - 52.5', '52.6 - 132.3', '132.4 - 143.7', '143.8 - 331.9', '332 - 359.3'];
var biomassLabels = ['0', '1 - 34.5', '34.6 - 47.3', '47.4 - 52.5', '52.6 - 132.3', '132.4 - 143.7', '143.8 - 331.9', '332 - 359.3'];
var sdLabels = ['0', '37.5', '75', '112.5', '150+'];

// ===============================================================
// 3. CREACIÓN DE CAPAS
// ===============================================================

// Definimos las capas individualmente
var layerStock = ui.Map.Layer(ImageMacfpo.select('TC_' + yearVisua), {min: 0, max: 359.3, palette: sharedPalette}, 'MACFPO - Stock de Carbono', true);
var layerSD = ui.Map.Layer(ImageMacfpoSD.select('DS_' + yearVisua), {min: 0, max: 150, palette: ['white', 'blue']}, 'MACFPO Desviación Estándar', false);
var layerBiomass = ui.Map.Layer(ImageBiomass, {min: 0, max: 332.8, palette: sharedPalette}, 'UNEP-WCMC - Stock de Carbono', false);

// ORDEN DE CAPAS: Para que Stock salga primero en la lista, debe ir al FINAL del array.
// El orden en la lista será: 1. Stock, 2. Desviación, 3. UNEP-WCMC
Map.layers().reset([layerBiomass, layerSD, layerStock]);

// ===============================================================
// 4. COMPONENTES DE LA INTERFAZ (UI)
// ===============================================================
var mainPanel = ui.Panel({
  style: {position: 'bottom-left', padding: '8px 15px', width: '230px'}
});

var titleLabel = ui.Label({style: {fontWeight: 'bold', fontSize: '14px', margin: '0 0 8px 0'}});
var legendContent = ui.Panel();

mainPanel.add(titleLabel);
mainPanel.add(legendContent);
Map.add(mainPanel);

function makeLegend(palette, labels) {
  legendContent.clear();
  for (var i = 0; i < palette.length; i++) {
    var colorBox = ui.Label({
      style: {backgroundColor: '#' + palette[i], padding: '8px 12px', margin: '0 0 4px 0', border: '0.5px solid #888'}
    });
    var description = ui.Label({value: labels[i], style: {margin: '0 0 4px 10px', fontSize: '12px'}});
    legendContent.add(ui.Panel([colorBox, description], ui.Panel.Layout.flow('horizontal')));
  }
}

// ===============================================================
// 5. FUNCIÓN DE CAMBIO DINÁMICO
// ===============================================================
function updateMap(selection) {
  // Sincronizar visibilidad de capas
  layerStock.setShown(selection == 'MACFPO - Stock de Carbono');
  layerSD.setShown(selection == 'MACFPO Desviación Estándar');
  layerBiomass.setShown(selection == 'UNEP-WCMC - Stock de Carbono');
  
  if (selection == 'MACFPO - Stock de Carbono') {
    titleLabel.setValue('MACFPO - Stock de Carbono en Mg C/ha (' + yearVisua + ')');
    makeLegend(sharedPalette, stockLabels);
  } else if (selection == 'MACFPO Desviación Estándar') {
    titleLabel.setValue('MACFPO Desviación Estándar en Mg C/ha (' + yearVisua + ')');
    makeLegend(['FFFFFF', 'BFCFFF', '7F9FFF', '3F6FFF', '0000FF'], sdLabels);
  } else if (selection == 'UNEP-WCMC - Stock de Carbono') {
    titleLabel.setValue('UNEP-WCMC - Stock de Carbono en Mg C/ha');
    makeLegend(sharedPalette, biomassLabels);
  }
}

var select = ui.Select({
  items: ['MACFPO - Stock de Carbono', 'MACFPO Desviación Estándar', 'UNEP-WCMC - Stock de Carbono'],
  placeholder: 'Seleccione visualización...',
  value: 'MACFPO - Stock de Carbono',
  onChange: updateMap,
  style: {position: 'top-right', width: '250px'}
});

Map.add(select);
updateMap('MACFPO - Stock de Carbono');


// ===============================================================
// === SECCIÓN AÑADIDA: EXPORTACIÓN DE RÁSTERS Y ESTADÍSTICAS ===
// ===============================================================

// 6.1 DEFINICIÓN DEL ÁREA (ROI) Y EXTRACCIÓN DE BANDAS
// MENTORÍA: Nunca exportes sin definir 'region'. Si tienes el shapefile de la FPO, 
// reemplaza ImageMacfpo.geometry() por el feature de la FPO (ej. ee.FeatureCollection("users/...").geometry())
var roi = ImageMacfpo.geometry(); 
var exportScale = 30; // MapBiomas nativo

var stockImg = ImageMacfpo.select('TC_' + yearVisua);
var sdImg = ImageMacfpoSD.select('DS_' + yearVisua);

// 6.2 EXPORTAR RÁSTERS (GeoTIFF) AL GOOGLE DRIVE
Export.image.toDrive({
  image: stockImg,
  description: 'Export_MACFPO_Stock_' + yearVisua,
  folder: 'MACFPO_GEE_Exports',
  region: roi,
  scale: exportScale,
  maxPixels: 1e13,      // Vital para áreas del tamaño de la FPO
  crs: 'EPSG:4326'      // Proyección estándar WGS84
});

Export.image.toDrive({
  image: sdImg,
  description: 'Export_MACFPO_SD_' + yearVisua,
  folder: 'MACFPO_GEE_Exports',
  region: roi,
  scale: exportScale,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

// 6.3 CÁLCULO CIENTÍFICO DE ESTADÍSTICAS (CSV)
// Para el Stock Total, convertimos Mg C/ha -> Mg C absolutos usando el área real del píxel.
var areaHa = ee.Image.pixelArea().divide(10000); 
var carbonAbsoluto = stockImg.multiply(areaHa).rename('Carbono_Total_Mg');

// Calculamos la suma total (Carbono absoluto) y la media (Densidad de Stock y Desviación)
var statsReducers = ee.Reducer.mean().combine({reducer2: ee.Reducer.sum(), sharedInputs: false});

var imagenParaStats = ee.Image([stockImg, sdImg, carbonAbsoluto]);

var estadisticas = imagenParaStats.reduceRegion({
  reducer: statsReducers,
  geometry: roi,
  scale: exportScale,
  maxPixels: 1e13,
  bestEffort: true // Evita errores de memoria si el área es colosal sin tileado
});

// Crear una tabla (FeatureCollection) a partir del diccionario de resultados
var statsTable = ee.FeatureCollection([
  ee.Feature(null, {
    'Anio': yearVisua,
    'Densidad_Media_Stock_MgC_ha': estadisticas.get('TC_' + yearVisua + '_mean'),
    'Densidad_Media_Incertidumbre_MgC_ha': estadisticas.get('DS_' + yearVisua + '_mean'),
    'Carbono_Total_Almacenado_Mg': estadisticas.get('Carbono_Total_Mg_sum')
  })
]);

// 6.4 EXPORTAR TABLA DE ESTADÍSTICAS (CSV)
Export.table.toDrive({
  collection: statsTable,
  description: 'Estadisticas_MACFPO_' + yearVisua,
  folder: 'MACFPO_GEE_Exports',
  fileFormat: 'CSV'
});
