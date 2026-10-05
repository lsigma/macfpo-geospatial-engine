# MACFPO: Modelo de Almacenamiento de Carbono en la Faja Petrolífera del Orinoco

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![GEE](https://img.shields.io/badge/Google%20Earth%20Engine-API-green.svg)](https://earthengine.google.com/)

## Descripción
Repositorio oficial del **Modelo de Almacenamiento de Carbono en la Faja Petrolífera del Orinoco (MACFPO)**. Este modelo geoespacial multitemporal (1985–2023) cuantifica los depósitos de carbono en $64.157,87\text{ km}^2$ al norte del río Orinoco mediante la integración de la Colección 2.0 de **MapBiomas Venezuela** y coeficientes regionalizados de biomasa y Carbono Orgánico del Suelo (COS).

## Formulación Matemática

El almacenamiento total de carbono por píxel se calcula como:

$$C_{\text{total}} = C_{\text{biomasa aérea}} + C_{\text{biomasa subterránea}} + C_{\text{suelo}}$$

Donde:
- $C_{\text{biomasa aérea}} = C_{\text{hojas}} + C_{\text{madera}}$
- $C_{\text{biomasa subterránea}} = C_{\text{raíces}}$
- $C_{\text{suelo}} = \text{COS (0--60 cm)}$

Para el análisis de propagación de incertidumbre edáfica y vegetal:

$$\sigma_{\text{total}} = \sqrt{\sigma_{\text{biomasa}}^2 + \sigma_{\text{COS}}^2}$$

## Coeficientes del Modelo

| Clase MapBiomas (v2.0) | Carbono Total Promedio ($\text{Mg C/ha}$) | Desviación Estándar ($\pm \sigma$) | Muestras ($n$) | Coeficiente de Variación ($\text{CV \%}$) |
| :--- | :---: | :---: | :---: | :---: |
| **Bosque Inundable** | 359,3 | 121,2 | 3 | 24,7% |
| **Bosque** | 331,9 | 143,4 | 7 | 37,5% |
| **Plantación Forestal** | 143,7 | 96,1 | 3 | 77,2% |
| **Herbazal/Arbustal Inundable** | 132,3 | 19,82 | 4 | 3,4% |
| **Sabana Arbolada** | 47,3 | 27,8 | 4 | 35,5% |
| **Sabana/Herbazal** | 34,5 | 23,7 | 10 | 6,0% |
| **Uso Agropecuario** | 52,5 | 38,0 | 11 | 70,3% |

## Instrucciones de Instalación y Uso

### 1. Clonar el repositorio
```bash
git clone [https://github.com/lsigma/macfpo-geospatial-engine.git](https://github.com/lsigma/macfpo-geospatial-engine.git)
cd macfpo-geospatial-engine
