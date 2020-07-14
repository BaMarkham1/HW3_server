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
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        var actor = {};
        actor.name = req.body.name;
        actor.img_url = req.body.img_url;
        //save the movie
        Actor.updateOne({_id: req.body.id}, {$set: actor}, function(err) {
            if (err){
                res.send(err);
            }
            else {
                res.status(200).send({msg: "updated actor", actor: actor});
            }
        })
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
    })
    .put(authJwtController.isAuthenticated, function (req, res) {
        var role = {};
        role.actor_id = req.body.actor_id;
        role.movie_id = req.body.movie_id;
        role.char_name = req.body.char_name;
        //save the movie
        Role.updateOne({_id: req.body._id}, {$set: role}, function(err) {
            if (err){
                res.send(err);
            }
            else {
                res.status(200).send({msg: "updated movie", role: role});
            }
        })
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
    newReviews = [];
    indexes = getReviewIndexes(movie._id, reviews);
    console.log("indexes:");
    console.log(indexes);
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

router.route('/reviews/:movie_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log("in get reviews");
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        Review.find({movie_id : movie_id}).select('movie name quote rating').exec(function(err, reviews) {
            if (err) res.send(err);
            console.log(reviews)
            res.json({ success: true, reviews: reviews});
        });
    });

function getActorForRole(role) {
    Actor.findOne({_id: actor_id}).select('name img_url').exec(function(err, actor){
        if (err) res.send(err);
        console.log(actor);
        role.actor_name = actor.name;
        role.img_url = actor.img_url;
        return role;
    })
}

function findActor(role, actors) {
    //console.log("role's actor id type:")
    //console.log(typeof(role.actor_id));
    //console.log("type of actor id")
    //actors.forEach(actor => console.log(typeof(actor._id)));
    actorArray =  actors.filter(actor => role.actor_id.equals(actor._id));
    console.log(actorArray);
    role.img_url = actorArray[0].img_url;
    role.actor_name = actorArray[0].name;
    console.log(role)
}

router.route('/roles/movie/:movie_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log("in get roles");
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        Role.find({movie_id : movie_id}).select('actor_id char_name').exec(function(err, roles) {
            if (err) res.send(err);
            console.log(roles);
            actorIds = roles.map( role  =>  role.actor_id );
            Actor.find({ _id : { $in : actorIds }}).select('img_url name').exec(function(err, actors) {
                roles.forEach((role) => findActor(role, actors));
                res.json({ success: true, movieRoles: roles});
            });
        });
    });

router.route('/movies/:movie_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        Movie.findOne({_id: movie_id}).select('title year genre genres image_url trailer_url').exec(function (err, movie) {
            if (err) res.send(err);
            else if (movie == null) res.status(400).send({msg: "movie by that name not found"});
            Review.find({movie_id : movie._id}).select('rating').exec( function(err, reviews) {
                console.log(reviews);
                let ratings = 0;
                reviews.forEach( review => {ratings = ratings + review.rating} );
                console.log(ratings);
                console.log(reviews.length);
                console.log(ratings/reviews.length);
                let avgRating = ratings/reviews.length;
                movie.avg_rating = parseFloat(avgRating.toFixed(1));
                res.status(200).send({msg: "GET movie and reviews", movie: movie});
            });

        });
    });

router.route('/actors')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Actor.find().sort( { [req.query.sort] : 1 } ).select('_id name img_url').exec(function (err, actors) {
        //Actor.find().select('_id name img_url').exec(function (err, actors) {
            if (err) res.send(err);
            res.status(200).send({msg: "GET actors", actors: actors});
        })
    });

router.route('/removeStuff')
    .post(authJwtController.isAuthenticated, function(req, res) {
        Movie.update({}, {$unset: {avg_rating:1}} , {multi: true});
        res.json({ success: true, message: 'hopefully'});
    });

