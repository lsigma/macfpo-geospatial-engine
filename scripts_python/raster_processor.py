"""
Módulo de procesamiento ráster local para el modelo MACFPO.
Laboratorio LSIGMA - Universidad Simón Bolívar.

Procesa capas de cobertura de MapBiomas mediante lectura por bloques (windows)
para optimizar la memoria RAM en rásteres de alta resolución espacial.
"""

import json
import logging
from pathlib import Path
import numpy as np
import rasterio

# Configuración del registrador de eventos (Logging)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s"
)

def process_carbon_raster(
    input_raster_path: str,
    output_stock_path: str,
    output_sd_path: str,
    config_path: str
) -> None:
    """
    Lee un ráster de uso/cobertura y genera mapas de Stock e Incertidumbre de Carbono.

    Parameters:
        input_raster_path (str): Ruta al archivo GeoTIFF de cobertura (MapBiomas).
        output_stock_path (str): Ruta donde se guardará el ráster de Stock (Mg C/ha).
        output_sd_path (str): Ruta donde se guardará el ráster de Desviación Estándar.
        config_path (str): Ruta al archivo JSON con los coeficientes del modelo.
    """
    input_path = Path(input_raster_path)
    stock_path = Path(output_stock_path)
    sd_path = Path(output_sd_path)
    cfg_path = Path(config_path)

    # Validar existencia de archivos de entrada
    if not input_path.exists():
        raise FileNotFoundError(f"El ráster de entrada no existe: {input_path}")
    if not cfg_path.exists():
        raise FileNotFoundError(f"El archivo de configuración no existe: {cfg_path}")

    # Asegurar que los directorios de salida existan
    stock_path.parent.mkdir(parents=True, exist_ok=True)
    sd_path.parent.mkdir(parents=True, exist_ok=True)

    # Cargar coeficientes desde el JSON
    with open(cfg_path, 'r', encoding='utf-8') as f:
        cfg = json.load(f)

    # Construir vectores de mapeo directo para NumPy (Reclasificación ultrarrápida O(1))
    class_keys = [int(k) for k in cfg['classes'].keys()]
    max_code = max(class_keys) + 1

    lookup_mean = np.zeros(max_code, dtype=np.float32)
    lookup_sd = np.zeros(max_code, dtype=np.float32)

    for code_str, values in cfg['classes'].items():
        code = int(code_str)
        lookup_mean[code] = values['carbon_mean']
        lookup_sd[code] = values['carbon_sd']

    logging.info("Iniciando procesamiento de bloques ráster...")

    with rasterio.open(input_path) as src:
        profile = src.profile.copy()
        profile.update(
            dtype=rasterio.float32,
            nodata=0.0,
            compress='lzw',
            tiled=True,
            blockxsize=512,
            blockysize=512
        )

        with rasterio.open(stock_path, 'w', **profile) as dst_stock, \
             rasterio.open(sd_path, 'w', **profile) as dst_sd:

            # Procesamiento por bloques para mantener bajo consumo de memoria RAM
            for ij, window in src.block_windows(1):
                data = src.read(1, window=window)

                # Control de seguridad contra píxeles fuera de rango o NoData no mapeados
                valid_mask = (data >= 0) & (data < max_code)
                safe_data = np.where(valid_mask, data, 0)

                # Reclasificación vectorizada por indexación de arreglo
                stock_window = lookup_mean[safe_data]
                sd_window = lookup_sd[safe_data]

                # Asignar 0.0 a los valores no válidos
                stock_window[~valid_mask] = 0.0
                sd_window[~valid_mask] = 0.0

                # Escritura en disco
                dst_stock.write(stock_window.astype(np.float32), 1, window=window)
                dst_sd.write(sd_window.astype(np.float32), 1, window=window)

    logging.info(f"Ráster de Stock generado exitosamente: {stock_path}")
    logging.info(f"Ráster de Incertidumbre generado exitosamente: {sd_path}")


if __name__ == "__main__":
    # Ejecución de prueba por defecto
    process_carbon_raster(
        input_raster_path="data/raw/mapbiomas_fpo_2023.tif",
        output_stock_path="data/processed/macfpo_stock_2023.tif",
        output_sd_path="data/processed/macfpo_sd_2023.tif",
        config_path="config/carbon_coefficients.json"
    )
