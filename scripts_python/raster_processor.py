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

# Constante científica estándar para ausencia de datos en rásteres float32
NODATA_VALUE = -9999.0


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
    with open(cfg_path, "r", encoding="utf-8") as f:
        cfg = json.load(f)

    # Determinar el código máximo de clase para dimensiones de la lookup table
    class_keys = [int(k) for k in cfg["classes"].keys()]
    max_code = max(class_keys) + 1

    # Inicializar vectores de mapeo con NODATA_VALUE (-9999.0)
    lookup_mean = np.full(max_code, NODATA_VALUE, dtype=np.float32)
    lookup_sd = np.full(max_code, NODATA_VALUE, dtype=np.float32)

    # Poblar únicamente las clases definidas formalmente
    for code_str, values in cfg["classes"].items():
        code = int(code_str)
        lookup_mean[code] = values["carbon_mean"]
        lookup_sd[code] = values["carbon_sd"]

    logging.info("Iniciando procesamiento por bloques de memoria...")

    with rasterio.open(input_path) as src:
        # Extraer el valor NoData original de la capa de entrada
        input_nodata = src.nodata

        # Construir perfil para GeoTIFFs optimizados (Cloud Optimized GeoTIFF - COG Ready)
        profile = src.profile.copy()
        profile.update(
            dtype=rasterio.float32,
            nodata=NODATA_VALUE,
            compress="lzw",
            tiled=True,
            blockxsize=512,
            blockysize=512
        )

        with rasterio.open(stock_path, "w", **profile) as dst_stock, \
             rasterio.open(sd_path, "w", **profile) as dst_sd:

            total_blocks = len(list(src.block_windows(1)))
            logging.info(f"Procesando {total_blocks} bloques de 512x512 píxeles...")

            for block_idx, (ij, window) in enumerate(src.block_windows(1), start=1):
                data = src.read(1, window=window)

                # Mascarado de seguridad: verificar rango de índices y NoData de entrada
                valid_indices_mask = (data >= 0) & (data < max_code)
                if input_nodata is not None:
                    valid_indices_mask &= (data != input_nodata)

                # Mapear datos seguros a índice 0 temporalmente para evitar IndexError
                safe_data = np.where(valid_indices_mask, data, 0)

                # Reclasificación vectorizada O(1)
                stock_window = lookup_mean[safe_data]
                sd_window = lookup_sd[safe_data]

                # Aplicar NODATA_VALUE explícito a todo píxel fuera de definición
                stock_window[~valid_indices_mask] = NODATA_VALUE
                sd_window[~valid_indices_mask] = NODATA_VALUE

                # Escritura en disco por bloque
                dst_stock.write(stock_window.astype(np.float32), 1, window=window)
                dst_sd.write(sd_window.astype(np.float32), 1, window=window)

                if block_idx % 20 == 0 or block_idx == total_blocks:
                    logging.info(f"Progreso: {block_idx}/{total_blocks} bloques procesados.")

    logging.info(f"Ráster de Stock generado exitosamente: {stock_path}")
    logging.info(f"Ráster de Incertidumbre generado exitosamente: {sd_path}")


if __name__ == "__main__":
    process_carbon_raster(
        input_raster_path="data/raw/mapbiomas_fpo_2023.tif",
        output_stock_path="data/processed/macfpo_stock_2023.tif",
        output_sd_path="data/processed/macfpo_sd_2023.tif",
        config_path="config/carbon_coefficients.json"
    )
