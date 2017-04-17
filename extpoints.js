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
const lineIntersect = require('line-intersect')
const args = require('minimist')(process.argv.slice(2))

// Find a point at a certain distance of a linestring
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

// Calculate length (in meters) of one line segment
const segLength = (a, b) => {
	const ma = mercator.latLonToMeters(a[1], a[0])
	const mb = mercator.latLonToMeters(b[1], b[0])
	return Math.sqrt(Math.pow(mb[0] - ma[0], 2) + Math.pow(mb[1] - ma[1], 2))	
}

// Calculate length (in meters) of linestring
const lineStringLength = (coords) => {
	let length = 0
	for (let i = 0; i < coords.length - 1; i++) {
		length += segLength(coords[i], coords[i + 1])
	}
	return length
}

// Read input from file or stdin
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

// Find crossroads
const findIntersections = (geojson) => {
	const segments = rbush()

	// Add all road segments to spatial index
	geojson.features.forEach((feature, index) => {
		const coords = feature.geometry.coordinates
		for (let i = 0; i < coords.length - 1; i++) {
			const a = mercator.latLonToMeters(coords[i][1], coords[i][0])
			const b = mercator.latLonToMeters(coords[i + 1][1], coords[i + 1][0])
			segments.insert({
				minX: Math.min(a[0], b[0]),
				minY: Math.min(a[1], b[1]),
				maxX: Math.max(a[0], b[0]),
				maxY: Math.max(a[1], b[1]),
				road: index,
				a, b
			})
		}
	})

	const points = []

	// Iterate segments and find points where two different roads intersect
	segments.all().forEach(item => {
		segments.search(item).forEach(other => {
			if (item.road === other.road) {
				return
			}
			const result = lineIntersect.checkIntersection(
				item.a[0], item.a[1], item.b[0], item.b[1],
				other.a[0], other.a[1], other.b[0], other.b[1]
			)
			if (result.type === 'intersecting') {
				points.push(mercator.metersToLatLon(result.point.x, result.point.y).reverse())
			}
		})
	})

	return points
}

// Extract points from feature collection of linestrings (roads)
const extractPoints = (geojson) => {
	const points = rbush()

	// Add a point if it not collides with another (already added) point.
	const addPoint = (coords) => {
		const m = mercator.latLonToMeters(coords[1], coords[0])
		if (points.search({
			minX: m[0] - 5,
			minY: m[1] - 5,
			maxX: m[0] + 5,
			maxY: m[1] + 5
		}).length === 0) {
			points.insert({
				minX: m[0],
				minY: m[1],
				maxX: m[0],
				maxY: m[1],
				point: coords
			})
		}
	}

	// Find all crossroads
	findIntersections(geojson).forEach(point => addPoint(point))

	// Find start and stop for every road
	geojson.features.forEach(feature => {
		const coords = feature.geometry.coordinates
		addPoint(coords[0])
		addPoint(coords[coords.length - 1])
	})

	// Trace roads (max 20 meters / step)
	geojson.features.forEach(feature => {
		const coords = feature.geometry.coordinates

		const length = lineStringLength(coords)
		const num = Math.ceil(length / 20)
		const step = length / num

		for (let i = 1; i < num; i++) {
			const point = pointAtDistance(coords, i * step)
			addPoint(point)
		}
	})

	return points.all().map(item => item.point)
}

// Print ouput
const print = (points) => {
	if (args.format === 'geojson') {
		printGeoJSON(points)
	} else {
		printCSV(points)
	}	
}

// Print ouput as geojson
const printGeoJSON = (points) => {
	console.log(JSON.stringify({
		type: 'FeatureCollection',
		features: points.map((point, index) => {
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

// Print output as CSV
const printCSV = (points) => {
	points.forEach((point, index) => {
		console.log([point[1], point[0]].join(';'))
	})
}

// Let's do this!
readInput().then(geojson => {
	const points = extractPoints(geojson)
	print(points)	
})
