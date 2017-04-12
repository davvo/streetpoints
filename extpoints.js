#!/usr/bin/env node

'use strict'

/*
$ ./extpoints [geojson_file]
$ ./extpoints roads.geojson > points.csv
$ cat roads.geojson | ./extpoints
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

const readInput = () => new Promise((resolve, reject) => {

	if (args._.length > 0) {
		return resolve(JSON.parse(fs.readFileSync(args._[0], 'utf8')))
	}

	let data = []
 	
 	process.stdin.on('readable', () => {
    	let chunk
    	while (chunk = process.stdin.read()) {
    		data.push(chunk)
    	}
  	})
 
 	process.stdin.on('end', () => {
		resolve(JSON.parse(Buffer.concat(data).toString('utf8')))
	})
})

const extractPoints = (geojson) => {
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

	return points
}

const print = (points) => {
	if (args.format === 'geojson') {
		printGeoJSON(points)
	} else {
		printCSV(points)
	}	
}

const printGeoJSON = (points) => {
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

const printCSV = (points) => {
	Array.from(points.values()).forEach((point, index) => {
		console.log([point[1], point[0]].join(';'))
	})
}

readInput().then(geojson => {
	const points = extractPoints(geojson)
	print(points)	
})
