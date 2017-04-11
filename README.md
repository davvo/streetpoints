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
  --pg postgres://104.199.41.52/gis \
  --bbox 11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
  > roads.geojson
```