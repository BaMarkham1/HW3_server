var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var jwt = require('jsonwebtoken');
var cors = require('cors');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);

            var userJson = JSON.stringify(user);
            // return that user
            res.json(user);
        });
    });

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            // return the users
            res.json(users);
        });
    });

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, message: 'Please pass username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.status(400).send({ success: false, message: 'A user with that username already exists. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User created!' });
        });
    }
});

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1]

        //create review schema
        var review = new Review();
        //get the information provided
        review.movie = req.body.movie;
        review.name = req.body.name;
        review.quote = req.body.quote;
        review.rating = req.body.rating;
        //save the review
        review.save(function(err) {
            if (err) {
                return res.status(400).send(err);
            }
            verfied = jwt.verify(auth, authJwtController.secret)
            res.json({ success: true, message: 'Review created!', auth : req.headers.authorization, username : verfied.id});
        });
    })
    //.get(authJwtController.isAuthenticated, function (req, res) {
    .get(function (req, res) {
        var reviewNew = new Review();
        if (req.body.movie) {
            reviewNew.movie = req.body.movie;
            Review.find({movie: reviewNew.movie}).select('movie name quote rating').exec(function (err, reviews) {
                if (err) res.send(err);
                res.status(200).send({msg: "GET review", review: reviews});
            });
        }
        else{
            Review.find().select('movie name quote rating').exec(function (err, reviews) {
                if (err) res.send(err);
                res.status(200).send({msg: "GET reviews", reviews: reviews});
            });
        }
    });

router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actor_name = req.body.actor_name;
        movie.char_name = req.body.char_name;
        // save the movie
        movie.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.status(400).json({ success: false, message: 'A movie with that title already exists. '});
                else
                    return res.status(400).send(err);
            }

            res.json({ success: true, message: 'Movie created!' });
        });
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        var movieNew = new Movie();
        if (req.body.title) {
            movieNew.title = req.body.title;
            Movie.findOne({title: movieNew.title}).select('title year genre actor_name char_name').exec(function (err, movie) {
                if (err) res.send(err);
                if (req.query.reviews && req.query.reviews === "true"){
                    Review.find({movie: movieNew.title}).select('movie name quote rating').exec(function (err, reviews) {
                        if (err) res.send(err);
                        else res.status(200).send({msg: "GET movie and reviews", movie : movie, reviews: reviews});
                    });
                }
                else res.status(200).send({msg: "GET movie", movie: movie, headers: req.headers, query : req.query, env : req.body.env});
            });
        }
        else{
            Movie.find().select('title year genre actor_name char_name').exec(function (err, movie) {
                if (err) res.send(err);
                res.status(200).send({msg: "GET movies", movies: movie});
            });
        }
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        var movie = {};
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.actor_name = req.body.actor_name;
        movie.char_name = req.body.char_name;
        //save the movie
        Movie.updateOne({title:req.body.current_title}, {$set: movie}, function(err) {
        //Movie.updateOne({title:req.body.current_title}, {$set: { title : req.body.title, genre : req.body.genre, year: req.body.year }}, function(err) {
            if (err){
                res.send(err);
            }
            else {
                res.status(200).send({msg: "updated movie"});
            }
        })
    })
    .delete(authJwtController.isAuthenticated, function (req, res) {
        Movie.deleteOne({title: req.body.title}, function(err, obj) {
            if (err) throw err;
            res.status(200).send({msg: "deleted movie"});
        })
    });



        router.post('/signin', function(req, res) {
            var userNew = new User();
            userNew.name = req.body.name;
            userNew.username = req.body.username;
            userNew.password = req.body.password;

            User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
                if (err) res.send(err);

        user.comparePassword(userNew.password, function(isMatch){
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, message: 'Authentication failed.'});
            }
        });


    });
});



app.use('/', router);
app.listen(process.env.PORT || 8080);
