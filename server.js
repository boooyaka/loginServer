// HTTP and WebSocket server initialization
var express = require('express');
var app = express();
var server = require('http').Server(app);
var sio = require('socket.io')(server);
var portNumber = 9000;

// Used to parse POST body
var bodyParser = require('body-parser');
// var url = require('url');

//Creates a JWT token and returns it to user
var jwt = require('jsonwebtoken');
var jwtSecret = 'AFBE234ssSAsas8hjfSECREtsz';
var lastTokenServed = null;

var db = require('./mongoDatabase.js');

// Express app
// Parse body - creates request.body (access query parameters)
app.use(bodyParser.urlencoded({ extended: true }));

app.all('*', function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', '*');
	next();
});


// Handle client HTTP POST requests
app.post('/login', function(req, res) {
	var userDetails = req.body;

	db.getUser(userDetails.name, function(err, user) {
		if (err) {
			console.log('login error: ' + err);
			next(err);
			console.log('Line after next() is executed!!!!');
		} else {
			if (user) {
				if ( user.comparePassword(userDetails.password) ) {
					console.log('Password is correct');

					var token = createToken(user.getName());
					lastTokenServed = token;
					console.log('token: ' + token);
					res.contentType('json');
					res.json({token: token});
					res.end();
				} else {
					res.json({
						reply: 'Incorrect password',
						token: null
					});
				}
			} else {
				// user is null
				res.json({
					reply: 'User does not exist',
					token: null
				});
			}
		}
	});
});

app.post('/register', function(req, res) {
	// Example of how to send a simple response to client
	// res.send('Hey, please add username and password');
	var userDetails = req.body;
	if (userDetails.password === userDetails.confirmPassword) {
		db.addUser(userDetails, function(err, user) {
			if (err) {
				console.log('add user error: ' + err);
				res.send('Username was already taken!');
			} else {
				console.log('User added');

				res.send('Hi ' + user.name +
				', your user was created successfuly');
			}
		}); // db.addUser
	} else {
		res.send('Passwords do not match, try again');
	}
}); // post

app.post('*', function(req, res, next) {
	res.statusCode = 200;
	res.end();
})

// Start HTTP server
server.listen(portNumber);

//WebSocket server

// socket.io website recommends using the following method
// for socket authentication, the following is called prior to
// socket being created
sio.use(function(socket, next) {
	var handshakeData = socket.request;
	// authenticate data, if error then -
	// 		next(new Error('Error description'));
	next();
});

// Handle client websocket connection
sio.on('connection', function(socket) {
	var query = socket.request._query;

	console.log('Client opened websocket connection!!!!');
	console.log('socket.request._query.token: ' + socket.request._query.token);
	console.log('socket.id: ' + socket.id);
	if (lastTokenServed) {
		// Keep a list of the usernames with tokens assigned to them
		// and lookup that list to see if token matches username
		// (how does user send username to websocket??)
		if ( authenticateToken(socket.request._query.token) ) {

			// This actually works!!
			// var value = socket.request._query.username;
			// console.log('socket.request._query.username: ' + value);

			// socket.set('username', value);
			// socket.get('username', function(err, username) {
			// 	console.log('socket.get username: ' + username);
			// });


			// Add user token, socket and username to online users (redis cache)
			// Remove user on logout
			console.log('Client connecting possess last token served!');
		}
	} else {
		console.log('This connection is performed before any client requests are made');
	}

	socket.on('disconnect', function(socket) {
		console.log('Socket disconnected');
	});
});



// Helper functions
function createToken(info) {
	// as of now jwtSecret is a global variable - not good design
	return jwt.sign(info, jwtSecret, { expiresInMinutes: 60*5});
}

function authenticateToken(token) {
	console.log('authenticateToken, token: ' + token);
	// Check in cache if user token exists,
	// If so store socket with token - USER IS LOGGED ON
	return token === lastTokenServed;
}

function attemptUserLogin(userDetails) {
	var response = {
		success: false,
		reason: null
	}
	// Check if username exists
	// Compare passwords

	return response;
}
