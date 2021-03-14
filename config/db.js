const mongoose = require('mongoose');
const { MONGO_URL } = require('./config');

const connectDB = async () => {
	const conn = await mongoose.connect(MONGO_URL, {
		useNewUrlParser: true,
		useCreateIndex: true,
		useFindAndModify: false,
		useUnifiedTopology: true,
	});

	console.log(`MongoDB Connected: ${conn.connection.host}`);
};

module.exports = connectDB;
