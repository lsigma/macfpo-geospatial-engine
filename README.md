# MACFPO: Modelo de Almacenamiento de Carbono en la Faja Petrolífera del Orinoco

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/downloads/)
[![Conda: macfpo--env](https://img.shields.io/badge/Conda-macfpo--env-green.svg)](https://docs.conda.io/)
[![GEE: API JavaScript](https://img.shields.io/badge/Google_Earth_Engine-API_JS-4285F4?logo=googleearthengine&logoColor=white)](https://earthengine.google.com/)
[![Tests: PyTest](https://img.shields.io/badge/Tests-PyTest-informational.svg)](https://docs.pytest.org/)

> **Laboratorio de Sistemas de Información Geográfica y Modelado Ambiental (LSIGMA)**  
> **Universidad Simón Bolívar (USB), Caracas, Venezuela.**

---

## 📋 Descripción del Proyecto

El **Modelo de Almacenamiento de Carbono en la Faja Petrolífera del Orinoco (MACFPO)** es una plataforma geoespacial multitemporal (1985–2023) diseñada para cuantificar y monitorear las reservas de biomasa y biocarbono en una extensión de **$64.157,87\text{ km}^2$** al norte del río Orinoco.

El sistema integra capas de uso y cobertura del suelo de **MapBiomas Venezuela (Colección 2.0)** a $30\text{ m}$ de resolución espacial con matriz de coeficientes regionalizados de biomasa aérea, subterránea y Carbono Orgánico del Suelo (COS, 0–60 cm). Permite la ejecución dual: procesamiento distribuido en la nube mediante **Google Earth Engine** y procesamiento local por bloques mediante **Python (`rasterio` / `NumPy`)**.

---

## 📐 Formulación Matemática

El almacenamiento total de carbono por unidad de superficie ($\text{Mg C/ha}$) en cada píxel se determina mediante la suma de depósitos orgánicos:

$$C_{\text{total}} = C_{\text{biomasa aérea}} + C_{\text{biomasa subterránea}} + C_{\text{suelo (COS)}}$$

### Evaluacion e Incertidumbre Espacial

Para cuantificar la variabilidad y el margen de error espacializado asociado a las estimaciones de almacenamiento de carbono total ($C_{\text{total}}$) en los ecosistemas de la FPO, el modelo aplica el calculo de la **desviacion estandar muestral ($s$)** sobre las observaciones bibliograficas compiladas para cada tipo de cobertura vegetal y uso de la tierra:

$$s = \sqrt{\frac{\sum_{i=1}^{n} (x_i - \bar{x})^2}{n - 1}}$$

Expresado de forma espacialmente explicita para cada clase de cobertura $k$ de MapBiomas Venezuela (Coleccion 2.0):

$$s_k = \sqrt{\frac{\sum_{i=1}^{n_k} (x_{i,k} - \bar{x}_k)^2}{n_k - 1}}$$

Donde:
* **$s_k$**: Desviacion estandar muestral ($\text{Mg C/ha}$) asignada a la clase de cobertura $k$. Este valor conforma la intensidad de cada pixel en el GeoTIFF de incertidumbre espacial del modelo MACFPO.
* **$x_{i,k}$**: $i$-esima estimacion bibliografica del Carbono Total ($C_{\text{biomasa aerea + subterranica}} + C_{\text{COS}}$, expresado en $\text{Mg C/ha}$) compilada para la clase de cobertura $k$.
* **$\bar{x}_k$**: Carbono Total promedio ($\text{Mg C/ha}$) calculado para la clase de cobertura $k$.
* **$n_k$**: Numero total de observaciones o sitios de muestreo compilados para la clase $k$ ($n_k \ge 3$).
* **$n_k - 1$**: Correccion de Bessel para garantizar un estimador insesgado de la varianza poblacional en muestras finitas.

La matriz espacial de incertidumbre se genera mediante la reasignacion categorica (Look-Up Table / `remap`) de $s_k$ sobre cada pixel de la serie temporal de mapas de cobertura, permitiendo identificar espacialmente las unidades con mayor dispersion o sesgo potencial de muestreo.

---

## 📊 Coeficientes del Modelo y Leyenda MapBiomas (Col. 2.0)

| Código MapBiomas | Cobertura / Uso del Suelo | Carbono Total Promedio (Mg C/ha) | Desviación Estándar ($\pm\sigma$) | Nº de Estimaciones ($n$) | Coeficiente de Variación $CV$ (%) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **3** | Bosque | 331,9 | 143,4 | 7 | 37,5% |
| **6** | Bosque inundable | 359,3 | 121,2 | 3 | 24,7% |
| **11** | Herbazal / Arbustal inundable | 132,3 | 19,82 | 4 | 3,4% |
| **12** | Sabana / Herbazal | 34,5 | 23,7 | 10 | 6,0% |
| **13** | Sabana arbolada | 47,3 | 27,8 | 4 | 35,5% |
| **15** | Uso agropecuario | 52,5 | 38,0 | 11 | 70,3% |
| **23** | Plantación forestal | 143,7 | 96,1 | 3 | 77,2% |
| **33** | Cuerpos de agua / No vegetal | 0,0 | 0,0 | N/A | 0,0% |

---

## 📂 Estructura del Repositorio

```text
macfpo-geospatial-engine/
├── .github/
│   └── workflows/
│       └── ci_validation.yml          # Pipeline de Integración Continua (CI)
├── config/
│   └── carbon_coefficients.json     # Coeficientes y metadatos del modelo
├── data/
│   ├── rasters/
│       ├── .gitignore               # Exclusión de binarios GeoTIFF locales
│       └── README.md                # Manifiesto y enlaces de descarga de rásteres
├── gee/
│   ├── modules/
│   │   └── carbon_calculator.js    # Módulo core para Google Earth Engine
│   ├── macfpo_batch_exporter.js    # Script de exportación masiva en GEE
│   └── macfpo_interactive_viewer.js # Visor interactivo en Code Editor
├── scripts_python/
│   └── raster_processor.py         # Motor de reclasificación por bloques
├── .gitignore                      # Reglas de exclusión del repositorio
├── LICENSE                         # Licencia del proyecto
├── README.md                       # Documentación principal del proyecto
├── environment.yml                 # Entorno Conda para desarrollo
└── requirements.txt                # Dependencias Pip

```

---

## ⚙️ Instalación y Configuración del Entorno

### 1. Clonar el Repositorio

```bash
git clone [https://github.com/lsigma/macfpo-geospatial-engine.git](https://github.com/lsigma/macfpo-geospatial-engine.git)
cd macfpo-geospatial-engine

```

### 2. Crear Entorno Virtual con Conda (Recomendado)

Para garantizar la compatibilidad binaria con las librerías C subyacentes (**GDAL**, **GEOS**, **PROJ**):

```bash
conda env create -f environment.yml
conda activate macfpo-env

```

### 3. Instalación Alternativa con Pip

```bash
python -m venv .venv
source .venv/bin/activate  # En Windows: .venv\Scripts\activate
pip install -r requirements.txt

```

---

## 🚀 Guía de Ejecución

### Opción A: Procesamiento Local con Python

Para procesar un GeoTIFF local de MapBiomas utilizando lectura por bloques de memoria RAM:

```bash
python scripts_python/raster_processor.py

```

### Opción B: Integración en Google Earth Engine (Nube)

Puedes importar el módulo de cálculo directamente en el **GEE Code Editor**:

```javascript
/**
 * ============================================================================
 * PIPELINE DE VISUALIZACIÓN Y CÁLCULO DE BIOCARBONO MACFPO (2022)
 * Laboratorio LSIGMA - Universidad Simón Bolívar
 * ============================================================================
 */

// 1. Matriz de Coeficientes del Modelo MACFPO
var config = {
  fromCodes:   [3,     6,     11,    12,   13,   15,   23,    33],
  carbonMeans: [331.9, 359.3, 132.3, 34.5, 47.3, 52.5, 143.7, 0.0],
  carbonSDs:   [143.4, 121.2, 19.82, 23.7, 27.8, 38.0, 96.1,  0.0]
};

/**
 * Reclasifica una imagen de cobertura a biocarbono resolviendo vacíos de información.
 * 
 * @param {ee.Image} mapbiomasImage Imagen de cobertura (ej. classification_2022)
 * @returns {ee.Image} Imagen multibanda ['carbon_stock', 'carbon_sd']
 */
function classifyCarbonAll(mapbiomasImage) {
  // Retener la máscara geográfica nativa del territorio venezolano
  var geographicMask = mapbiomasImage.mask();

  // Reclasificación a Stock (defaultValue = 0.0 asigna 0 a minería, urbano, etc.)
  var stock = mapbiomasImage.remap({
    from: config.fromCodes,
    to: config.carbonMeans,
    defaultValue: 0.0
  }).rename('carbon_stock').float();

  // Reclasificación a Incertidumbre (SD)
  var sd = mapbiomasImage.remap({
    from: config.fromCodes,
    to: config.carbonSDs,
    defaultValue: 0.0
  }).rename('carbon_sd').float();

  // Empaquetado multibanda y reaplicación de la máscara geográfica original
  var combined = ee.Image.cat([stock, sd]).updateMask(geographicMask);

  // Blindaje contra la degradación de tipos (Type Erasure)
  return ee.Image(combined.copyProperties(mapbiomasImage, ['system:time_start', 'year']));
}

// 3. Cargar el Asset oficial de MapBiomas Venezuela (Colección 3)
var mapbiomasRaisg = ee.Image("projects/mapbiomas-public/assets/venezuela/lulc/collection3/mapbiomas_venezuela_collection3_coverage_v1");

// 4. Extraer la banda de clasificación para el año de interés (2022)
var mapbiomas2022 = mapbiomasRaisg.select('classification_2022');

// 5. Generar la imagen multibanda reclasificada ['carbon_stock', 'carbon_sd']
var macfpoResult = classifyCarbonAll(mapbiomas2022);

// 6. Visualización interactiva en el mapa
Map.setCenter(-63.5, 8.5, 7); // Centrado en la Faja Petrolífera del Orinoco (FPO)

// Capa de Cobertura Original (útil para inspección visual directa)
Map.addLayer(mapbiomas2022, {}, 'MapBiomas Cobertura Original 2022', false);

// Capa de Stock de Carbono
Map.addLayer(
  macfpoResult.select('carbon_stock'), 
  {
    min: 0, 
    max: 360, 
    palette: ['#ffffcc', '#a1dab4', '#41b6c4', '#2c7fb8', '#253494']
  }, 
  'Stock Carbono 2022 (Mg C/ha)'
);

// Capa de Incertidumbre (Desviación Estándar)
Map.addLayer(
  macfpoResult.select('carbon_sd'), 
  {
    min: 0, 
    max: 150, 
    palette: ['#f7fcf5', '#74c476', '#00441b']
  }, 
  'Incertidumbre SD 2022 (Mg C/ha)',
  false // Desactivada por defecto
);

```

---

## 📦 Descarga de Productos Ráster (GeoTIFF)

Los productos ráster generados a $30\text{ m}$ de resolución espacial están alojados en almacenamiento remoto seguro con soporte de descarga directa:

| Producto Ráster | Año | CRS / Proyección | Tamaño de Píxel | Enlace de Descarga |
| :--- | :---: | :---: | :---: | :---: |
| **MACFPO - Stock de Carbono** | 2023 | EPSG:4326 (WGS84) | $0.000269^\circ \ (\approx 30\text{ m})$ | [<img src="https://img.shields.io/badge/Google_Drive-Descargar-4285F4?style=for-the-badge&logo=googledrive&logoColor=white"/>](https://drive.google.com/uc?export=download&id=1ZHDqCDlJxeWaNJY8d9xS2H-GkezURWyE) |
| **MACFPO - Desviación Estándar** | 2023 | EPSG:4326 (WGS84) | $0.000269^\circ \ (\approx 30\text{ m})$ | [<img src="https://img.shields.io/badge/Google_Drive-Descargar-4285F4?style=for-the-badge&logo=googledrive&logoColor=white"/>](https://drive.google.com/uc?export=download&id=13IPwOZIJB1Qoq-PvOImqi86gFm8a5vXS) |

---

## 📖 Cita Requerida / How to Cite

Si utilizas el modelo MACFPO, sus coeficientes o las capas GeoTIFF derivadas en tu investigación, por favor cita esta obra de la siguiente manera:

```bibtex
@article{macfpo_usb_2024,
  author    = {Laboratorio de Sistemas de Información Geográfica y Modelado Ambiental (LSIGMA)},
  title     = {Modelo de Almacenamiento de Carbono en la Faja Petrolífera del Orinoco (MACFPO): Integración de MapBiomas y Coeficientes Regionalizados},
  journal   = {Universidad Simón Bolívar (USB)},
  year      = {2024},
  address   = {Caracas, Venezuela},
  url       = {[https://github.com/lsigma/macfpo-geospatial-engine](https://github.com/lsigma/macfpo-geospatial-engine)}
}

```

---

## 📜 Licencia

Este proyecto está distribuido bajo la licencia **MIT**. Consulta el archivo `LICENSE` para obtener más detalles.
