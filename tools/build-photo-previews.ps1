# Build the small gallery images from the original transparent cutouts.
param(
    [string]$Source = (Join-Path $PSScriptRoot '..\originals\thumbnails\cutouts'),
    [string]$Destination = (Join-Path $PSScriptRoot '..\site\thumbnails\assets\photo-previews')
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$size = 144
$paths = Get-ChildItem -LiteralPath $Source -File -Filter '*.png'
if (!$paths) { throw "No photo cutouts found in $Source" }
$null = New-Item -ItemType Directory -Path $Destination -Force

foreach ($path in $paths) {
    $sourceImage = [System.Drawing.Image]::FromFile($path.FullName)
    try {
        $preview = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($preview)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $scale = $size / [math]::Max($sourceImage.Width, $sourceImage.Height)
                $width = [int][math]::Round($sourceImage.Width * $scale)
                $height = [int][math]::Round($sourceImage.Height * $scale)
                $graphics.DrawImage($sourceImage, [int](($size - $width) / 2), $size - $height, $width, $height)
            } finally { $graphics.Dispose() }
            $preview.Save((Join-Path $Destination $path.Name), [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $preview.Dispose() }
    } finally { $sourceImage.Dispose() }
}

Write-Output "Built $($paths.Count) visual photo previews."
