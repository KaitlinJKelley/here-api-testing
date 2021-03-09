console.log("Welcome to the main module")

// Step 1. User inputs origin and destination addresses into route form
//  Use HERE GeoCoding and Search API to convert street addresses to lat/long pair
let origin = []
let destination = []
const getLatLong = (address) => {
    return fetch (`https://geocode.search.hereapi.com/v1/geocode?q=${address}&apiKey=mkvFOiCVql51ufvvBHkEumYGNOj09UcGP7n5yVJ2sD8`)
    .then(res => res.json())    
}

// HERE Router API creates path from origin to destination
let directions = []
const getDirections = (origin, destination) => {
    // debugger
    return fetch (`https://router.hereapi.com/v8/routes?transportMode=car&origin=${Object.values(origin)}&destination=${Object.values(destination)}&return=polyline,turnbyturnactions&apikey=mkvFOiCVql51ufvvBHkEumYGNOj09UcGP7n5yVJ2sD8`)
    .then(res => res.json())
    .then(res => directions = res) 
}

const getRouteStreetNames = (route) => {
    console.log("turn by turn",route.routes[0].sections[0].turnByTurnActions)
    // Stores an array of action objects
    const turnByTurnDirections = route.routes[0].sections[0].turnByTurnActions
    // Stores only the key/value pairs that start with "name" or "number"
    //NOTE: Add  || key.includes('number') back to filter of only street names doesn't work
    // debugger

    const filteredStreetNames = turnByTurnDirections.map((actionObj) => Object.fromEntries(Object.entries(actionObj.nextRoad).filter(([key, value]) => key.includes('name') || key.includes('number'))))
    console.log("filtered street names", filteredStreetNames)
    const streetNames = filteredStreetNames.filter(name => name.name !== undefined)
    console.log("street names", streetNames)
    // Removes action of "arriving"
    streetNames.splice(-1)
    console.log("street names post splice",streetNames)
    // NOTE: Add back in if only street names doesn't work
    // if the key is called "number", rename it to "name", so all properties are consistent
    const consistentStreetNames = streetNames.map(nameObj => nameObj.number ? nameObj.name = nameObj.number : nameObj.name = nameObj.name)
    console.log("consistent street names", streetNames)
    // NOTE: Took this section out when I decided to keep the highway numbers; now there are no empty object
    // Define new array that doesn't contain empty objects
    const streetNamesWithoutEmptyObjects = []
    // streetNames.map(nameObj => nameObj.hasOwnProperty("name") ? streetNamesWithoutEmptyObjects.push(nameObj) : nameObj)
    console.log(streetNamesWithoutEmptyObjects)
    // Just street names
    console.log("consistent street names",consistentStreetNames)
    const finalStreetNames = consistentStreetNames.map(streetNameObj => streetNameObj[0].value)
    // Creates a new set of street names where each street is only listed once; removes actions like "continue"
    const finalStreetNamesWithoutDuplicates = [... new Set(finalStreetNames)]
    console.log(finalStreetNamesWithoutDuplicates)
    return finalStreetNames
}


const getTrafficIncidents = (latLongArray) => {}
// NOTE: set street address and state as required inputs
const originStreet = "1320+Blue+Ridge+Circle"
const originCity = "Mobile,"
const originState= "AL" 
const originZip = "36695"

const destinationStreet = "507+Oak+St"
const destinationCity = "Lucedale,"
const destinationState = "MS"
const destinationZip = "39452"
getLatLong(`${originStreet}+${originCity}%2C${originState}+${originZip}`)
.then(res => {
    // debugger
    return origin = res.items[0].position})
.then(() => getLatLong(`${destinationStreet}+${destinationCity}%2C${destinationState}+${destinationZip}`))
.then(res => {
    // debugger
    console.log("lat/long of destination",res)
    return destination = res.items[0].position})
.then(() => getDirections(origin, destination))
.then(route => 
    getRouteStreetNames(route)
    // Next step is to pull state from input string and convert all street names to lat/long and use Traffic API with corridor to get incident data for path
)
.then(streetNamesArray => {
    const FormattedStreetNames = streetNamesArray.map(string => string.replaceAll(" ", "+"))
    FormattedStreetNames[0] += `%2C${originZip}`
    FormattedStreetNames[1] += `%2C${destinationZip}`
    const finalLatLong = []
    FormattedStreetNames.map(streetName => {
        getLatLong(streetName)
        .then(options => {
            console.log("options",options)
            options.items.map(item => item.title.includes(`${originCity}`) || item.title.includes(`${destinationCity}`) ? finalLatLong.push(item.position) : item)
            return finalLatLong
        }).then(res => {
            // debugger
            console.log(finalLatLong)
        })
    })
})



