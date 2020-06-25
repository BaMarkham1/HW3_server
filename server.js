var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var Actor = require('./Actors');
var Role = require('./Roles');
var jwt = require('jsonwebtoken');
var cors = require('cors');
var mongoose = require('mongoose');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

app.use(passport.initialize());

var router = express.Router();

router.route('/actor')
    .post(authJwtController.isAuthenticated, function (req, res) {
        var actor = new Actor();
        actor.name = req.body.name;
        actor.img_url = req.body.img_url;
        actor.save(function(err) {
            if (err) {
                return res.status(400).json({ success: false, message: 'An error occurred'});
            }
            res.json({ success: true, message: 'Actor created!' });
        });
    });

router.route('/role')
    .post(authJwtController.isAuthenticated, function (req, res) {
        var role = new Role();
        Movie.findOne({_id: req.body.movie_id}).select('_id title').exec(function (err, movie) {
            console.log("finding movie");
            if (err) res.send(err);
            else if (movie == null) {
                res.status(400).send({msg: "movie with that id not found"})
            }
            Actor.findOne({_id: req.body.actor_id}).select('id name').exec(function (err, actor) {
                console.log("finding actor");
                if (err) res.send(err);
                else if (actor == null) {
                    res.status(400).send({msg: "actor with that id not found"})
                }
                role.movie_id = req.body.movie_id;
                role.actor_id = req.body.actor_id;
                role.char_name = req.body.char_name;
                role.actor_name = actor.name;
                role.movie_name = movie.title
                role.save(function(err) {
                    if (err) {
                        return res.status(400).json({ success: false, message: 'An error occurred'});
                    }
                    res.json({ success: true, message: 'Role created!' });
                });
            });
        });
    });

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

function updateDB(movie) {
    Movie.updateOne({title:movie.title}, {$set: movie}, function(err) {
        //Movie.updateOne({title:req.body.current_title}, {$set: { title : req.body.title, genre : req.body.genre, year: req.body.year }}, function(err) {
        if (err){
            res.send(err);
        }
        else {
            console.log("updated movie");
        }
    })
}

function updateMovie(movie, reviews) {
    newReviews = []
    indexes = getReviewIndexes(movie._id, reviews);
    console.log("indexes:")
    console.log(indexes)
    indexes.forEach( index  =>  newReviews.push(reviews[index]._id) );
    movie.avg_rating = getAverageRating(reviews, indexes);
    movie.reviews = newReviews;
    updateDB(movie);
    return movie
}

function getAverageRating(reviews, indexes){
    if (indexes.length == 0) return 0;
    sum = 0;
    indexes.forEach(index => {
        sum = sum + reviews[index].rating;
    });
    return (sum / indexes.length);
}

function getReviewIndexes(movieId, reviews) {
    //movieId = mongoose.Types.ObjectId(movieId);
    console.log("movieId:");
    console.log(movieId);
    console.log("type of movieID");
    console.log(typeof(movieId));
    console.log("type of reviews' movie id");
    reviews.forEach( (review) => console.log(typeof(review.movie_id)) );
    //console.log(typeof(reviews[23].movie_id));
    return reviews.map((review, i) => ( (movieId.equals(review.movie_id) ) ? i : false)).filter((review) => (review));
}

router.route('/movies/reviews')
    .put(authJwtController.isAuthenticated, function (req, res) {
        Movie.find().select('title year genre actor_name char_name image_url reviews avg_rating').exec(function (err, movies) {
            if (err) res.send(err);
                Review.find().select('_id movie movie_id name quote rating').exec( (err, reviews) => {
                    if (err) res.send(err);
                    updatedMovies = movies.map( (movie) =>  updateMovie(movie, reviews));
                    res.status(200).send({msg: "update stuff", movies: updatedMovies });
                    });
                     //, reviews: reviews});
                });
            });

function updateAverage(movie, newRating) {
        console.log(movie.avg_rating)
        console.log(movie.title)
        return ( ((movie.avg_rating * movie.reviews.length) + newRating) / (movie.reviews.length + 1) )
}

router.route('/reviews/:review_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        let review_id = mongoose.Types.ObjectId(req.params.review_id);
        Review.findOne({_id : review_id}).select('movie name quote rating').exec(function(err, review) {
            if (err) res.send(err);
            res.json({ success: true, review: review});
        });
    });

router.route('/movies/:movie_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        Movie.findOne({_id: movie_id}).select('title year genre actors image_url reviews avg_rating').exec(function (err, movie) {
            if (err) res.send(err);
            else if (movie == null) res.status(400).send({msg: "movie by that name not found"})
            Role.find({movie_id: req.params.movie_id}).select('actor_name char_name').exec(function (err, roles) {
                movie.roles = roles;
                Review.find({movie_id: req.params.movie_id}).select('_id movie name quote rating').exec(function (err, reviews) {
                    if (err) res.send(err);
                    movie.reviews = reviews;
                    res.status(200).send({msg: "GET movie and reviews", movie: movie});
                });
            });
        });
    });

