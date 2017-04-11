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
./osm2geojson.js \
  --pg <postgres_url> \
  --bbox <bbox>
```
### Example ###
Extract all roads around Bologna, Italy. Save output in roads.geojson.
```
./osm2geojson.js \
  --pg postgres://localhost:5432 \
  --bbox 11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
  > roads.geojson
```