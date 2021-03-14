const express = require('express');
const app = express();
const session = require('express-session');
const passport = require('passport');
const localStrategy = require('passport-local').Strategy;
const dbConnect = require('./config/db');
const User = require('./models/User');
const dotenv = require('dotenv');
const geocoder = require('./helpers/geocode');
const middlewareObj = require('./middleware/middleware');
const { check, validationResult } = require('express-validator');
const Product = require('./models/Product');
const Review = require('./models/Reviews');
const fs = require('fs');
const path = require('path');
const flash = require('connect-flash');

dotenv.config({});
dbConnect();
app.use(flash());

//firebase config

var admin = require('firebase-admin');
var serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
});
let db = admin.firestore();

//Multer Config
var multer = require('multer');

var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads');
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now());
	},
});
var upload = multer({ storage: storage });

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);
app.use(express.urlencoded({ extended: true }));

//passport config
app.use(passport.initialize());
app.use(passport.session());

passport.use(
	new localStrategy(
		{
			usernameField: 'email',
			passwordField: 'password',
		},
		User.authenticate()
	)
);
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(async function (req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash('error');
	res.locals.success = req.flash('success');
	next();
});

//Routes

app.get('/register', (req, res) => {
	res.render('register');
});

app.post(
	'/register',
	[
		check('password')
			.isLength({ min: 8 })
			.withMessage('Password must be at least 8 characters'),
		check('email').isEmail().withMessage('Enter a Valid Email'),
		check('address').not().isEmpty().escape().withMessage('Enter Address'),
		check('phone').not().isEmpty().escape().withMessage('Enter phone Number'),
	],
	(req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => {
				req.flash('error', error.msg);
			});
			return res.redirect('back');
		}
		var { email, firstname, lastname, address, phone, password } = req.body;
		User.register(
			new User({ username: email }),
			password,
			async (err, user) => {
				if (err) {
					console.log(err);
				}
				const locationInfo = await geocoder.geocode(address);
				const location = {
					type: 'Point',
					coordinates: [locationInfo[0].longitude, locationInfo[0].latitude],
					formattedAddress: locationInfo[0].formattedAddress,
					city: locationInfo[0].city,
					country: locationInfo[0].country,
				};

				user.location = location;
				user.firstname = firstname;
				user.lastname = lastname;
				user.address = address;
				user.phone = phone;
				user.save();
				passport.authenticate('local')(req, res, function () {
					req.flash('success', `welcome ${user.firstname}`);
					res.redirect('/');
				});
			}
		);
	}
);

app.get('/login', (req, res) => {
	res.render('login');
});

app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login',
		failureFlash: 'Invalid Username or Password',
		successFlash: 'Welcome back',
	}),
	function (req, res) {}
);

app.get('/', middlewareObj.isLoggedIn, async (req, res) => {
	const lat = req.user.location.coordinates[0];
	const long = req.user.location.coordinates[1];

	console.log(lat, long);
	let distance = 10;
	if (req.query.distance) {
		distance = req.query.distance;
	}
	const raduis = distance / 3963;
	//Find all product within 10 miles raduis from user execept user product
	const products = await Product.find({
		location: { $geoWithin: { $centerSphere: [[lat, long], raduis] } },
		user: { $ne: req.user._id },
	});
	res.render('dashboard', { products, distance });
});

app.get('/upload', middlewareObj.isLoggedIn, (req, res) => {
	res.render('upload');
});

app.post(
	'/upload',
	upload.single('image'),
	middlewareObj.isLoggedIn,
	[
		check('address').isString().escape(),
		check('name').isString().escape(),
		check('amount').isNumeric().escape(),
		check('description').isString().escape(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			errors.array().forEach((error) => {
				req.flash('error', error.msg);
			});
			return res.redirect('back');
		}
		let firebaseCollection = db.collection('products');
		const { name, description, amount, address } = req.body;
		const locationInfo = await geocoder.geocode(address);
		const location = {
			type: 'Point',
			coordinates: [locationInfo[0].longitude, locationInfo[0].latitude],
			formattedAddress: locationInfo[0].formattedAddress,
			city: locationInfo[0].city,
			country: locationInfo[0].country,
		};
		const productInfo = {
			name,
			description,
			amount,
			address,
			location,
			img: {
				data: fs.readFileSync(
					path.join(__dirname + '/uploads/' + req.file.filename)
				),
				contentType: 'image/png',
			},
		};

		Product.create(
			{ ...productInfo, user: req.user._id },
			async (err, product) => {
				if (err) {
					req.flash('error', err.message);
					res.redirect('back');
				} else {
					let docRef = firebaseCollection.doc(product.id);
					await docRef.set({ ...productInfo, user: req.user._id.toString() });
					req.flash('success', 'Product succesfully created');
					res.redirect('/');
				}
			}
		);
	}
);

app.get('/products/:productId', middlewareObj.isLoggedIn, async (req, res) => {
	const product = await Product.findById(req.params.productId)
		.populate('user', 'firstname lastname phone')
		.populate({
			path: 'reviews',
			populate: {
				path: 'author',
			},
		})
		.exec();
	res.render('show-product', { product: product });
});

app.post('/:productId/review', middlewareObj.isLoggedIn, async (req, res) => {
	const body = {
		body: req.body.body,
		author: req.user._id,
	};

	const review = await Review.create(body);
	const product = await Product.findById(req.params.productId);
	product.reviews.push(review._id);
	await product.save();

	res.redirect('back');
});

app.get('/me/products', middlewareObj.isLoggedIn, async (req, res) => {
	Product.find({ user: req.user._id }, (err, products) => {
		if (err) {
			req.flash('err', err.message);
			res.redirect('back');
		}
		res.render('my-product', { products });
	});
});

app.get('/logout', (request, response) => {
	request.logout();
	response.redirect('/');
});

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log(`app is running on port ${listener.address().port}`);
});
