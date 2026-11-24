Modelos para "Distinguir quién habla" en "Audio a texto" de DocuSmart (W-147.4)

1) Segmentación de hablantes: pyannote/segmentation-3.0 (Hervé Bredin y colaboradores),
   https://huggingface.co/pyannote/segmentation-3.0
   Licencia: MIT. Conversión a ONNX: onnx-community/pyannote-segmentation-3.0 (MIT),
   https://huggingface.co/onnx-community/pyannote-segmentation-3.0 (onnx/model.onnx)
   segmentation.v1.bin  057ee564753071c0b09b5b611648b50ac188d50846bff5f01e9f7bbf1591ea25 (5986908 bytes)

2) Huella de voz: WeSpeaker ResNet34 entrenado con VoxCeleb (pyannote/wespeaker-voxceleb-resnet34-LM),
   https://github.com/wenet-e2e/wespeaker
   Licencia: Creative Commons Attribution 4.0 (CC BY 4.0), https://creativecommons.org/licenses/by/4.0/
   Conversión a ONNX cuantizado: onnx-community/wespeaker-voxceleb-resnet34-LM,
   https://huggingface.co/onnx-community/wespeaker-voxceleb-resnet34-LM (onnx/model_quantized.onnx)
   embedding.v1.bin     f73f647730ae440ae411c2241290f42ff5b2106dd3176c897fe6fbb1950d5393 (6685134 bytes)

Cambios hechos por DocuSmart: ninguno en los pesos; solo se renombraron los archivos. El navegador
verifica su SHA-256 antes de usarlos.

Los modelos corren dentro del navegador con onnxruntime-web (MIT): el audio nunca se sube.
