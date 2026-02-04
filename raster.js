// Inicializa o mapa no elemento com id "map2" com novas coordenadas e zoom 15
const map2 = L.map('map2', { center: [41.767872, -8.610808], zoom: 14 });

// Adiciona a camada base do OpenStreetMap
var openStreetMapLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
  attribution: '© OpenStreetMap' 
}).addTo(map2);

// Adiciona a camada base do Ortofotomapa
var ortofotoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
});

// Adiciona a camada base do Topográfico
var topoMapLayer = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenTopoMap'
});

// Adiciona a escala ao mapa
L.control.scale().addTo(map2);

// Define um tamanho fixo para os quadrados (em graus de latitude/longitude)
const squareSize = 0.0005; // Ajuste conforme necessário

// Criar objeto para armazenar as camadas no controle de camadas
var overlayLayers = {};

// 🔥 Função para converter "rgb(56, 168, 0)" para "rgb(56,168,0)"
function parseRGB(rgbString) {
    if (!rgbString || typeof rgbString !== "string") return "rgb(255,255,255)"; // Branco padrão se o valor for inválido
    
    // Remove "rgb(" e ")" e divide os valores
    const rgbValues = rgbString.replace(/rgb\(|\)/g, "").split(",").map(v => parseInt(v.trim(), 10));

    // Verifica se os valores são válidos (entre 0 e 255)
    if (rgbValues.length === 3 && rgbValues.every(v => !isNaN(v) && v >= 0 && v <= 255)) {
        return `rgb(${rgbValues[0]}, ${rgbValues[1]}, ${rgbValues[2]})`;
    } else {
        console.warn(`Valor de cor inválido: ${rgbString}`);
        return "rgb(255,255,255)"; // Cor padrão branca se houver erro
    }
}

// 🔥 Função genérica para criar camadas com cores sólidas e pop-ups
function createLayer(data, colorField) {
    var seenCoordinates = new Set();

    return L.geoJSON(data, {
        pointToLayer: function (feature, latlng) {
            // Arredonda as coordenadas para alinhar os quadrados a uma grade
            const roundedLat = Math.round(latlng.lat / squareSize) * squareSize;
            const roundedLng = Math.round(latlng.lng / squareSize) * squareSize;

            const key = `${roundedLat},${roundedLng}`;
            if (seenCoordinates.has(key)) {
                return null; // Ignora pontos que já possuem um quadrado
            }
            seenCoordinates.add(key);

            // Obtém a cor do campo correspondente e converte para formato CSS
            const fillColor = parseRGB(feature.properties[colorField]);

            // Define os limites do quadrado
            const bounds = [
                [roundedLat - squareSize / 2, roundedLng - squareSize / 2],
                [roundedLat + squareSize / 2, roundedLng + squareSize / 2]
            ];

            let rect = L.rectangle(bounds, {
                color: "#d3d3d3", // Cinza claro para os limites entre células
                weight: 0.5, // Reduz o contorno para suavizar o efeito visual
                fillColor: fillColor, // Cor baseada no campo específico
                fillOpacity: 1 // 🔥 Cores 100% sólidas
            });

            // 🛠️ Adiciona pop-up com informações da célula
            rect.bindPopup(`
                <strong>Hipsometria:</strong> ${feature.properties.altitude ?? 'Não disponível'}<br>
                <strong>Declives:</strong> ${feature.properties.declive ?? 'Não disponível'}<br>
                <strong>Exposição de vertentes:</strong> ${feature.properties.aspect ?? 'Não disponível'}<br>
                <strong>Percentagem de cobertura de copas:</strong> ${feature.properties.copas ?? 'Não disponível'}<br>
                <strong>Modelo de Combustível:</strong> ${feature.properties.mod ?? 'Não disponível'}
            `);

            return rect;
        }
    });
}

// Verifica se a variável 'raster' está definida antes de adicionar as camadas
if (typeof raster !== 'undefined' && raster) {
    var hipsometriaLayer = createLayer(raster, "cor_mdt");
    var declivesLayer = createLayer(raster, "cor_slope");
    var exposicaoVertentesLayer = createLayer(raster, "cor_aspect");
    var coberturaCopasLayer = createLayer(raster, "cor_copas");
    var modeloCombustivelLayer = createLayer(raster, "cor_mod");

    // 🔥 Adicionar camadas ao controle de camadas
    overlayLayers["Hipsometria"] = hipsometriaLayer;
    overlayLayers["Declives"] = declivesLayer;
    overlayLayers["Exposição de Vertentes"] = exposicaoVertentesLayer;
    overlayLayers["Percentagem de Cobertura de Copas"] = coberturaCopasLayer;
    overlayLayers["Modelo de Combustível"] = modeloCombustivelLayer;
} else {
    console.warn("A variável 'raster' não está definida ou está vazia.");
}

// 🔥 Carrega a camada Santa.geojson dinamicamente
fetch('santa.geojson')
    .then(response => response.json())
    .then(data => {
        var santaLayer = L.geoJSON(data, {
            style: function (feature) {
                return {
                    color: "#000000", // Preto para o contorno
                    weight: 2, // Espessura da linha
                    fillColor: "transparent", // Remove o preenchimento
                    fillOpacity: 0 // Garante que o preenchimento seja transparente
                };
            }
        }).addTo(map2);

        // 🔥 Adiciona a camada "Santa Comba" ao controle de camadas
        overlayLayers["Santa Comba"] = santaLayer;

        // 🔥 Atualiza o controle de camadas com todas as camadas disponíveis
        L.control.layers({
            "OpenStreetMap": openStreetMapLayer,
            "Ortofotomapa": ortofotoMapLayer,
            "Topográfico": topoMapLayer
        }, overlayLayers).addTo(map2);
    })
    .catch(error => console.error("Erro ao carregar santa.geojson:", error));
