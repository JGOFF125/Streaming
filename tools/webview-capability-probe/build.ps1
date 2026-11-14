param(
 [switch]$OnlineDemo,
 [string]$OrbitProbeWebKit,
 [string]$OrbitProbeCore,
 [string]$OrbitProbeSdk = "$env:LOCALAPPDATA/Android/Sdk",
 [string]$OrbitProbeJava = 'C:/Program Files/Android/Android Studio/jbr',
 [string]$OrbitProbeBuildTools = '36.0.0',
 [string]$OrbitProbePlatform = 'android-37.0'
)
$ErrorActionPreference='Stop'
$OrbitProbeRoot=(Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$OrbitProbeOutput=Join-Path $OrbitProbeRoot $(if($OnlineDemo){'.expo/webview-demo-probe'}else{'.expo/webview-capability-probe'})
$OrbitProbeSource=if($OnlineDemo){'src/DemoActivity.java'}else{'src/ProbeActivity.java'}
$OrbitProbeManifestName=if($OnlineDemo){'AndroidManifest.online.xml'}else{'AndroidManifest.xml'}
$OrbitProbePackage=if($OnlineDemo){'com.jgoff125.orbit.demoprobe'}else{'com.jgoff125.orbit.capabilityprobe'}
New-Item -ItemType Directory -Force -Path $OrbitProbeOutput | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $OrbitProbeOutput 'classes'),(Join-Path $OrbitProbeOutput 'dex') | Out-Null
$OrbitProbeTools=Join-Path $OrbitProbeSdk "build-tools/$OrbitProbeBuildTools"
$OrbitProbeAndroid=Join-Path $OrbitProbeSdk "platforms/$OrbitProbePlatform/android.jar"
function Invoke-ProbeTool([string]$File,[string[]]$ToolArguments){
 & $File @ToolArguments
 if($LASTEXITCODE -ne 0){throw "Probe build tool failed: $([IO.Path]::GetFileName($File))"}
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
function Assert-ProbeDependencyClass([string]$Jar,[string]$ClassPath){
 $ProbeDependencyZip=[IO.Compression.ZipFile]::OpenRead($Jar)
 try {if($null -eq $ProbeDependencyZip.GetEntry($ClassPath)){throw 'Required public SDK class is missing from a diagnostic dependency.'}} finally {$ProbeDependencyZip.Dispose()}
}
$OrbitProbeCompileClasspath=$OrbitProbeAndroid
if($OnlineDemo){
 if(-not $OrbitProbeWebKit){$OrbitProbeWebKit=Join-Path $OrbitProbeRoot '.expo/browser-profile-build/webkit-classes.jar'}
 if(-not(Test-Path -LiteralPath $OrbitProbeWebKit)){throw 'Supply the existing public AndroidX WebKit 1.18.0 classes.jar using -OrbitProbeWebKit.'}
 if(-not $OrbitProbeCore){$OrbitProbeCore=Join-Path $OrbitProbeRoot '.expo/webview-demo-probe/core-classes.jar'}
 if(-not(Test-Path -LiteralPath $OrbitProbeCore)){throw 'Supply AndroidX Core 1.1.0 classes.jar (WebKit runtime dependency) using -OrbitProbeCore.'}
 Assert-ProbeDependencyClass $OrbitProbeWebKit 'androidx/webkit/WebSettingsCompat.class'
 Assert-ProbeDependencyClass $OrbitProbeCore 'androidx/core/content/pm/PackageInfoCompat.class'
 $OrbitProbeCompileClasspath=($OrbitProbeAndroid,$OrbitProbeWebKit,$OrbitProbeCore) -join [IO.Path]::PathSeparator
}
$env:JAVA_HOME=$OrbitProbeJava
Invoke-ProbeTool (Join-Path $OrbitProbeJava 'bin/javac.exe') @('--release','8','-classpath',$OrbitProbeCompileClasspath,'-d',(Join-Path $OrbitProbeOutput 'classes'),(Join-Path $PSScriptRoot $OrbitProbeSource))
$OrbitProbeClasses=@(Get-ChildItem -LiteralPath (Join-Path $OrbitProbeOutput 'classes') -Filter '*.class' -Recurse | ForEach-Object {$_.FullName})
Invoke-ProbeTool (Join-Path $OrbitProbeTools 'd8.bat') (@('--lib',$OrbitProbeAndroid,'--min-api','29','--output',(Join-Path $OrbitProbeOutput 'dex'))+$OrbitProbeClasses+$(if($OnlineDemo){@($OrbitProbeWebKit,$OrbitProbeCore)}else{@()}))
$OrbitProbeUnsigned=Join-Path $OrbitProbeOutput 'unsigned.apk'
Invoke-ProbeTool (Join-Path $OrbitProbeTools 'aapt2.exe') @('link','--manifest',(Join-Path $PSScriptRoot $OrbitProbeManifestName),'-I',$OrbitProbeAndroid,'-A',(Join-Path $PSScriptRoot 'assets'),'-o',$OrbitProbeUnsigned)
Invoke-ProbeTool (Join-Path $OrbitProbeJava 'bin/jar.exe') @('uf',$OrbitProbeUnsigned,'-C',(Join-Path $OrbitProbeOutput 'dex'),'classes.dex')
$OrbitProbeAligned=Join-Path $OrbitProbeOutput 'aligned.apk'
Invoke-ProbeTool (Join-Path $OrbitProbeTools 'zipalign.exe') @('-f','4',$OrbitProbeUnsigned,$OrbitProbeAligned)
$OrbitProbeKey=Join-Path $OrbitProbeOutput 'local-probe.keystore'
if(-not(Test-Path -LiteralPath $OrbitProbeKey)){
 # This local-only test identity has a public password and never signs Orbit releases.
 Invoke-ProbeTool (Join-Path $OrbitProbeJava 'bin/keytool.exe') @('-genkeypair','-keystore',$OrbitProbeKey,'-storepass','offline-probe','-keypass','offline-probe','-alias','offline-probe','-keyalg','RSA','-keysize','2048','-validity','365','-dname','CN=Orbit Offline Probe')
}
$OrbitProbeApk=Join-Path $OrbitProbeOutput 'offline-probe.apk'
Invoke-ProbeTool (Join-Path $OrbitProbeTools 'apksigner.bat') @('sign','--ks',$OrbitProbeKey,'--ks-key-alias','offline-probe','--ks-pass','pass:offline-probe','--key-pass','pass:offline-probe','--out',$OrbitProbeApk,$OrbitProbeAligned)
Invoke-ProbeTool (Join-Path $OrbitProbeTools 'apksigner.bat') @('verify',$OrbitProbeApk)
$OrbitProbeManifest=& (Join-Path $OrbitProbeTools 'aapt.exe') dump permissions $OrbitProbeApk
if($LASTEXITCODE -ne 0 -or -not($OrbitProbeManifest -contains ('package: '+$OrbitProbePackage))){throw 'Unexpected probe package'}
$OrbitProbePermissions=@($OrbitProbeManifest | Where-Object {$_ -match '^uses-permission'})
if($OnlineDemo){if($OrbitProbePermissions.Count -ne 1 -or $OrbitProbePermissions[0].Trim() -cne "uses-permission: name='android.permission.INTERNET'"){throw 'Unexpected online probe permissions'}}elseif($OrbitProbePermissions.Count -gt 0){throw 'Unexpected offline probe permissions'}
Write-Output $(if($OnlineDemo){'Built verified public demo control. INTERNET only; no page loads until user selects a sample.'}else{'Built verified offline probe. No Android permissions declared.'})
Write-Output $OrbitProbeApk
