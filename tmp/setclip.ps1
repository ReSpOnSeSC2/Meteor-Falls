param([string]$Path)
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($Path)
[System.Windows.Forms.Clipboard]::SetImage($img)
Start-Sleep -Milliseconds 250
Write-Output ("clipboard image set: " + $img.Width + "x" + $img.Height)
