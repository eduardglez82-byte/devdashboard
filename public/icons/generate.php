<?php
/**
 * Generador del logo de DevDashboard como PNG.
 * Uso:  php public/icons/generate.php
 *
 * Diseño:
 *  - Cuadrado dark con esquinas redondeadas (estilo iOS)
 *  - Símbolo ">" relleno + cursor "_" en verde acento
 *  - Glow suave alrededor del símbolo
 */

$variants = [
    // [archivo, tamaño, ¿maskable? (margen interior mayor + sin esquinas redondeadas)]
    ['icon-192.png',         192, false],
    ['icon-512.png',         512, false],
    ['apple-touch-icon.png', 180, false],
    ['maskable-192.png',     192, true],
    ['maskable-512.png',     512, true],
    ['favicon-32.png',        32, false],
    ['favicon-16.png',        16, false],
];

$outDir = __DIR__;

if (!function_exists('imagecreatetruecolor')) {
    fwrite(STDERR, "GD no está disponible.\n");
    exit(1);
}

function drawIcon(int $size, bool $maskable): \GdImage
{
    $im = imagecreatetruecolor($size, $size);
    imagealphablending($im, true);
    imagesavealpha($im, true);
    imageantialias($im, true);

    // Paleta
    $bgDark    = imagecolorallocate($im, 8, 8, 8);          // casi negro
    $bgPanel1  = imagecolorallocate($im, 22, 22, 24);
    $bgPanel2  = imagecolorallocate($im, 14, 14, 16);
    $green     = imagecolorallocate($im, 16, 185, 129);     // #10b981
    $greenLite = imagecolorallocate($im, 52, 211, 153);     // claro para highlights
    $glow1     = imagecolorallocatealpha($im, 16, 185, 129, 90);
    $glow2     = imagecolorallocatealpha($im, 16, 185, 129, 110);
    $glow3     = imagecolorallocatealpha($im, 16, 185, 129, 122);

    // Fondo full-bleed (siempre)
    imagefilledrectangle($im, 0, 0, $size, $size, $bgDark);

    // Panel interior con esquinas redondeadas (solo no-maskable)
    if (!$maskable) {
        $pad = (int) round($size * 0.07);
        $r   = (int) round($size * 0.22);
        roundedFilledRect($im, $pad, $pad, $size - $pad - 1, $size - $pad - 1, $r, $bgPanel1);
        // Highlight diagonal sutil (degradado fake con líneas)
        $hr = (int) round($size * 0.22);
        roundedFilledRect($im, $pad + 2, $pad + 2, $size - $pad - 3, (int)($size * 0.55), $hr, $bgPanel2);
    }

    // ── Símbolo ">_" en el centro ─────────────────────────────────
    // Maskable safe-zone: contenido en el círculo del 80% central
    $contentW = $size * ($maskable ? 0.55 : 0.66);
    $cx = $size / 2;
    $cy = $size / 2;

    // Geometría del ">" (relleno)
    $arrowH    = $contentW * 0.62;
    $arrowW    = $contentW * 0.38;
    $arrowOffX = -$contentW * 0.15;
    $thick     = max(4, (int) round($size * 0.10));   // grosor de los trazos

    $xStart = $cx + $arrowOffX - $arrowW / 2;
    $xTip   = $cx + $arrowOffX + $arrowW / 2;
    $yTop   = $cy - $arrowH / 2;
    $yMid   = $cy;
    $yBot   = $cy + $arrowH / 2;

    // 1) Glow exterior (3 capas decrecientes)
    drawThickLine($im, $xStart, $yTop, $xTip, $yMid, $thick + 14, $glow3);
    drawThickLine($im, $xTip,   $yMid, $xStart, $yBot, $thick + 14, $glow3);
    drawThickLine($im, $xStart, $yTop, $xTip, $yMid, $thick + 9,  $glow2);
    drawThickLine($im, $xTip,   $yMid, $xStart, $yBot, $thick + 9,  $glow2);
    drawThickLine($im, $xStart, $yTop, $xTip, $yMid, $thick + 4,  $glow1);
    drawThickLine($im, $xTip,   $yMid, $xStart, $yBot, $thick + 4,  $glow1);

    // 2) Trazo principal del ">"
    drawThickLine($im, $xStart, $yTop, $xTip, $yMid, $thick, $green);
    drawThickLine($im, $xTip,   $yMid, $xStart, $yBot, $thick, $green);

    // 3) Highlight clarito en la mitad superior del ">"
    drawThickLine($im, $xStart + $thick * 0.15, $yTop + $thick * 0.15,
                       $xTip   - $thick * 0.05, $yMid - $thick * 0.05,
                       max(2, (int) round($thick * 0.32)), $greenLite);

    // 4) Cursor "_" a la derecha
    $cursorW  = $contentW * 0.36;
    $cursorY  = $cy + $arrowH * 0.42;
    $cursorX1 = $cx + $contentW * 0.04;
    $cursorX2 = $cursorX1 + $cursorW;

    drawThickLine($im, $cursorX1, $cursorY, $cursorX2, $cursorY, $thick + 6, $glow2);
    drawThickLine($im, $cursorX1, $cursorY, $cursorX2, $cursorY, $thick,     $green);

    // 5) Tapas redondeadas en los extremos
    $capR = (int) round($thick / 2);
    imagefilledellipse($im, (int)$xStart, (int)$yTop, $capR * 2, $capR * 2, $green);
    imagefilledellipse($im, (int)$xTip,   (int)$yMid, $capR * 2, $capR * 2, $green);
    imagefilledellipse($im, (int)$xStart, (int)$yBot, $capR * 2, $capR * 2, $green);
    imagefilledellipse($im, (int)$cursorX1, (int)$cursorY, $capR * 2, $capR * 2, $green);
    imagefilledellipse($im, (int)$cursorX2, (int)$cursorY, $capR * 2, $capR * 2, $green);

    return $im;
}

