Modelo para "Quitar fondo" de DocuSmart (W-121)

Modelo: IS-Net "isnet-general-use" (Highly Accurate Dichotomous Image Segmentation,
Xuebin Qin et al.), https://github.com/xuebinqin/DIS
Licencia: Apache License 2.0 (https://www.apache.org/licenses/LICENSE-2.0)
Archivo ONNX de origen: https://github.com/danielgatis/rembg/releases (isnet-general-use.onnx)

Cambios hechos por DocuSmart: los pesos se guardaron en float16 con un Cast a float32
al inicio del grafo (el cálculo sigue en float32, misma calidad, mitad de tamaño) y el
archivo se dividió en dos partes. Se une en el navegador y se verifica su SHA-256:
3ade1e51e6923c025f03545cd1dafb765841f1a8a7fc25f2452dde64b857695f (90653257 bytes)

El modelo corre dentro del navegador con onnxruntime-web (MIT): las imágenes nunca se suben.
