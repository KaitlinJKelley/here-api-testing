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
// Returns an array of just street names that the user will follow during their drive
const getRouteStreetNames = (route) => {
    console.log("turn by turn",route.routes[0].sections[0].turnByTurnActions)
    // Stores an array of action objects
    const turnByTurnDirections = route.routes[0].sections[0].turnByTurnActions

    // Stores only the key/value pairs that start with "name" or "number"
    //NOTE: Add  || key.includes('number') back to filter of only street names doesn't work
    const filteredStreetNames = turnByTurnDirections.map((actionObj) => Object.fromEntries(Object.entries(actionObj.nextRoad).filter(([key, value]) => key.includes('name') || key.includes('number'))))
    console.log("filtered street names", filteredStreetNames)

    // Removes any undefined objects (objects that contained "name" or "number" but were nested)
    const streetNames = filteredStreetNames.filter(name => name.name !== undefined)
    console.log("street names", streetNames)

    // Removes action of "arriving" (reaching destination)
    streetNames.splice(-1)
    console.log("street names post splice",streetNames)

    // if the key is called "number", rename it to "name", so all properties are consistent
    const consistentStreetNames = streetNames.map(nameObj => nameObj.number ? nameObj.name = nameObj.number : nameObj.name = nameObj.name)
    console.log("consistent street names", streetNames)

    // NOTE: Took this section out when I decided to keep the highway numbers; now there are no empty object
    // Define new array that doesn't contain empty objects
    // const streetNamesWithoutEmptyObjects = []
    // streetNames.map(nameObj => nameObj.hasOwnProperty("name") ? streetNamesWithoutEmptyObjects.push(nameObj) : nameObj)
    // console.log(streetNamesWithoutEmptyObjects)

    console.log("consistent street names",consistentStreetNames)
    // Returns array of just street names
    const finalStreetNames = consistentStreetNames.map(streetNameObj => streetNameObj[0].value)

    // Creates a new set of street names where each street is only listed once; removes actions like "continue"
    const finalStreetNamesWithoutDuplicates = [... new Set(finalStreetNames)]
    console.log(finalStreetNamesWithoutDuplicates)

    return finalStreetNames
}

// Returns collection of traffic incidents along the given path, based on provided width
const getTrafficIncidents = (latLongArray) => {
    console.log("latLongArray", latLongArray)
    const fixedLatLongString = latLongArray.replaceAll(",", "%2C")
    console.log("fixed",fixedLatLongString, typeof(fixedLatLongString))

    // Finally got Traffic Incident data back but somehow also still getting a 400 error???
    // debugger
    return fetch(`https://traffic.ls.hereapi.com/traffic/6.0/incidents.json?corridor=${fixedLatLongString}%3B1000&apiKey=mkvFOiCVql51ufvvBHkEumYGNOj09UcGP7n5yVJ2sD8`)
    .then(res => {
        // debugger
        if (res.ok) {
            // debugger
            console.log("got a good response",res) 
            return res
        } else {
            console.log("you don't want that response")
        }
    })
    .then(res => res.json())
    .catch(err => {console.log("error")})
    .then(res => console.log("response",res))
}

// NOTE: Set all as required inputs
const originStreet = "1320+Blue+Ridge+Circle"
const originCity = "Mobile,"
const originState= "AL" 
const originZip = "36695"

const destinationStreet = "507+Oak+St"
const destinationCity = "Lucedale,"
const destinationState = "MS"
const destinationZip = "39452"
// Returns lat/long of the user's origin point
getLatLong(`${originStreet}+${originCity}%2C${originState}+${originZip}`)
.then(res => {
    // position is the object conataining the lat/long pair
    return origin = res.items[0].position})
    // Returns lat/long of user/s destination opint
.then(() => getLatLong(`${destinationStreet}+${destinationCity}%2C${destinationState}+${destinationZip}`))
.then(res => {
    console.log("lat/long of destination",res)
    return destination = res.items[0].position})
    // Returns turn by turn directions from origin to destination
.then(() => getDirections(origin, destination))
.then(route => 
    // // Returns an array of just street names that the user will follow during their drive; line 21
    getRouteStreetNames(route)
)
.then(streetNamesArray => {
    // Formats the list of street names to be converted to lat/long pairs
    const FormattedStreetNames = streetNamesArray.map(string => string.replaceAll(" ", "+"))
    FormattedStreetNames[0] += `%2C${originZip}`
    FormattedStreetNames[1] += `%2C${destinationZip}`
    let finalLatLong = []
    console.log("formattedStreetNames", FormattedStreetNames)
    // Maps the formatted street names and gets lat/long for each
    FormattedStreetNames.map(streetName => {
        // Runs each street name string through the geocoder API to the lat/long
        return getLatLong(streetName)
        .then(options => {
            console.log("options",options)
            // maps the returned options and chooses whichever lat/long pair from the object contains the origin or destination city name 
            // returns array of lat/long objects
            options.items.map(item => item.title.includes(`${originCity}`) || item.title.includes(`${destinationCity}`) ? finalLatLong.push(Object.values(item.position)) : item)
        }).then(res => {
            console.log("finalLatLong",finalLatLong)
            // Gets traffic incidents for the user's path; line 61
            getTrafficIncidents(finalLatLong.join("%3B"))
        })
    })
})



