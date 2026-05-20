#!/usr/bin/env pwsh
# Builds release APK for kinboard-tv app.
# Optional signing: set KEYSTORE_PATH, KEYSTORE_PASSWORD, KEY_ALIAS, KEY_PASSWORD env vars
# before running. Without them the APK is signed with the debug key.

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$tvDir = Join-Path $scriptDir 'kinboard-tv'
$gradlew = Join-Path $tvDir 'gradlew.bat'

if (-not (Test-Path $gradlew)) {
    Write-Error "gradlew.bat not found at $gradlew"
}

Push-Location $tvDir
try {
    & $gradlew clean assembleRelease
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Gradle build failed (exit $LASTEXITCODE)"
    }
}
finally {
    Pop-Location
}

$apkSrc = Join-Path $tvDir 'app\build\outputs\apk\release'
$apk = Get-ChildItem -Path $apkSrc -Filter '*.apk' -ErrorAction Stop | Select-Object -First 1
if (-not $apk) {
    Write-Error "No APK found in $apkSrc"
}

$outDir = Join-Path $scriptDir 'build-output'
if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dest = Join-Path $outDir "kinboard-tv-release-$stamp.apk"
Copy-Item -Path $apk.FullName -Destination $dest -Force

Write-Host ""
Write-Host "APK built: $dest"
Write-Host "Source:    $($apk.FullName)"
