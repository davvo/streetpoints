#!/usr/bin/env node

'use strict'

/*
$ ./extpoints [geojson_file]
$ ./extpoints roads.geojson > points.csv
$ cat roads.geojson | ./extpoints
*/

const fs = require('fs')
const args = require('minimist')(process.argv.slice(2))
const trace = require('./lib/trace')

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
	const points = trace(geojson)
	print(points)	
})
