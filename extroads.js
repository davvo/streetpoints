#!/usr/bin/env node

'use strict'

/*
$ ./extroads.js [options] bbox

$ ./extroads.js \
	--pg postgres://104.199.41.52/gis 
	11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
	> roads.geojson
*/

const pg = require('pg')
const mercator = require('globalmercator')
const args = require('minimist')(process.argv.slice(2))

const postgresUrl = args.pg || process.env.POSTGRES_URL || 'postgres://localhost:5432/gis'

let bbox
try {
	bbox = args._[0].split(',').map(parseFloat)
} catch (x) {
	console.error("Usage: extroads.js [options] <minLng,minLat,maxLng,maxLat>")
	console.error("Options:")
	console.error("--pg <postgres_url> (default=postgres://locahost:5432/gis)")
	process.exit(1)
}

const minMercator = mercator.latLonToMeters(bbox[1], bbox[0])
const maxMercator = mercator.latLonToMeters(bbox[3], bbox[2])
const bboxMercator = minMercator.concat(maxMercator)

const roadTypes = [
	'motorway', 
	'motorway_link',
	'trunk', 
	'trunk_link',
	'primary',
	'primary_link',
	'secondary',
	'secondary_link',
	'tertiary',
	'tertiary_link',
	'residential',
	'unclassified',
	'pedestrian',
	'living_street'
]

const query = 
	`
	SELECT ST_AsGeoJSON(way) AS geom FROM planet_osm_line 
	WHERE highway in (${roadTypes.map(type => "'" + type + "'" )}) 
	AND way && ST_MakeEnvelope(${bboxMercator.join(', ')}, 3857)
	`

const client = new pg.Client(postgresUrl)

client.connect(err => {
  if (err) throw err
  client.query(query, (err, result) => {
    if (err) throw err

	const geojson = {
		type: 'FeatureCollection',
		features: result.rows.map(row => {
			return ({
				type: 'Feature',
				properties: {},
				geometry: {
					type: 'LineString',
					coordinates: JSON.parse(row.geom).coordinates.map(coords => {
						return mercator.metersToLatLon(coords[0], coords[1]).reverse()
					})
				}
			})
		})
	}

	console.log(JSON.stringify(geojson, null, 2))

	client.end()
  })
})