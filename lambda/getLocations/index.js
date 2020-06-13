const https = require('https');
const caProvince = require('./ca-province.json');

async function getIkeaRaw(countryCode) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      host: process.env.IKEA_HOST,
      port: 443,
      path: `https://ww8.ikea.com/clickandcollect/${countryCode}`
            + '/receive/listfetchlocations?version=2',
      headers: { 'Host': 'ww8.ikea.com' },
      timeout: 5000,
    }, (res) => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];

      let error;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          'Expected application/json but received ' +
                          contentType);
      }
      if (error) {
        // Consume response data to free up memory
        res.resume();
        reject(error);
        return;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', (chunk) => { rawData += chunk; });
      res.on('end', () => {
        try {
          const localTimestamp = new Date();
          const parsedData = JSON.parse(rawData);
          const sourceTimestamp = new Date(res.headers['date']);
          resolve([parsedData, sourceTimestamp, localTimestamp]);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject)
      .on('timeout', () => {
        req.abort();
        reject(new Error('HTTP request timeout'));
      });
  });
}

function ikeaRaw2Locations(ikeaRaw, countryCode) {
  const locations = [];
  switch (countryCode) {
    case 'US':
      for (const sourceId in ikeaRaw) {
        const rawLocation = ikeaRaw[sourceId];
        const location = {};
        location.countryCode = 'US';
        const indexOfIKEA = rawLocation.name.indexOf('IKEA ');
        location.subdivisionCode = rawLocation.name.slice(indexOfIKEA - 4, indexOfIKEA - 2);
        location.iso3166 = `${location.countryCode}-${location.subdivisionCode}`;
        location.locationName = rawLocation.name.slice(indexOfIKEA + 5);
        location.sourceId = sourceId;
        locations.push(location);
      }
      break;
    case 'CA':
      for (const sourceId in ikeaRaw) {
        const rawLocation = ikeaRaw[sourceId];
        if (!rawLocation.name.startsWith('IKEA ')) continue;
        const locationName = rawLocation.name
                       .slice(5, rawLocation.name.indexOf(' - '));
        const subdivisionCode = caProvince[locationName];
        const location = {};
        location.countryCode = 'CA';
        location.subdivisionCode = subdivisionCode;
        location.iso3166 = `${location.countryCode}-${location.subdivisionCode}`;
        location.locationName = locationName;
        location.sourceId = sourceId;
        locations.push(location);
      }
      break;
  }
  return locations;
}

exports.handler = async (event) => {
    const [ikeaRaw, sourceTimestamp, localTimestamp] = await getIkeaRaw(event.countryCode);
    const locations = ikeaRaw2Locations(ikeaRaw, event.countryCode);
    return {
      locations: locations,
      sourceTimestamp: sourceTimestamp,
      localTimestamp: localTimestamp
    };
};
