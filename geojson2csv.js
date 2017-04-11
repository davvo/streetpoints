'use strict'

/*
node geojson2csv.js roads.geojson > out.csv
*/

const fs = require('fs')
const rbush = require('rbush')
const mercator = require('globalmercator')
const args = require('minimist')(process.argv.slice(2))

const pointAtDistance = (coords,  distance) => {
	let soFar = 0
	for (let i = 0; i < coords.length - 1; i++) {
		const a = mercator.latLonToMeters(coords[i][1], coords[i][0])
		const b = mercator.latLonToMeters(coords[i + 1][1], coords[i + 1][0])
		const length = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2))
		if (distance < soFar + length) {
			let v = Math.atan2(b[1] - a[1], b[0] - a[0])
			const x = a[0] + (distance - soFar) * Math.cos(v)
			const y = a[1] + (distance - soFar) * Math.sin(v)
			return mercator.metersToLatLon(x, y).reverse()
		}
		soFar += length
	}	
}

const geojson = JSON.parse(fs.readFileSync(args._[0], 'utf8'))

const points = new Map()

const addPoint = (coords) => {
	points.set(coords.join(','), coords)
}

// Find points on roads
geojson.features.forEach(feature => {
	const coords = feature.geometry.coordinates

	let distance = 0
	while (true) {
		const point = pointAtDistance(coords, distance)
		if (!point) {
			break
		}
		addPoint(point)
		distance += 20
	}
	addPoint(coords[coords.length - 1])
})

const toGeoJSON = () => {
	console.log(JSON.stringify({
		type: 'FeatureCollection',
		features: Array.from(points.values()).map((point, index) => {
			return {
				type: 'Feature',
				id: index,
				properties: {},
				geometry: {
					type: 'Point',
					coordinates: point
				}
			}		
		})
	}, null, 2))
}

const toCSV = () => {
	Array.from(points.values()).forEach((point, index) => {
		console.log([index, point[1], point[0]].join(','))
	})
}

if (args.format === 'geojson') {
	toGeoJSON()
} else {
	toCSV()
}

