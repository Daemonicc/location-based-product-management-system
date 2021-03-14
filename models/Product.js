const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'Please add a name'],
		trim: true,
		maxlength: [50, 'Name can not be more than 50 characters'],
	},

	description: {
		type: String,
		required: [true, 'Please add a description'],
		maxlength: [200, 'Description can not be more than 200 characters'],
	},

	amount: {
		type: Number,
		required: [true, 'Please add product cost'],
	},
	img: {
		data: Buffer,
		contentType: String,
	},
	address: {
		type: String,
		required: [true, 'Please enter product location'],
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
		default: Date.now,
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: 'User',
		required: true,
	},
	reviews: [
		{
			type: mongoose.Schema.ObjectId,
			ref: 'Review',
		},
	],
});

module.exports = mongoose.model('Product', ProductSchema);
