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
  --bbox minLng,minLat,maxLng,maxLat \
  > roads.geojson
```