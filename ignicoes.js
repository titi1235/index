// 🔹 Camadas Base (Mapa Padrão e Ortofotomapa)
const osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
});

const ortofotoLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles © Esri, Source: Esri, Maxar, Earthstar Geographics, USDA'
});

// 🔹 Define o mapa e adiciona a camada base inicial (OSM)
const map = L.map('map', { 
    center: [41.8921, -8.5167], 
    zoom: 9,
    layers: [osmLayer]  // OSM será a camada padrão ao iniciar
});

// 🔹 Definição das camadas base disponíveis no controle de camadas
const baseMaps = {
    "🗺️ Mapa Base (OSM)": osmLayer,
    "🛰️ Ortofotomapa (Satélite)": ortofotoLayer
};

// Adição da Orientação (Rosa dos Ventos)
var north = L.control({ position: "topright" });


// 🔹 Camadas de Sobreposição (Minho, Concelhos e Freguesias)
const minhoLayer = L.geoJSON(minho, { color: "#000000", weight: 3, fillOpacity: 0 });
const concelhoLayer = L.geoJSON(concelho, { color: "#0000FF", weight: 2, fillOpacity: 0 });
const freguesiaLayer = L.geoJSON(freguesia, { color: "#008000", weight: 2, fillOpacity: 0 });

