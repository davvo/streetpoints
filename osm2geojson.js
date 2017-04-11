'use strict'

/*
node osm2geojson.js \
	--pg postgres://104.199.41.52/gis 
	--bbox 11.319694519042969,44.479850447910444,11.367416381835938,44.51070720877548 \
	> roads.geojson
*/

const pg = require('pg')
const mercator = require('globalmercator')
const args = require('minimist')(process.argv.slice(2))

const postgresUrl = args.pg || process.env.POSTGRES_URL
const bbox = args.bbox.split(',').map(parseFloat)

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

pg.connect(postgresUrl, (err, client, done) => {
	if (err) throw err
	client.query(query, (err, result) => {
		done()
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
							const latLng = mercator.metersToLatLon(coords[0], coords[1])
							return [latLng[1], latLng[0]]
						})
					}
				})
			})
		}

		console.log(JSON.stringify(geojson, null, 2))
		process.exit(0)
	})
})