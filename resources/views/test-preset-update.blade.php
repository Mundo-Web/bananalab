<!DOCTYPE html>
<html>
<head>
    <title>Test Preset Update</title>
    <meta name="csrf-token" content="{{ csrf_token() }}">
</head>
<body>
    <h1>Test Preset Update</h1>
    <button onclick="testPresetUpdate()">Test Update Preset</button>
    <div id="result"></div>

    <script>
        async function testPresetUpdate() {
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = 'Testing...';

            try {
                // Usar los IDs del error que reportó el usuario
                const itemId = '9f15b4b9-211e-42a8-a883-16768f1f7315';
                const presetId = '3425bcb2-146a-4c6d-910d-e08eabebfeec';

                // Crear FormData con datos mínimos de prueba
                const formData = new FormData();
                formData.append('id', presetId);
                formData.append('item_id', itemId);
                formData.append('name', 'Test Preset Update');
                formData.append('description', 'Test description');
                formData.append('price', '29.99');
                formData.append('discount', '0');
                formData.append('sort_order', '1');
                formData.append('is_active', '1');
                
                // Configuración mínima del canvas
                const canvasConfig = {
                    width: 1000,
                    height: 1000,
                    dpi: 300,
                    background_color: '#ffffff',
                    format: 'JPEG',
                    quality: 90
                };
                formData.append('canvas_config', JSON.stringify(canvasConfig));

                // Configuración mínima de content layer
                const contentLayerConfig = {
                    x: 0,
                    y: 0,
                    width: 1000,
                    height: 1000,
                    rotation: 0,
                    opacity: 1,
                    blend_mode: 'normal',
                    fit_mode: 'cover',
                    allow_upload: true,
                    max_file_size: 10,
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif']
                };
                formData.append('content_layer_config', JSON.stringify(contentLayerConfig));

                const response = await fetch(`/api/admin/items/${itemId}/presets/${presetId}`, {
                    method: 'PUT',
                    body: formData,
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content'),
                    },
                });

                console.log('Response status:', response.status);
                console.log('Response headers:', [...response.headers.entries()]);

                const result = await response.text();
                console.log('Response body:', result);

                if (response.ok) {
                    try {
                        const jsonResult = JSON.parse(result);
                        resultDiv.innerHTML = `<div style="color: green;">
                            <h3>Success!</h3>
                            <pre>${JSON.stringify(jsonResult, null, 2)}</pre>
                        </div>`;
                    } catch (e) {
                        resultDiv.innerHTML = `<div style="color: green;">
                            <h3>Success (non-JSON response)!</h3>
                            <pre>${result}</pre>
                        </div>`;
                    }
                } else {
                    resultDiv.innerHTML = `<div style="color: red;">
                        <h3>Error ${response.status}</h3>
                        <pre>${result}</pre>
                    </div>`;
                }
            } catch (error) {
                console.error('Test error:', error);
                resultDiv.innerHTML = `<div style="color: red;">
                    <h3>Network Error</h3>
                    <pre>${error.message}</pre>
                </div>`;
            }
        }
    </script>
</body>
</html>