router.route('/reviews')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req)
        //check if movie exists, if not can't post review for it
        Movie.findOne({_id: req.body.movie_id}).select('title year genre actor_name char_name image_url reviews avg_rating').exec(function (err, movie) {
            console.log("finding movie");
            if (err) res.send(err);
            else if (movie == null) {
                res.status(400).send({msg: "movie with that id not found"})
            }
            //get the user from the token
            auth = req.headers.authorization.split(' ')[1];
            verified = jwt.verify(auth, authJwtController.secret);
            User.findOne({_id : verified.id}).select('username').exec(function(err, user) {
                console.log("getting user");
                if (err) res.send(err);
                //create review document
                var review = new Review();
                //get the information
                review._id = mongoose.Types.ObjectId();
                review.name = user.username;
                review.quote = req.body.quote;
                review.rating = req.body.rating;
                review.movie_id = req.body.movie_id;
                //update movie with new review
                movie.avg_rating = updateAverage(movie, review.rating);
                movie.reviews.push(review._id);
                updateDB(movie);
                //save the review
                review.save(function(err) {
                    if (err) {
                        return res.status(400).send(err);
                    }
                    console.log("saving review");
                    res.json({ success: true, message: 'Review created!'});
                });
            });
        });
    })
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
    })
    .put(function (req, res) {
        Movie.find().select('_id reviews').exec(function (err, movies) {
            if (err) res.send(err);
            movies.forEach((movie) => updateReviews(movie._id, movie.reviews));
        })
    });

function updateReviews(movie_id, reviews) {
    reviews.forEach((review) => updateReview(movie_id, review))
    }

function updateReview(movie_id, review_id) {
    //Review.findOne({ _id: review_id }).select('_id movie_id movie name quote rating').exec(function(err, review) {
        //review.movie_id = movie_id;
        Review.updateOne({_id: review_id}, {$set: { movie_id : movie_id }}, function (err) {
            //Movie.updateOne({title:req.body.current_title}, {$set: { title : req.body.title, genre : req.body.genre, year: req.body.year }}, function(err) {
            if (err) {
                res.send(err);
            } else {
                console.log("updated review");
                console.log(review_id);
                console.log(movie_id);
            }
        })
    //})
}

function updateActors(movie) {
    movie.actor_name.forEach( (actor, i) => movie.actors.push( { "actor_name" : actor, "char_name" : movie.char_name[i] }));
    Movie.updateOne({_id: movie._id}, {$set: { actors : movie.actors }}, function (err) {
        if (err) {
            res.send(err);
        } else {
            console.log("updated actors");
        }
    })


}

//take the info in actor_name and char_name and make a new field, actors
router.route('/movies/actors')
    .put(authJwtController.isAuthenticated, function (req, res) {
        Movie.find().select('title year genre actor_name char_name image_url reviews avg_rating actors').exec(function (err, movies) {
            movies.forEach( (movie, i) => updateActors(movie) );
        });
    });


router.route('/movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.image_url = req.body.image_url;
        movie.actors = req.body.actors;
        movie.avg_rating = 0;
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
    .put(authJwtController.isAuthenticated, function (req, res) {
        var movie = {};
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genre = req.body.genre;
        movie.image_url = req.body.image_url;
        //save the movie
        Movie.updateOne({_id:req.body.movie_id}, {$set: movie}, function(err) {
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
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        var movieNew = new Movie();
        Movie.find().select('_id title year genre actors image_url reviews avg_rating').exec(function (err, movies) {
            if (err) res.send(err);
            movies.sort(function(a, b) {
                return parseFloat(b.avg_rating) - parseFloat(a.avg_rating);
            });
            if (req.query.reviews && req.query.reviews === "true"){
                Review.find().select('_id movie movie_id name quote rating').exec(function (err, reviews) {
                    if (err) res.send(err);
                    //res.status(200).send({msg: "test", reviews: reviews})
                    newMovies = movies.map( movie  =>  getReviews(movie, reviews) )
                    res.status(200).send({msg: "GET movies and reviews", movies: newMovies})
                })
            }
            else res.status(200).send({msg: "GET movies", movies: movies});
        });
    })

function getReviews(movie, reviews){
    indexes = getReviewIndexes(movie._id, reviews)
    newReviews = []
    indexes.forEach( index  =>  newReviews.push(reviews[index]) );
    movie.reviews = newReviews;
    return movie;
}



        router.post('/signin', function(req, res) {
            var userNew = new User();
            userNew.name = req.body.name;
            userNew.username = req.body.username;
            userNew.password = req.body.password;

            User.findOne({ username: userNew.username }).select('name username password').exec(function(err, user) {
                if (err) res.send(err);
                if (user){
                    user.comparePassword(userNew.password, function(isMatch){
                        if (isMatch) {
                            var userToken = {id: user._id, username: user.username};
                            var token = jwt.sign(userToken, process.env.SECRET_KEY);
                            res.json({success: true, token: 'JWT ' + token});
                        }
                        else {
                            res.status(401).send({success: false, message: 'password incorrect.'});
                        }
                    });
                }
                else
                    res.status(401).send({success: false, message: 'username not found.'})
            });
        });

app.use('/', router);
app.listen(process.env.PORT || 8080);
