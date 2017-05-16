#!/usr/bin/env node

'use strict'

/*
$ ./extadmin.js \
	--pg postgres://104.199.41.52/gis \
	11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
	> admin.geojson
*/

const pg = require('pg')
const mercator = require('globalmercator')
const args = require('minimist')(process.argv.slice(2))

const postgresUrl = args.pg || process.env.POSTGRES_URL || 'postgres://localhost:5432/gis'

let bbox
try {
	bbox = args._[0].split(',').map(parseFloat)
} catch (x) {
	console.error("Usage: extadmin.js [options] <minLng,minLat,maxLng,maxLat>")
	console.error("Options:")
	console.error("--pg <postgres_url> (default=postgres://locahost:5432/gis)")
	process.exit(1)
}

const minMercator = mercator.latLonToMeters(bbox[1], bbox[0])
const maxMercator = mercator.latLonToMeters(bbox[3], bbox[2])
const bboxMercator = minMercator.concat(maxMercator)

const query = 
	`
	SELECT name, admin_level, ST_AsGeoJSON(way) AS geom FROM planet_osm_polygon 	
	WHERE boundary='administrative'
	AND name IS NOT null
	AND admin_level IN ('9', '10')	
	AND way && ST_MakeEnvelope(${bboxMercator.join(', ')}, 3857)
	`

const client = new pg.Client(postgresUrl)

client.connect(err => {
	if (err) {
		throw err
	}

	console.log('{ "type": "FeatureCollection", "features": [')

	const q = client.query(query)
  	q.on('row', (row) => {
		const geometry = JSON.parse(row.geom)
		if (geometry.type !== 'Polygon') {
			console.error("Skipping non polygon %s of type %s", row.name, geometry.type)
		}
		const feature = {
			type: 'Feature',
			properties: {
				name: row.name,
				level: parseInt(row.admin_level, 10)
			},
			geometry: {
				type: 'Polygon',
				coordinates: geometry.coordinates.map(rings => {
					return rings.map(coords => {
						return mercator.metersToLatLon(coords[0], coords[1]).reverse()						
					})
				})
			}
		}
		console.log(JSON.stringify(feature, null) + ',')
  	})

  	q.on('end', () => {
  		client.end()
  		console.log(']}')
  	})
})
