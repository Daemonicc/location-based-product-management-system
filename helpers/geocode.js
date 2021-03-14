const NodeGeocoder = require('node-geocoder');

const options = {
	provider: process.env.GEOCODER_PROVIDER,
	httpAdapter: 'https',
	apiKey: 'AIzaSyC_UJ0AmcWrgghiYYjZEbTELLrK0F6szSc',
	formatter: null,
};

const geocoder = NodeGeocoder(options);

module.exports = geocoder;
