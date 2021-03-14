const dotenv = require('dotenv');

dotenv.config({});

const config = {
	MONGO_URL: process.env.MONGO_URL,
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_EXPIRE: process.env.JWT_EXPIRE,
	JWT_COOKIE_EXPIRE: process.env.JWT_COOKIE_EXPIRE,
	SENDGRID_API: process.env.SENDGRID_API,
	FROM_EMAIL: process.env.FROM_EMAIL,
	FROM_NAME: process.env.FROM_NAME,
	CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
	CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
	CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};

module.exports = config;
