//=======================================
// Analýza zájmového území v Google Earth Engine (GEE)
// Lekce: Time-series analýzy
// Autor: Stanislav Herber
//=======================================

//--------1) načtení katastrálního území - kraj

//Jako první je nutné převést shapefile do WGS84 (4326) a pak načíst poté:
//var katastr_WGS84 = ee.FeatureCollection("users/stanislavherber/katastr_WGS84");
Map.addLayer(kraj,{color:'Blue'},'Katastrální území');

//--------2) načtení kolekce sentinel-2 - vysvětlit, že jdou data přidávat i pomocí search baru + přidat ořez dle geometrie
// vysvětlit filtraci oblačnosti

var s2 = ee.ImageCollection("COPERNICUS/S2_SR")
  .filterBounds(kraj)
  .filterDate('2017-01-01', '2023-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));

//--------3) základní charakteristiky kolekce snímků

// Kolik je v kolekci snímků?
var count = s2.size();
print('Počet: ', count);

// Odkdy do kdy jsou k dispozici snímky?
var range = s2.reduceColumns(ee.Reducer.minMax(), ['system:time_start']);
print('Rozmezí: ', ee.Date(range.get('min')), ee.Date(range.get('max')));


//-------- zobrazení prvního snímku kolekce - vysvětlit proč se to dělá

//-------- zobrazení prvního snímku kolekce - změny pořadí bandů

//-------- výpočet vegetačních indexů - rozdíl mezi 1 snímkem a kolekcí

//-------- graf indexu v čase

//--------výpočet průměrných hodnot - vysvětlení reducers

//-------- Export průměrných hodnot NDVI indexu v hranici kraje

// Export průměrných hodnot NDVI podle let
Export.table.toDrive({
  collection: ndviByYear.map(function(image) {
    var mean = image.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: kraj.geometry(),
      scale: 10
    }).get('NDVI');
    return ee.Feature(null, {
      'year': image.get('year'),
      'mean_ndvi': mean
    });
  }),
  description: 'NDVI_mean_by_year',
  fileFormat: 'CSV'
});

//-------- Export průměrných hodnot NDVI indexu v případě kdybych měl více zájmových lokalit


//-------- vytvořit gif - nefunguje

////////////// POZOR BUDE FUNGOVAT POUZE PRO MALÁ ÚZEMÍ
// Vytvoření parametrů pro animaci
var ndviVis = {
  min: 0,
  max: 1,
  palette: ['white', 'green']
};

var animationParams = {
  dimensions: 500,
  region: katastr_WGS84.geometry(), // Use the original geometry
  framesPerSecond: 5,
  // Remove the 'crs' parameter
  min: ndviVis.min,
  max: ndviVis.max,
  palette: ndviVis.palette
};

// Vytvoření URL pro stažení GIFu
//var gifUrl = s2_ndvi.select('NDVI').getVideoThumbURL(animationParams);
//print('GIF URL:', gifUrl);

//-------- Úvod do change detection

//-------- Úvod do klasifikací obrazu v GEE - Spuštění řízené klasifikace Random Forest

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED');
var geometry = Kraj;
          
Map.centerObject(geometry);
 
// Filtrace kolekce Sentinel-2
var filtered = s2
.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
  .filter(ee.Filter.date('2019-01-01', '2020-01-01'))
  .filter(ee.Filter.bounds(geometry))
  .select('B.*');
 
// Vytvoření mediánu a ořez podle hranice kraje
var composite = filtered.median().clip(Kraj);
 
// Přidání do mapy
var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2']};
Map.addLayer(composite.clip(geometry), rgbVis, 'image');
 
// Vytvořte ručně trénovací (stačí 10 bodů pro každou třídu) (typ:feature collection)
// Nutné přidat atribut který určí typ povrchu ('landcover')
 
// zastavba: 0
// hola puda: 1
// voda: 2
// vegetace: 3
 
// Sloučení bodů do jedné třídy
 var body = zastavba.merge(holapuda).merge(voda).merge(vegetace);
 
 // Propsání hodnot S2 reflektance do bodů
 var training = composite.sampleRegions({
   collection: body, 
   properties: ['landcover'], 
   scale: 10,
   tileScale: 16
 });
 print(training);
 
