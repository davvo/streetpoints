# streetpoints #

## Prerequisites ##
You need to have [NodeJS](https://nodejs.org/en/) installed. On mac you can use homebrew:

```
$ brew update
$ brew install node
```

## Install ##
```
$ git clone git@bitbucket.org:sodra/streetpoints.git
$ cd streetpoints
$ npm install
```

## Extract roads from osm ##
```
$ ./osm2geojson.js
  --pg <postgres_url> \
  --bbox <bbox>
```
### Example ###
Extract all roads around Bologna, Italy. Save output in roads.geojson.
```
$ ./osm2geojson.js \
  --pg postgres://localhost:5432 \
  --bbox 11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
  > roads.geojson
```

## Create points
```
$ ./geojson2csv.js [options] file
```

### Example ###
Create points csv from roads.geojson. Save output in points.csv.
```
$ ./geojson2csv.js roads.geojson > points.csv
```
Create points geojson from roads.geojson. Save output in points.geojson.
```
$ ./geojson2csv.js --format geojson roads.geojson > points.geojson
```