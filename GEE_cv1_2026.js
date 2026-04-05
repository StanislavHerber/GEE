//=============================================================================
// Úvod do Google Earth Engine (GEE) – KRKONOŠE
// KOMPLETNÍ ZÁKLADY PRO PRVNÍ HODINU (10 SKRIPTŮ)
// Důležité: Před spuštěním Skriptu 6 MUSÍ být nakreslena Geometrie na mapě!
//=============================================================================

//-------------------------------------------------------------
// SKRIPT 1: ZÁKLADNÍ PROMĚNNÉ A VÝSTUP (KONZOLE)
//-------------------------------------------------------------

// 1. Definovani jednoduché textové proměnné (string)
var promenna = 'Můj první kód v GEE';

// 2. Definovani seznamu barev (pole/list)
var seznamBarev = ['modrá','zelená','červená'];

// 3. Zobrazení hodnot proměnných v KONSOLI (vpravo nahoře)
print('Zpráva pro konzoli:', 'Ahoj světe! Startujeme GEE.');
print(promenna);
print('Seznam pro mapu:', seznamBarev);

//-------------------------------------------------------------
// SKRIPT 2: NAČTENÍ A ZOBRAZENÍ PRVNÍCH RASTROVÝCH DAT (IMAGE)
//-------------------------------------------------------------

// 1. Načtení jednoho satelitního snímku (Image) - SRTM (Digitální model povrchu)
var vyskopis = ee.Image('CGIAR/SRTM90_V4');
print('Informace o snímku SRTM:', vyskopis);

// 2. Centrování mapy na oblast snímku (Krkonoše)
Map.setCenter(15.748, 50.75, 9); 

// 3. Vložení snímku do mapy (bez vizualizačních parametrů - defaultní zobrazení)
Map.addLayer(vyskopis, {}, '2. SRTM (Výchozí zobrazení)');

//-------------------------------------------------------------
// SKRIPT 3: VIZUALIZACE A JEJÍ ÚPRAVA (MIN, MAX, PALETA)
//-------------------------------------------------------------

// 1. Definice vizualizačních parametrů pro SRTM
var vizualizaceSRTM = {
  min: 200, 
  max: 1603, // Max. výška Sněžky
  palette: ['blue','green','red'] 
};

// 2. Vložení snímku do mapy s upravenou vizualizací
Map.addLayer(vyskopis, vizualizaceSRTM, '3. SRTM (Upravené barvy)');

//-------------------------------------------------------------
// SKRIPT 4: POUŽITÍ JEDNODUCHÉ FUNKCE GEE (VÝPOČET SKLONITOSTI)
//-------------------------------------------------------------

// 1. VÝPOČET: Vytvoření nového snímku (rasteru) sklonitosti
var sklonitost = ee.Terrain.slope(vyskopis);

// 2. Definice palety pro sklonitost
var vizSklonitost = {
  min: 0, 
  max: 60, 
  palette: ['440154', '29788E', '79D151', 'FDE724'] 
};

// 3. Vložení sklonitosti do mapy
Map.addLayer(sklonitost, vizSklonitost, '4. Model sklonitosti');

//-------------------------------------------------------------
// SKRIPT 5: MULTISPEKTRÁLNÍ DATA (LANDSAT 8) A RGB
//-------------------------------------------------------------

// 1. Načtení Landsat 8 Kolekce a filtrování na oblast Krkonoš
var landsatKolekce = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA')
    .filterBounds(ee.Geometry.Point(15.748, 50.75))
    .filterDate('2020-01-01', '2024-01-01')
    .sort('CLOUD_COVER'); 

// 2. Načtení jednoho spolehlivého snímku: Použijeme ten s nejmenší oblačností.
var landsat = landsatKolekce.first(); 
print('Nalezený snímek Landsat 8:', landsat);
Map.centerObject(landsat, 9); 

// 3. Parametry pro PŘIROZENÉ BARVY (True Color RGB) - B4, B3, B2
var vizRGB = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.05,
  max: 0.45,
};

// 4. Parametry pro INFRAČERVENÉ BARVY (Color Infrared) - B5, B4, B3
var vizInfrared = {
  bands: ['B5', 'B4', 'B3'],
  min: 0.05,
  max: 0.45,
};

// 5. Zobrazení
Map.addLayer(landsat, vizRGB, '5a. Landsat 8 - Přirozené barvy');
Map.addLayer(landsat, vizInfrared, '5b. Landsat 8 - Infračervené (vegetace)');

//-------------------------------------------------------------
// SKRIPT 6: DEFINOVÁNÍ GEOMETRIE, RUČNÍ KRESBA A OŘEZ RASTU (.clip())
//-------------------------------------------------------------

// 1. OŘEZ 1: Ořez sklonitosti pomocí polygonu definovaného v KÓDU (Nový formát)
var ctverec = ee.Geometry.Rectangle([15.4, 50.6, 16.0, 50.8])
var orezanaKodem = sklonitost.clip(ctverec);

// 2. Zobrazení ořezaného výsledku 1 (KÓD)
Map.addLayer(orezanaKodem, vizSklonitost, '6a. Ořez (Kódovaný Polygon)', true); 
Map.centerObject(ctverec, 12);

// ----------------------------------------------------------------------
// ❗ AKCE: Nyní musíte použít nástroj pro kreslení nad mapou a nakreslit si oblast.
// Tím se vytvoří proměnná 'geometry', která je použita níže.
// ----------------------------------------------------------------------

