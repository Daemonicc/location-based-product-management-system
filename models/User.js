var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new mongoose.Schema({
	firstname: {
		type: String,
	},
	lastname: {
		type: String,
	},
	phone: {
		type: String,
		maxlength: [11, 'Phone number cannot be longer than 11 characters'],
	},
	address: {
		type: String,
		// required: true,
	},
	location: {
		type: {
			type: String,
			enum: ['Point'],
		},
		coordinates: {
			type: [Number],
			index: '2dsphere',
		},
		formattedAddress: String,
		city: String,
		country: String,
	},
	createdAt: {
		type: Date,
		default: Date.now(),
	},
});

UserSchema.plugin(passportLocalMongoose);
mongoose.models = {};
module.exports = mongoose.model('User', UserSchema);
