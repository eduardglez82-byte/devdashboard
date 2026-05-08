<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no, interactive-widget=resizes-content" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>DevDashboard</title>

    {{-- PWA --}}
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0a0a0a" media="(prefers-color-scheme: dark)" />
    <meta name="theme-color" content="#f7f7f5" media="(prefers-color-scheme: light)" />
    <meta name="application-name" content="DevDashboard" />
    <meta name="description" content="Panel de productividad con Kanban, Pomodoro, IA y Spotify." />

    {{-- Favicons --}}
    <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
    <link rel="shortcut icon" href="/favicon.ico" />

    {{-- iOS / Safari (Add to Home Screen) --}}
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="DevDashboard" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
    <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

    {{-- Microsoft Tile --}}
    <meta name="msapplication-TileColor" content="#0a0a0a" />
    <meta name="msapplication-TileImage" content="/icons/icon-192.png" />

    {{-- Open Graph (compartir) --}}
    <meta property="og:title" content="DevDashboard" />
    <meta property="og:description" content="Panel de productividad con Kanban, Pomodoro, IA y Spotify." />
    <meta property="og:image" content="/icons/icon-512.png" />
    <meta property="og:type" content="website" />

    {{-- Configuración global de la app --}}
    <script>
        window.APP_CONFIG = {
            spotifyClientId: '{{ config('services.spotify.client_id', '') }}'
        };
    </script>

    {{-- Previene flash del tema incorrecto al recargar --}}
    <script>
        (function () {
            try {
                var t = localStorage.getItem('devdashboard:theme');
                if (!t) {
                    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                }
                document.documentElement.classList.add(t);
                document.documentElement.setAttribute('data-theme', t);
            } catch (e) {}
        })();
    </script>

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.jsx'])
</head>
<body>
    <div id="root"></div>

    {{-- Service Worker registration (solo en producción y en orígenes seguros) --}}
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .catch(function (err) { console.warn('SW registro falló:', err); });
            });
        }
    </script>
</body>
</html>