/**
 * Línea gruesa con extremos redondeados (GD básico ignora setthickness en líneas largas).
 * La pintamos como un polígono rotado + dos círculos en los extremos = cap "round".
 */
function drawThickLine($im, float $x1, float $y1, float $x2, float $y2, int $thick, int $color): void
{
    $dx = $x2 - $x1;
    $dy = $y2 - $y1;
    $len = sqrt($dx * $dx + $dy * $dy);
    if ($len < 0.001) {
        $r = max(1, (int) round($thick / 2));
        imagefilledellipse($im, (int)$x1, (int)$y1, $r * 2, $r * 2, $color);
        return;
    }
    // Vector perpendicular unitario * (thick/2)
    $px = -$dy / $len * ($thick / 2);
    $py =  $dx / $len * ($thick / 2);

    $poly = [
        (int) round($x1 + $px), (int) round($y1 + $py),
        (int) round($x2 + $px), (int) round($y2 + $py),
        (int) round($x2 - $px), (int) round($y2 - $py),
        (int) round($x1 - $px), (int) round($y1 - $py),
    ];
    imagefilledpolygon($im, $poly, 4, $color);

    // Cap redondo en cada extremo
    $r = max(1, (int) round($thick / 2));
    imagefilledellipse($im, (int)$x1, (int)$y1, $r * 2, $r * 2, $color);
    imagefilledellipse($im, (int)$x2, (int)$y2, $r * 2, $r * 2, $color);
}

/**
 * Rectángulo con esquinas redondeadas relleno.
 */
function roundedFilledRect($im, int $x1, int $y1, int $x2, int $y2, int $radius, int $color): void
{
    imagefilledrectangle($im, $x1 + $radius, $y1, $x2 - $radius, $y2, $color);
    imagefilledrectangle($im, $x1, $y1 + $radius, $x2, $y2 - $radius, $color);
    imagefilledellipse($im, $x1 + $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($im, $x2 - $radius, $y1 + $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($im, $x1 + $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
    imagefilledellipse($im, $x2 - $radius, $y2 - $radius, $radius * 2, $radius * 2, $color);
}

foreach ($variants as [$name, $size, $maskable]) {
    $im = drawIcon($size, $maskable);
    $path = $outDir . DIRECTORY_SEPARATOR . $name;
    imagepng($im, $path, 9);
    imagedestroy($im);
    echo sprintf("✓ %-22s %dx%d\n", $name, $size, $size);
}

echo "Listo. Iconos en: $outDir\n";
