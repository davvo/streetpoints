#!/usr/bin/env node

'use strict'

const fs = require('fs')
const pg = require('pg')
const async = require('async')
const flatten = require('geojson-flatten')
const bbox = require('geojson-bbox')
const inside = require('point-in-polygon')
const mercator = require('globalmercator')
const args = require('minimist')(process.argv.slice(2))
const trace = require('./lib/trace')

const makeArray = v => (v ? (Array.isArray(v) ? v : [v]) : [])

const filters = {}
makeArray(args.filter).forEach(term => {
  const split = term.split('=')
  const name = split[0]
  const values = split[1]
  filters[name] = values.split(',')
})

// Return true if feature matches filter
const isMatch = feature =>
  Object.keys(filters).every(name => {
    return filters[name].some(value => feature.properties[name] === value)
  })

// Trace all roads inside features geometry (polygon)
const processOne = (feature, callback) => {
  const bounds = bbox(feature)
  const minMercator = mercator.latLonToMeters(bounds[1], bounds[0])
  const maxMercator = mercator.latLonToMeters(bounds[3], bounds[2])
  const bboxMercator = minMercator.concat(maxMercator)

  // Add/remove type of roads. For example maybe motorway can be removed?
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
    'living_street',
    'service'
  ]

  const query = `
		SELECT name, ST_AsGeoJSON(way) AS geom FROM planet_osm_line 
		WHERE highway in (${roadTypes.map(type => "'" + type + "'")}) 
		AND way && ST_MakeEnvelope(${bboxMercator.join(', ')}, 3857)
		`
  const client = new pg.Client(args.pg || 'postgres://localhost:5432/gis')

  client.connect(err => {
    if (err) {
      return callback(err)
    }

    client.query(query, (err, result) => {
      if (err) {
        return callback(err)
      }

      // get roads as LineStrings
      const features = result.rows.map(row => {
        return {
          type: 'Feature',
          properties: {
            name: row.name
          },
          geometry: {
            type: 'LineString',
            coordinates: JSON.parse(row.geom).coordinates.map(coords => {
              return mercator.metersToLatLon(coords[0], coords[1]).reverse()
            })
          }
        }
      })

      // Trace roads and write points to stdout. Only write point
      // if it is inside polygon
      trace({ features })
        .filter(({ point }) => {
          return inside(point, feature.geometry.coordinates[0])
        })
        .forEach(({ point, name = '' }) => {
          const lng = Math.round(point[0] * 1e6) / 1e6
          const lat = Math.round(point[1] * 1e6) / 1e6
          const city = feature.properties[args.name_property || 'name']
          console.log([lat, lng, name, city].join(';'))
        })

      client.end()
      callback()
    })
  })
}

// Load input file
const areas = JSON.parse(fs.readFileSync(process.argv[2]), 'utf8')

// Filter features and flatten geometries
const features = []
areas.features.filter(isMatch).forEach(feature => {
  flatten(feature).forEach(flat => {
    features.push(flat)
  })
})

// Process all features
async.eachSeries(features, processOne, err => {
  if (err) {
    throw err
  }
  console.error('Done')
})
