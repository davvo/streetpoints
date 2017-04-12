# streetpoints #

There are two scripts:

* extroads.js - Extract roads from an [OpenStreetMap](https://www.openstreetmap.org/) database to a GeoJSON file.
* extpoints.js - Extract points from the GeoJSON file.

## Example usage ##
Extract roads from a local osm database
```
$ ./extroads.js \
  --pg postgres://localhost:5432/gis \
  9.610956,45.724823,9.720132,45.656594 \
  > bergamo.geojson

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

$ cat bergamp.csv
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
$ ./extroads.js \
  --pg postgres://localhost:5432/gis \
  9.610956,45.724823,9.720132,45.656594 \
  | ./extpoints.js
```

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
$ git clone git@bitbucket.org:sodra/streetpoints.git
$ cd streetpoints
$ npm install
```