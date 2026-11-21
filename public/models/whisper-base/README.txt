Modelo para "Audio a texto" de DocuSmart (W-133)

Modelo: Whisper base (OpenAI), https://github.com/openai/whisper
Licencia del modelo original: MIT. Conversión a ONNX: onnx-community/whisper-base
(https://huggingface.co/onnx-community/whisper-base, Apache License 2.0).
Archivos de origen: onnx/encoder_model_quantized.onnx y onnx/decoder_model_merged_quantized.onnx.

Cambios hechos por DocuSmart: el decoder se dividió en dos partes (se unen en el navegador) y del
tokenizer.json se extrajo solo la lista de tokens de texto (tokens.v1.json). SHA-256:
  encoder.v1.bin            5862993336bf33acd23736071aae2b32261d3b1b2f37780194460d4ef974dd46 (23201314 bytes)
  decoder (part0 + part1)   fa3ef9902734ce5ae6f9ef2bdb2ba9a6c4b5785b09f4f420ce036573dc9d090b (53693315 bytes)
  tokens.v1.json            c3793c6eeb9d72bb5908f0341af745e8dc2d462848ecbc1d97d2f3f6aa7a57a2 (545096 bytes)

El modelo corre dentro del navegador con onnxruntime-web (MIT): el audio nunca se sube.