// 🔹 Marcadores do Google Maps com Street View
const streetViewIframe_1 = `<iframe width="400" height="300" 
    src="https://www.google.com/maps/embed?pb=!4v1738592990116!6m8!1m7!1sCAoSLEFGMVFpcFAwcXYdmkyWFBadXFhSVFTRmtFcVFnUDExZlN6M0t5WUtLbTF3!2m2!1d41.786888!2d-8.754886!3f195.14776559203548!4f-15.152785071015032!5f0.7820865974627469" 
    style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

const streetViewIframe_2 = `<iframe width="400" height="300" 
    src="https://www.google.com/maps/embed?pb=!4v1738619515740!6m8!1m7!1sCAoSLEFGMVFpcE8zWWJ4VmhkSm14VTdrS1hFRjQ2VGtXSFRXT1djRU1FdHZtcnRZ!2m2!1d41.72737249117186!2d-8.842769658431491!3f359.95354329869076!4f-26.555876558076555!5f0.7820865974627469" 
    style="border:0;" allowfullscreen="" loading="lazy"></iframe>`;

// 🔹 Criando marcadores no mapa
const googleMapsMarker_1 = L.marker([41.786888, -8.754886]).bindPopup(streetViewIframe_1, { maxWidth: 450 });
const googleMapsMarker_2 = L.marker([41.727372, -8.842770]).bindPopup(streetViewIframe_2, { maxWidth: 450 });

// 🔹 Grupo de camadas para os pontos do Google Maps
const googleMapsLayer = L.layerGroup([googleMapsMarker_1, googleMapsMarker_2]);

// 🔹 Definição das camadas de sobreposição no controle de camadas
const overlayMaps = {
    "⚫ Minho": minhoLayer,
    "🔵 Concelhos": concelhoLayer,
    "🟢 Freguesias": freguesiaLayer,
    "📍 Lugares Google Maps": googleMapsLayer
};



// 🔹 Adiciona a camada inicial de Minho ao mapa
minhoLayer.addTo(map);

// 🔹 Objeto para armazenar camadas de pontos de ignição por ano
const ignicaoLayers = {};

// 🔹 Criando as camadas de pontos de ignição por ano (2003-2023)
for (let year = 2003; year <= 2023; year++) {
    ignicaoLayers[`Pontos de Ignição de ${year}`] = L.geoJSON(ignicao1, {
        filter: (feature) => feature.properties.anos == year,
        pointToLayer: (feature, latlng) => L.circleMarker(latlng, { 
            radius: 5, fillColor: "#ff0000", color: "#000000", weight: 1, opacity: 1, fillOpacity: 0.8 
        }),
        onEachFeature: (feature, layer) => {
            let date = new Date(feature.properties.DataHoraAl);
            let popupContent = `<b>Ano:</b> ${feature.properties.anos}<br>
                                <b>Data:</b> ${date.toLocaleDateString('pt-PT')}<br>
                                <b>Hora:</b> ${feature.properties.hora_dura}<br>
                                <b>Concelho:</b> ${feature.properties.Concelho}<br>
                                <b>Freguesia:</b> ${feature.properties.Freguesia}<br>
                                <b>Tipo de Causa:</b> ${feature.properties.TipoCausa}<br>
                                <b>Descrição:</b> ${feature.properties.DescricaoC}`;
            layer.bindPopup(popupContent);
        }
    });
}
// 🔹 Criando um cluster para os pontos de ignição do ano de 2023
const cluster2023 = L.markerClusterGroup();
ignicao1.features.forEach(feature => {
    if (feature.properties.anos == 2023) {
        let latlng = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
        let marker = L.marker(latlng).bindPopup(
            `<b>Ano:</b> ${feature.properties.anos}<br>
             <b>Data:</b> ${new Date(feature.properties.DataHoraAl).toLocaleDateString('pt-PT')}<br>
             <b>Hora:</b> ${feature.properties.hora_dura}<br>
             <b>Concelho:</b> ${feature.properties.concelho}<br>
             <b>Freguesia:</b> ${feature.properties.freguesia}<br>
             <b>Tipo de Causa:</b> ${feature.properties.TipoCausa}<br>
             <b>Descrição:</b> ${feature.properties.DescricaoC}`
        );
        cluster2023.addLayer(marker);
    }
});
// 🔹 Adicionando o cluster de 2023 ao controle de camadas
overlayMaps["🔥 Cluster de Ignições 2023"] = cluster2023;

// 🔹 Adicionando as camadas ao controle de camadas
for (let year = 2003; year <= 2023; year++) {
    overlayMaps[`Pontos de Ignição de ${year}`] = ignicaoLayers[`Pontos de Ignição de ${year}`];
} 

// 🔹 Controle Deslizante para Alternar entre os Anos
let currentYear = 2003;
function updateMap() {
    document.getElementById('yearLabel').textContent = currentYear;
    
    // Remove todas as camadas antes de adicionar a do ano selecionado
    Object.values(ignicaoLayers).forEach(layer => map.removeLayer(layer));

    // Adiciona a camada do ano atual ao mapa
    if (ignicaoLayers[`Pontos de Ignição de ${currentYear}`]) {
        ignicaoLayers[`Pontos de Ignição de ${currentYear}`].addTo(map);
    }
}
document.getElementById('yearSlider').addEventListener('input', function () {
    currentYear = parseInt(this.value);
    updateMap();
});

// 🔹 Lista global de pontos de ignição para o heatmap
let allHeatmapPoints = [];

// 🔹 Coletar todos os pontos de ignição de 2003 a 2023
for (let year = 2003; year <= 2023; year++) {
    let yearPoints = ignicao1.features
        .filter(feature => feature.properties.anos == year)
        .map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0], 0.5]); // [lat, lng, intensidade]

    allHeatmapPoints = allHeatmapPoints.concat(yearPoints);
}

// 🔹 Criar a camada de Heatmap
const heatmapLayer = L.heatLayer(allHeatmapPoints, {
    radius: 20, 
    blur: 15, 
    maxZoom: 12, 
    gradient: { 
        0.2: 'blue', 
        0.4: 'cyan', 
        0.6: 'yellow', 
        0.8: 'orange', 
        1.0: 'red' 
    }
});

// 🔹 Adicionar o Heatmap ao controle de camadas
overlayMaps[" Heatmap de Ignição"] = heatmapLayer;

L.control.layers(baseMaps, overlayMaps).addTo(map);

// 🔹 Variáveis para controle da animação do slider
let interval; // Variável para armazenar o intervalo da animação
let isPlayingAnimation = false; // Estado da animação

// 🔹 Função para avançar um ano na animação
function nextYear() {
    if (currentYear < 2023) {
        currentYear++; // Avança um ano
    } else {
        // Se chegar ao último ano, para a animação
        clearInterval(interval);
        document.getElementById('playPauseBtn').innerText = '▶️'; // Ícone Play
        isPlayingAnimation = false;
        document.getElementById('resetBtn').style.display = 'inline'; // Exibe o botão de reset
    }
    document.getElementById('yearSlider').value = currentYear; // Atualiza o slider
    updateMap(); // Atualiza o mapa com os dados do novo ano
}

// 🔹 Função para iniciar ou pausar a animação do slider
function togglePlayPause() {
    if (isPlayingAnimation) {
        clearInterval(interval); // Para a animação
        document.getElementById('playPauseBtn').innerText = '▶️'; // Muda para Play
    } else {
        interval = setInterval(nextYear, 1000); // Avança um ano por segundo
        document.getElementById('playPauseBtn').innerText = '⏸️'; // Muda para Pause
    }
    isPlayingAnimation = !isPlayingAnimation; // Alterna estado da animação
}

// 🔹 Função para retroceder um ano no slider
function prevYear() {
    if (currentYear > 2003) {
        currentYear--; // Retrocede um ano
    }
    document.getElementById('yearSlider').value = currentYear; // Atualiza o slider
    updateMap(); // Atualiza o mapa
}

// 🔹 Eventos dos botões de controle do slider
document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
document.getElementById('nextBtn').addEventListener('click', nextYear);
document.getElementById('prevBtn').addEventListener('click', prevYear);

// 🔹 Evento do botão de reset para voltar ao ano inicial (2003)
document.getElementById('resetBtn').addEventListener('click', function () {
    currentYear = 2003; // Define o ano inicial
    document.getElementById('yearSlider').value = currentYear; // Atualiza o slider
    updateMap(); // Atualiza o mapa
    document.getElementById('resetBtn').style.display = 'none'; // Esconde o botão de reset
});

// 🔹 Inicializa o mapa exibindo os dados do primeiro ano (2003)
updateMap();


document.addEventListener('DOMContentLoaded', function() {
    const buttons = document.querySelectorAll('.buttonanimation-container button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', function() {
        const title = this.getAttribute('title');
        const popup = document.createElement('div');
        popup.className = 'popup';
        popup.innerText = title;
        document.body.appendChild(popup);
        const rect = this.getBoundingClientRect();
        popup.style.left = `${rect.left + window.scrollX + rect.width / 2 - popup.offsetWidth / 2}px`;
        popup.style.top = `${rect.top + window.scrollY - popup.offsetHeight - 10}px`;
      });
      button.addEventListener('mouseleave', function() {
        const popup = document.querySelector('.popup');
        if (popup) {
          popup.remove();
        }
      });
    });
  });