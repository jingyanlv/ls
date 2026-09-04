$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$extensionRoot = Join-Path $projectRoot 'extensions'
$outputFile = Join-Path $extensionRoot 'registry.generated.js'
$manifests = Get-ChildItem -LiteralPath $extensionRoot -Filter 'manifest.json' -File -Recurse | Sort-Object FullName
$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add('// GENERATED FILE. Run tools/build-registry.ps1 after adding or removing an extension.')
$lines.Add('(function(){')
foreach ($file in $manifests) {
  $manifest = Get-Content -LiteralPath $file.FullName -Raw | ConvertFrom-Json
  foreach ($required in @('id','name','version','type','entry','compatibleCoreVersion')) {
    if (-not $manifest.$required) { throw "Manifest $($file.FullName) is missing $required" }
  }
  $entryPath = Join-Path $file.DirectoryName $manifest.entry
  if (-not (Test-Path -LiteralPath $entryPath)) { throw "Missing entry for $($manifest.id): $entryPath" }
  $relativeManifest = [IO.Path]::GetRelativePath($projectRoot, $file.FullName).Replace('\','/')
  $relativeEntry = [IO.Path]::GetRelativePath($projectRoot, $entryPath).Replace('\','/')
  $compact = $manifest | ConvertTo-Json -Depth 20 -Compress
  $lines.Add("Lingshi.registerManifest($compact);")
  $lines.Add("document.write('<script src=`"./$relativeEntry`"><\/script>');")
}
$lines.Add('})();')
[IO.File]::WriteAllLines($outputFile, $lines, [Text.UTF8Encoding]::new($false))
Write-Output "Generated $outputFile with $($manifests.Count) extensions."