router.route('/movieRatingTest/:movie_id')
    .get(authJwtController.isAuthenticated, function(req, res) {
        console.log(req);
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id)
        Movie.aggregate([
        {
            $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "movie_id",
                as: "reviews"
            },
        },
        {
            $match: {
                "movie_id" : movie_id
            },
        },
        {
            $addFields : {
                avg_rating: { $avg: "$reviews.rating" }
            }
        },
        ]).exec(function (err, movies) {
                if (err) res.status(500).send(err);
                // return the movies
                res.status(200).send({msg: "GET movies", movies: movies})
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
        console.log(req.body);
        var movie = new Movie();
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genres = req.body.genres;
        movie.image_url = req.body.image_url;
        movie.trailer_url = req.body.trailer_url;
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
        movie.trailer_url = req.body.trailer_url;
        movie.genres = req.body.genres;
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
    .get(authJwtController.isAuthenticated, function(req, res) {
        let queryMapper = {
            asc : 1,
            desc : -1
        };
        //set variables for search, setting a default for each one not provided
        let sortField, sortBy, minYear, maxYear, minRating, maxRating, genre;
        req.query.sort ? sortField = req.query.sort : sortField = "avg_rating";
        req.query.sortBy ? sortBy = queryMapper[req.query.sortBy] : sortBy = -1;
        req.query.minYear ? minYear = parseInt(req.query.minYear) : minYear = 1800;
        req.query.maxYear ? maxYear = parseInt(req.query.maxYear) : maxYear = 2100;
        req.query.minRating ? minRating = parseFloat(req.query.minRating) : minRating = 0.0;
        req.query.maxRating ? maxRating = parseFloat(req.query.maxRating) : maxRating = 5.0;
        Movie.aggregate([
            {
                $match :
                    {
                        year : {$gte : minYear, $lte: maxYear }
                    }

            },
            {
                $lookup: {
                    from: "reviews",
                    localField: "_id",
                    foreignField: "movie_id",
                    as: "reviews",

            }},
            {
                $addFields : {
                    avg_rating: { $avg: "$reviews.rating" }
                }
            },
            {
                $sort: {
                    [sortField] : sortBy
                }
            },
            {
                //have to do this match afterwards as don't have avg_rating until after the lookup
                $match :
                    {
                        avg_rating : {$gte : minRating, $lte : maxRating}
                    }
            }
        ]).exec(function (err, movies) {
            if (err) res.status(500).send(err);
            //now find any movies that have no reviews
            //start by getting all the id's of the returned movies
            reviewed_ids = movies.map( (movie) => movie._id );
            console.log("reviewed ids:");
            console.log(reviewed_ids);
            //find all movies that don't match an id in the reviewed_ids
            Movie.find( { _id: { $nin: reviewed_ids } } ).select('title year genre genres image_url trailer_url').exec(function (err, unreviewedMovies) {
                unreviewedMovies.forEach( (movie) => {
                    movie.avg_rating = 1.0;
                } );
                console.log("unreviewed movies set to 1 star rating:");
                console.log(unreviewedMovies);
                //now add unreviewed movies to the rest of the movies
                movies.push.apply(movies, unreviewedMovies);
                //filter result by genres
                if (req.query.genre) movies = filterByGenre(movies, req.query.genre);
                movies.forEach( (movie) => {
                    let avg_rating = movie.avg_rating;
                    movie.avg_rating = parseFloat(avg_rating.toFixed(1));
                });
                // return the movies
                res.status(200).send({msg: "GET movies", movies: movies});
            });

        });
    });

//have to filter by genre outside of database call b/c elemMatch is not in free tier of Atlas
//takes the genre query params and returns just the movies that are one of those genres
function filterByGenre(movies, genres){
    return movies.filter(function(movie){
        for (let i = 0; i < genres.length; i++){
            if (movie.genres.includes(genres[i])) return true;
        }
    });
}

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
                    let userToken = {id: user._id, username: user.username};
                    let token = jwt.sign(userToken, "ADL;ASALK;DAKLJKL");
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
