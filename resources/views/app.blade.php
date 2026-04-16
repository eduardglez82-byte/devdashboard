<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>DevDashboard</title>

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
</body>
</html>
