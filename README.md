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

### Modelado de Propagación de Incertidumbre

Para cuantificar el margen de error espacializado asociado a la variabilidad edáfica y vegetal, el modelo aplica propagación de incertidumbre mediante varianza combinada en cuadratura:

$$\sigma_{\text{total}} = \sqrt{\sigma_{\text{biomasa}}^2 + \sigma_{\text{COS}}^2}$$

Donde $\sigma_{\text{total}}$ representa la Desviación Estándar combinada asignada a cada píxel en el GeoTIFF de incertidumbre.

---

## 📊 Coeficientes del Modelo y Leyenda MapBiomas (Col. 2.0)

| Código MapBiomas | Cobertura / Uso del Suelo | Stock Carbono Promedio ($\text{Mg C/ha}$) | Incertidumbre ($\pm \sigma$) | Muestras ($n$) | Coef. Variación ($\text{CV \%}$) |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **3** | Bosque / Formación Forestal | 331,9 | 143,4 | 7 | 43,2% |
| **6** | Bosque Inundable / Manglar | 359,3 | 121,2 | 3 | 33,7% |
| **11** | Herbazal / Arbustal Inundable | 132,3 | 19,82 | 4 | 15,0% |
| **12** | Sabana / Herbazal | 34,5 | 23,7 | 10 | 68,7% |
| **13** | Sabana Arbolada | 47,3 | 27,8 | 4 | 58,8% |
| **15** | Uso Agropecuario / Pastizal | 52,5 | 38,0 | 11 | 72,4% |
| **23** | Plantación Forestal | 143,7 | 96,1 | 3 | 66,9% |
| **33** | Cuerpos de Agua / No Vegetal | 0,0 | 0,0 | N/A | 0,0% |

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
│   │   ├── .gitignore               # Exclusión de binarios GeoTIFF locales
│   │   └── README.md                # Manifiesto y enlaces de descarga de rásteres
│   └── tables/
│       └── MACFPO_Serie_Temporal_Estadisticas.csv  # Series temporales consolidadas
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
// 1. Importar el módulo MACFPO desde el repositorio oficial
var carbonCalc = require('users/lsigma_usb/macfpo:modules/carbon_calculator.js');

// 2. Cargar el Asset oficial de MapBiomas Venezuela (Colección 3)
var mapbiomasRaisg = ee.Image("projects/mapbiomas-public/assets/venezuela/lulc/collection3/mapbiomas_venezuela_collection3_coverage_v1");

// 3. Extraer la banda de clasificación para el año de interés (ej. 2022)
var mapbiomas2022 = mapbiomasRaisg.select('classification_2022').rename('classification');

// 4. Generar imagen multibanda reclasificada: ['carbon_stock', 'carbon_sd']
var macfpoResult = carbonCalc.classifyCarbonAll(mapbiomas2022);

// 5. Visualización interactiva en el mapa
Map.setCenter(-63.5, 8.5, 7); // Centrado en la Faja Petrolífera del Orinoco
Map.addLayer(
  macfpoResult.select('carbon_stock'), 
  {min: 0, max: 360, palette: ['#ffffcc','#a1dab4','#41b6c4','#2c7fb8','#253494']}, 
  'Stock Carbono 2022 (Mg C/ha)'
);

```

---

## 📦 Descarga de Productos Ráster (GeoTIFF)

Los productos ráster generados a $30\text{ m}$ de resolución espacial están alojados en almacenamiento remoto seguro con soporte de descarga directa:

| Producto Ráster | Año | CRS / Proyección | Tamaño de Píxel | Enlace de Descarga |
| :--- | :---: | :---: | :---: | :---: |
| **MACFPO - Stock de Carbono** | 2010 | EPSG:4326 (WGS84) | $0.000269^\circ \ (\approx 30\text{ m})$ | [<img src="https://img.shields.io/badge/Google_Drive-Descargar-4285F4?style=for-the-badge&logo=googledrive&logoColor=white"/>](https://drive.google.com/uc?export=download&id=1ZHDqCDlJxeWaNJY8d9xS2H-GkezURWyE) |
| **MACFPO - Desviación Estándar** | 2010 | EPSG:4326 (WGS84) | $0.000269^\circ \ (\approx 30\text{ m})$ | [<img src="https://img.shields.io/badge/Google_Drive-Descargar-4285F4?style=for-the-badge&logo=googledrive&logoColor=white"/>](https://drive.google.com/uc?export=download&id=13IPwOZIJB1Qoq-PvOImqi86gFm8a5vXS) |

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
