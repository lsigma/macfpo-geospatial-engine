// ===============================================================
// 1. DESCRIPCIÓN DEL PROYECTO
// En este repositorio electrónico se encuentran disponibles para su inspección:
// (i) El mapa del MACFPO - Stock de Carbono en Mg C/ha (Carbono Total).
// (ii) El mapa MACFPO Desviación Estándar en Mg C/ha (Incertidumbre).
// (iii) El modelo de referencia global del UNEP-WCMC - Stock de Carbono en Mg C/ha (Soto-Navarro et al., 2020) utilizado para la validación cruzada.
//
// Utilizando la herramienta INSPECTOR haga clic en el mapa para inspeccionar los valores de cada píxel.
// ===============================================================

// ===============================================================
// 2. CARGA DE DATOS Y CONFIGURACIÓN
// ===============================================================
var ImageMacfpo = ee.Image('projects/lsigma2025/assets/MACFPO');
var ImageMacfpoSD = ee.Image('projects/lsigma2025/assets/MACFPO_SD');
var ImageBiomass = ee.Image('projects/ee-lauraugas/assets/Biomass_carb');

// Año por defecto para la visualización inicial en el visor (1985-2023)
var yearVisua = 2023;

// Paleta cromática compartida (8 niveles perceptualmente graduados)
var sharedPalette = ['0D118B', '21438B', '1F84A4', '3CBF97', '45B96F', '67F034', 'BFF266', 'FFFF95'];

// Rangos e intervalos para las leyendas de interfaz
var stockLabels = ['0', '1 - 34.5', '34.6 - 47.3', '47.4 - 52.5', '52.6 - 132.3', '132.4 - 143.7', '143.8 - 331.9', '332 - 359.3'];
var biomassLabels = ['0', '1 - 34.5', '34.6 - 47.3', '47.4 - 52.5', '52.6 - 132.3', '132.4 - 143.7', '143.8 - 331.9', '332 - 359.3'];
var sdLabels = ['0', '37.5', '75', '112.5', '150+'];

// ===============================================================
// 3. CREACIÓN Y ORDENAMIENTO DE CAPAS EN EL MAPA
// ===============================================================
var layerStock = ui.Map.Layer(ImageMacfpo.select('TC_' + yearVisua), {min: 0, max: 359.3, palette: sharedPalette}, 'MACFPO - Stock de Carbono', true);
var layerSD = ui.Map.Layer(ImageMacfpoSD.select('DS_' + yearVisua), {min: 0, max: 150, palette: ['white', 'blue']}, 'MACFPO Desviación Estándar', false);
var layerBiomass = ui.Map.Layer(ImageBiomass, {min: 0, max: 332.8, palette: sharedPalette}, 'UNEP-WCMC - Stock de Carbono', false);

// Orden jerárquico de renderizado (El último elemento del array queda en la cima visual)
Map.layers().reset([layerBiomass, layerSD, layerStock]);

// ===============================================================
// 4. COMPONENTES DE LA INTERFAZ DE USUARIO (UI)
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
// 5. CONTROLADOR DINÁMICO DE CAPAS
// ===============================================================
function updateMap(selection) {
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
// 6. PIPELINE DE EXPORTACIÓN (RÁSTERS Y SERIE TEMPORAL CSV SANITIZADA)
// ===============================================================

// 6.1 Parámetros de Extracción
var roi = ImageMacfpo.geometry(); 
var exportScale = 30; // Resolución espacial nativa (30m - MapBiomas)

// 6.2 Exportación de GeoTIFFs individuales para el año seleccionado
Export.image.toDrive({
  image: ImageMacfpo.select('TC_' + yearVisua),
  description: 'Export_MACFPO_Stock_' + yearVisua,
  folder: 'MACFPO - Stock de Carbono',
  region: roi,
  scale: exportScale,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: ImageMacfpoSD.select('DS_' + yearVisua),
  description: 'Export_MACFPO_SD_' + yearVisua,
  folder: 'MACFPO - Stock de Carbono',
  region: roi,
  scale: exportScale,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

// 6.3 Mapeo Espacio-Temporal en Servidor Distribuido (1985-2023)
var startYear = 1985;
var endYear = 2023;
var yearList = ee.List.sequence(startYear, endYear);

var timeSeriesFeatures = yearList.map(function(year) {
  var yNum = ee.Number(year).toInt(); // Cast explícito a entero
  var yStr = yNum.format('%d');
  
  var bandStockName = ee.String('TC_').cat(yStr);
  var bandSDName = ee.String('DS_').cat(yStr);
  
  var stockImgYear = ImageMacfpo.select([bandStockName]).rename('Stock');
  var sdImgYear = ImageMacfpoSD.select([bandSDName]).rename('SD');
  
  // Cálculo de masa absoluta acumulada: (Mg C / ha) * (área del píxel en ha)
  var areaHa = ee.Image.pixelArea().divide(10000); 
  var carbonAbsolutoYear = stockImgYear.multiply(areaHa).rename('Carbono_Total');
  
  // Consolidación multibanda para REDUCCIÓN ÚNICA (Optimizó la ejecución en la nube)
  var multibandImage = stockImgYear.addBands(sdImgYear).addBands(carbonAbsolutoYear);
  
  // Reducción Espacial Combinada: Promedio para Densidad/SD y Suma para Masa Total
  var stats = multibandImage.reduceRegion({
    reducer: ee.Reducer.mean().forEach(['Stock', 'SD'])
              .combine({
                reducer2: ee.Reducer.sum().forEach(['Carbono_Total']),
                sharedInputs: false
              }),
    geometry: roi,
    scale: exportScale,
    maxPixels: 1e13,
    bestEffort: true,
    tileScale: 4 // Subdivide el procesamiento en teselas para evitar desbordamiento de RAM
  });
  
  // Construcción del Feature aislado de geometría
  return ee.Feature(null, {
    'Anio': yNum,
    'Densidad_Media_Stock_MgC_ha': stats.get('Stock'),
    'Densidad_Media_Incertidumbre_MgC_ha': stats.get('SD'),
    'Carbono_Total_Almacenado_Mg': stats.get('Carbono_Total')
  });
});

var timeSeriesTable = ee.FeatureCollection(timeSeriesFeatures);

// 6.4 Exportación de Tabla Sanitizada a Google Drive
Export.table.toDrive({
  collection: timeSeriesTable,
  description: 'MACFPO_Serie_Temporal_Estadisticas_1985_2023',
  folder: 'MACFPO - Stock de Carbono',
  fileFormat: 'CSV',
  // SELECTORS: Filtra .geo y system:index y fija el orden de columnas
  selectors: [
    'Anio',
    'Densidad_Media_Stock_MgC_ha',
    'Densidad_Media_Incertidumbre_MgC_ha',
    'Carbono_Total_Almacenado_Mg'
  ]
});
