# streetpoints #

There are three scripts:

* extroads.js - Extract roads from an [OpenStreetMap](https://www.openstreetmap.org/) database and writes GeoJSON to stdout.
* extpoints.js - Extract points from a GeoJSON file (or reads from stdin) and writes CSV to stdout.
* extpoints2.js - Extract points from [OpenStreetMap](https://www.openstreetmap.org/) and writes CSV to stdout.

## Example usage ##
Extract roads from a local osm database
```
$ ./extroads.js 9.610956,45.724823,9.720132,45.656594 > bergamo.geojson

$ cat bergamo.geojson
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [
            9.604711110164414,
            45.677882607401145
          ],
          [
            9.605648771657979,
            45.67791668852832
          ],
          ...
       ]
    }
  }
}
```
Extract points from the resulting GeoJSON file
```
$ ./extpoints.js bergamo.geojson > bergamo.csv

$ cat bergamo.csv
45.677882607401145;9.604711110164414
45.67788912878708;9.604890530608568
45.677895650172275;9.605069951052723
45.67790217155668;9.605249371496875
...
45.71699802877114;9.720368461100207
45.71708844167464;9.720493000893168
45.71717885443186;9.720617540686126
45.717182801101096;9.720622977062568
```
The two scripts can be combined into one line
```
$ ./extroads.js 9.610956,45.724823,9.720132,45.656594 | ./extpoints.js
```

Extract points from a local osm database. The first argument should be a geojson file containing features of type Polygon (or MultiPolygon).
Only points that are contained by a polygon will be written to output. If the polygon has a "name"-property it will be written after the
coordinates.
```
$ ./extpoints2.js geojson/sthlm.geojson

59.326354;18.068223;Gamla stan
59.32633;18.068389;Gamla stan
59.326305;18.068554;Gamla stan
59.326457;18.068708;Gamla stan
59.326366;18.068714;Gamla stan
...
59.325556;18.145672;Djurgården
59.325636;18.145759;Djurgården
59.325237;18.145321;Djurgården
59.325156;18.145236;Djurgården
59.324906;18.146211;Djurgården
59.324863;18.146367;Djurgården
59.324779;18.146387;Djurgården
...
59.310212;18.045907;Södermalm
59.310268;18.046027;Södermalm
59.310328;18.046158;Södermalm
59.313984;18.034002;Södermalm
59.313452;18.032395;Södermalm

```

Filter input and specify an alternative name property. This example will only trace roads inside polygons where property NAME_3 is equal to Bergamo or Curno. It will also use the value from NAME_3 as name in the output.
```
$ ./extpoints2.js geojson/italy.geojson --filter NAME_3=Bergamo,Curno --name_property NAME_3

45.706291;9.645854;Bergamo
45.706415;9.645828;Bergamo
45.70654;9.645815;Bergamo
45.706664;9.64584;Bergamo
45.706788;9.64585;Bergamo
45.70691;9.645808;Bergamo
45.705679;9.64582;Bergamo
...
45.689185;9.603347;Curno
45.6892;9.602897;Curno
45.689272;9.603471;Curno
45.688732;9.602829;Curno
45.688853;9.602847;Curno
45.688961;9.602863;Curno
```

This example will trace roads that belong to the **province** of Bergamo
```
$ ./extpoints2.js geojson/italy.geojson --filter NAME_2=Bergamo --name_property NAME_3

45.705119;9.95441;Adrara San Martino
45.705179;9.954567;Adrara San Martino
45.705128;9.954576;Adrara San Martino
45.705015;9.954596;Adrara San Martino
45.704903;9.954617;Adrara San Martino
...
45.727559;9.964163;Adrara San Rocco
45.727571;9.963825;Adrara San Rocco
45.727678;9.964217;Adrara San Rocco
45.727796;9.964271;Adrara San Rocco
45.727915;9.964325;Adrara San Rocco
45.728033;9.964379;Adrara San Rocco
...
45.684115;9.765223;Albano Sant' Alessandro
45.684228;9.765287;Albano Sant' Alessandro
45.684344;9.765336;Albano Sant' Alessandro
45.684461;9.765386;Albano Sant' Alessandro
45.684578;9.765434;Albano Sant' Alessandro
...
```

## Getting data ##
* Administrative areas from the whole world can be downloaded at [www.gadm.org](http://www.gadm.org) (must be converted to geojson from e.g shapefile).
* Up-to-date areas (comune) for Italy can be found at [www.istat.it](http://www.istat.it/it/archivio/124086)
* [geojson.io](http://geojson.io) is a simple tool where you can draw polygons and save as geojson.

## Prerequisites ##
You need to have [NodeJS](https://nodejs.org/en/) (version 6 or higher) installed. On mac you can use homebrew

```
$ brew update
$ brew install node
```

You also need access to OpenStreetMap data loaded in PostgreSQL database. 

https://switch2osm.org/loading-osm-data/

## Install ##
```
$ git clone https://github.com/davvo/streetpoints.git
$ cd streetpoints
$ npm install
```