// Trénování klasifikátoru
 var classifier = ee.Classifier.smileRandomForest(50).train({
   features: training,  
   classProperty: 'landcover', 
   inputProperties: composite.bandNames()
 });

 // Klasifikace snímku
 var classified = composite.classify(classifier);
 
 // Výběr 4-barevné palety 
 // Pro každou třídu ve správném pořadí určit barvu
 // zastavba, hola puda, voda, vegetace
 var palette = ['#d51414', '#ffc107', '#1e88e5', '#004d40' ];
 
 Map.addLayer(classified.clip(geometry), {min: 0, max: 3, palette: palette}, 'Klasifikovaný raster S2');

Map.centerObject(Kraj,11);

//-------- Use case - Land Cover analýza v zájmovém území a extrakce vodních ploch
// originální autor: Ujaval Ghandi

//-------- 1) Načtení dat
var worldcover = ee.ImageCollection("ESA/WorldCover/v100");

//-------- 2) Výběr zájmového území

//-------- 3) Vizualizace území - import zájmového území s názvem "kraj"
Map.centerObject(kraj, 10);
Map.addLayer(kraj, {color: 'black'}, 'Vybrané území');


//-------- 4) Výběr snímku WorldCover (rok 2020)
var classification = ee.Image(
  worldcover
    .filterDate('2020-01-01', '2021-01-01')
    .first()
).clip(kraj);

// v atributech vrstvy je Map_class_names s třídami pixelů
print(classification,'Snímek WorldCover pro rok 2020')

//-------- 5) Zobrazení pokryvu krajiny
var landcoverVis = {
  min: 10,
  max: 100,
  palette: [
    '#006400', '#ffbb22', '#ffff4c', '#f096ff', '#fa0000',
    '#b4b4b4', '#f0f0f0', '#0032c8', '#0096a0', '#00cf75',
    '#fae6a0'
  ]
};
Map.addLayer(classification, landcoverVis, 'Pokryv krajiny ESA 2020');

var classNames = classification.get('Map_class_names')
var classValues = classification.get('Map_class_values')
print(classNames)

//-------- 6) Výpis unikátních tříd
var landcoverValues = classification.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: kraj,
  scale: 10,
  maxPixels: 1e10
});
print('Frekvence tříd pokryvu krajiny:', landcoverValues);

//-------- 6b) Výpočet ploch jednotlivých tříd s názvy

// Přidání pásma plochy pixelů
var areaImage = ee.Image.pixelArea().addBands(classification);

// Výpočet sumy ploch podle třídy
var areas = areaImage.reduceRegion({
  reducer: ee.Reducer.sum().group({
    groupField: 1,  // klasifikační třída je v druhém pásmu (index 1)
    groupName: 'class'
  }),
  geometry: kraj,
  scale: 10,
  maxPixels: 1e10
});

// Načtení seznamu tříd s plochou
var classAreas = ee.List(areas.get('groups'));

// Získání názvů a hodnot tříd z metadat snímku
var names = ee.List(classification.get('Map_class_names'));
var values = ee.List(classification.get('Map_class_values'));

// Mapování názvů a výpis výsledků
var classAreaLists = classAreas.map(function(item) {
  item = ee.Dictionary(item);
  var classNumber = ee.Number(item.get('class'));
  var area = ee.Number(item.get('sum')).divide(1e4).round(); // plocha v hektarech
  var index = values.indexOf(classNumber);
  var className = names.get(index);
  return ee.String(className).cat(': ').cat(area.format()).cat(' ha');
});

print('Plochy tříd (s názvy):', classAreaLists);

//-------- 7) Export rastrového pokryvu na Drive
Export.image.toDrive({
  image: classification,
  description: 'ESA_WorldCover_Classification_',
  folder: 'earthengine',
  region: kraj,
  scale: 10,
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF'
});

//-------- 8) Výběr vodních pixelů (třída 80)
var water = classification.eq(80);
var waterVis = {min: 0, max: 1, palette: ['white', 'blue']};
Map.addLayer(water, waterVis, 'Vodní pixely');

//-------- 9) Převod vodních pixelů na polygony
var waterVectors = water.selfMask().reduceToVectors({
  reducer: ee.Reducer.countEvery(),
  geometry: kraj,
  scale: 10,
  maxPixels: 1e10,
  geometryType: 'polygon',
  eightConnected: false,
  labelProperty: 'water'
});
Map.addLayer(waterVectors, {color: 'blue'}, 'Vodní plochy - polygony');

//-------- 10) Export polygonů vodních ploch jako SHP
Export.table.toDrive({
  collection: waterVectors,
  description: 'Water_Polygons_Export_',
  folder: 'earthengine',
  fileNamePrefix: 'water_polygons_',
  fileFormat: 'SHP'
});

