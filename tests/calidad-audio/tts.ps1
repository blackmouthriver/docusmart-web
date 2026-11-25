param([string]$json, [string]$out)
Add-Type -AssemblyName System.Speech
$t = Get-Content $json -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($p in $t.PSObject.Properties) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  if ($p.Name -eq 'en') { $s.SelectVoice('Microsoft Zira Desktop') } else { $s.SelectVoice('Microsoft Sabina Desktop') }
  $fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(16000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
  $s.SetOutputToWaveFile("$out\$($p.Name).wav", $fmt)
  $pb = New-Object System.Speech.Synthesis.PromptBuilder
  foreach ($part in ($p.Value -split '\[PAUSA\]')) { $pb.AppendText($part.Trim()); $pb.AppendBreak([TimeSpan]::FromSeconds(4)) }
  $s.Speak($pb); $s.Dispose()
}