// 3. Nastavení pracovní AOI VÝHRADNĚ na ručně kreslenou geometrii
var AOI = geometry; 

// 4. OŘEZ 2: Ořez sklonitosti pomocí polygonu nakresleného RUČNĚ
var orezanaRucne = sklonitost.clip(AOI);

// 5. Zobrazení ořezaného výsledku 2 (RUČNĚ KRESLENÝ)
Map.addLayer(orezanaRucne, vizSklonitost, '6b. Ořez (Ručně Kreslený)');


//-------------------------------------------------------------
// SKRIPT 7: FILTROVÁNÍ KOLEKCE (ee.ImageCollection)
//-------------------------------------------------------------

// 1. Načtení celé KOLEKCE Landsat 8
var landsatKolekce = ee.ImageCollection('LANDSAT/LC08/C02/T1_TOA');

// 2. FILTROVÁNÍ KOLEKCE: Podle ČASU a PROSTORU (Použijeme ručně kreslenou AOI)
var filtrovanaKolekce = landsatKolekce
  .filterDate('2023-05-01', '2023-08-31') 
  .filterBounds(AOI); 

// 3. REDUKCE: Z kolekce vytvoříme jeden snímek (průměr hodnot pixelů)
var prumernySnimek = filtrovanaKolekce.mean();

// 4. Vizualizace průměrného snímku
var vizRGB_Kolekce = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.05,
  max: 0.45,
};
Map.addLayer(prumernySnimek, vizRGB_Kolekce, '7. Průměr Landsat 8 (Kompozit)');


//-------------------------------------------------------------
// SKRIPT 8: TVORBA GRAFU (HISTOGRAM HODNOT PIXELŮ NIR B5)
//-------------------------------------------------------------

// 1. Výběr pásma B5 (Near-Infrared, NIR) ze zprůměrovaného snímku
var nirBand = prumernySnimek.select('B5');

// 2. Vytvoření histogramu hodnot pásma B5
var histogram = ui.Chart.image.histogram({
  image: nirBand, 
  region: AOI,    
  scale: 30,      
  maxBuckets: 50  
})
.setOptions({
  title: '8. Histogram B5 (NIR) v AOI',
  hAxis: {title: 'Odrazivost (B5)'},
  vAxis: {title: 'Počet pixelů'},
});

// 3. Vykreslení grafu v KONSOLI
print(histogram);


//-------------------------------------------------------------
// SKRIPT 9: UKÁZKA GLOBÁLNÍCH TEMATICKÝCH VRSTEV (FOREST CHANGE)
//-------------------------------------------------------------

// 1. Načtení Globální mapy úbytku lesa
var gfc = ee.Image('UMD/hansen/global_forest_change_2024_v1_12');

// 2. POKRYV LESA V ROCE 2000

var treeCover2000 = gfc.select('treecover2000');

var treeCoverVis = {
  min: 0,
  max: 100,
  palette: ['black', 'green']
};

Map.addLayer(treeCover2000, treeCoverVis, 'Tree cover 2000');

// 3. ROK ÚBYTKU LESA

var lossYear = gfc.select('lossyear');

var lossYearVis = {
  min: 1,
  max: 24,
  palette: [
    '#ffffcc', '#c2e699', '#78c679',
    '#31a354', '#006837'
  ]
};


Map.addLayer(lossYear, lossYearVis, 'Forest loss year');


// 4. Centrovat na AOI (např. Krkonoše)
Map.centerObject(AOI, 9);


//-------------------------------------------------------------
// SKRIPT 10: VIZUALIZACE DAT V RUZNYCH ROZLISENICH
//-------------------------------------------------------------

// SENTINEL-2 (10 m)

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(AOI)
  .filterDate('2023-06-01', '2023-08-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median();

var vizS2 = {
  bands: ['B4', 'B3', 'B2'],
  min: 0,
  max: 3000
};

Map.addLayer(s2, vizS2, 'Sentinel-2 RGB (10 m)');

// LANDSAT 8 (30 m)

// 1. Funkce pro aplikaci scale faktorů (L2 produkt)
function applyScaleFactors(image) {
  var opticalBands = image
    .select('SR_B.*')
    .multiply(0.0000275)
    .add(-0.2);

  var thermalBands = image
    .select('ST_B.*')
    .multiply(0.00341802)
    .add(149.0);

  return image
    .addBands(opticalBands, null, true)
    .addBands(thermalBands, null, true);
}

// 2. Načtení kolekce Landsat 8 L2
var l8 = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(AOI)
  .filterDate('2023-06-01', '2023-08-31')
  .map(applyScaleFactors)   // ⬅️ KLÍČOVÝ ŘÁDEK
  .median();

var vizL8 = {
  bands: ['SR_B4', 'SR_B3', 'SR_B2'],
  min: 0,
  max: 0.3
};

Map.addLayer(l8, vizL8, 'Landsat 8 RGB (30 m)');


// MODIS (250 m)


var modis = ee.ImageCollection('MODIS/061/MCD43A4')
  .filterBounds(AOI)
  .filterDate('2018-04-01', '2018-06-01')
  .median();

// Výběr pásma pro TRUE COLOR (RGB)
var modisRGB = modis.select([
  'Nadir_Reflectance_Band1', // Red
  'Nadir_Reflectance_Band4', // Green
  'Nadir_Reflectance_Band3'  // Blue
]);

// Vizualizace
var vizMODIS = {
  min: 0,
  max: 4000,
  gamma: 1.4
};

Map.addLayer(modisRGB, vizMODIS, 'MODIS RGB (500 m)');