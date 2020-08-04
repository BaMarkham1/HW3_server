var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var Movie = require('./Movies');
var Review = require('./Reviews');
var Actor = require('./Actors');
var Role = require('./Roles');
var Watchlist = require('./Watchlist');
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

router.route('/roles')
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
        user.profile_pic = "https://lh3.googleusercontent.com/proxy/YbAcyq6fM79SHJGMKczVtgquJLA7oQaub9RxSPVzzoW6QAfjOwpiBxllE22CpnILhAPGHiKL1p1CrT7GWVU64VVrZaL85vRNsvZqIAHw7Rp_mfNglSwGZrtkXjmlg0KMmgs";
        // save the user
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code === 11000)
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
    if (indexes.length === 0) return 0;
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

router.route('/users/profilePic')
    .put(authJwtController.isAuthenticated, function (req, res) {
        User.find().select().exec(function(err, users){
            users.forEach( (user) => {
                user.profile_pic = "https://as2.ftcdn.net/jpg/02/15/84/43/500_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg"
                User.updateOne({_id:user._id}, {$set: user}, function(err) {
                    if (err){
                        res.send(err);
                    }
                })
            });
            res.status(200).send({msg: "updated users", users: users});
        });
    });

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
    .delete(authJwtController.isAuthenticated, function (req, res) {
        let review_id = mongoose.Types.ObjectId(req.params.review_id);
        Review.deleteOne({_id: review_id}, function(err, obj) {
            if (err) throw err;
            res.status(200).send({msg: "deleted review"});
        })
    });

router.route('/watchlist')
    .put(authJwtController.isAuthenticated, function(req, res){
        Watchlist.find().select('_id user_id').exec(function (err, watchlist) {
            watchlist.forEach( (item) => {
                User.findOne({_id : item.user_id}).select('username').exec(function(err, user) {
                    console.log("user:");
                    console.log(user);
                    item.username = user.username;
                    Watchlist.updateOne({_id: item._id}, {$set: item}, function(err) {
                        if (err){
                            res.send(err);
                        }
                        else {
                            console.log("watchlist item:");
                            console.log(item);
                        }
                    })
                });
            })
        });
    });

router.route('/profilePic/user/:username')
    .get(authJwtController.isAuthenticated, function(req, res){
        User.findOne({username: req.params.username}).select('profile_pic').exec(function(err, user) {
            console.log(user);
            if (err) return res.status(400).json({ success: false, message: 'An error occurred'});
            return res.status(200).json({success: true, profilePic: user.profile_pic});
        });
    });

router.route('/profilePic')
    .put(authJwtController.isAuthenticated, function(req, res){
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1];
        verified = jwt.verify(auth, authJwtController.secret);
        console.log("verified");
        console.log(verified);
        let user = {};
        user.profile_pic = req.body.profilePic;
        console.log("user");
        console.log(user);
        User.updateOne({username: verified.username}, {$set: user}, function (err) {
            if (err) {
                res.send(err);
            } else {
                res.status(200).send({msg: "updated user", });
            }
        })
    });

router.route('/watchlist/user/:username')
    .get(authJwtController.isAuthenticated, function(req, res){
        Watchlist.find({username: req.params.username}).select('movie_id').exec(function(err, watchlist) {
            if (err) return res.status(400).json({ success: false, message: 'An error occurred'});
            else return res.status(200).json({success: true, watchlist: watchlist});
        });
    });

router.route('/watchlist/movie/:movie_id')
    .post(authJwtController.isAuthenticated, function (req, res) {
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1];
        verified = jwt.verify(auth, authJwtController.secret);
        var watchlist = new Watchlist();
        watchlist.movie_id = movie_id;
        watchlist.user_id = verified.id;
        //save the watchlist doc
        watchlist.save(function(err) {
            if (err) {
                return res.status(400).json({ success: false, message: 'An error occurred'});
            }
            res.json({ success: true, message: 'added to watchlist!' });
        });
    })
    .get(authJwtController.isAuthenticated, function (req, res) {
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1];
        verified = jwt.verify(auth, authJwtController.secret);
        Watchlist.find({movie_id: movie_id}).select('user_id').exec( function(err, watchlist) {
            if (err) return res.status(400).json({ success: false, message: 'An error occurred'});
            console.log(verified);
            //check if on user's watchlist
            let onUsersWatchlist = watchlist.some( item => item['user_id'].toString() === verified.id);
            res.status(200).send({msg: "GET movie watchlist", watchlistCount: watchlist.length, onUsersWatchlist: onUsersWatchlist});
        });
    })
    .delete(authJwtController.isAuthenticated, function(req, res) {
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1];
        verified = jwt.verify(auth, authJwtController.secret);
        Watchlist.deleteOne({movie_id: movie_id}, {user_id: verified.id}, function(err, obj) {
            if (err) throw err;
            res.status(200).send({msg: "deleted movie from watchlist"});
        })
    });

router.route('/reviews/movie/:movie_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log("in get reviews");
        let movie_id = mongoose.Types.ObjectId(req.params.movie_id);
        Review.find({movie_id : movie_id}).select('movie name quote rating').exec(function(err, reviews) {
            if (err) res.send(err);
            //get the user from the token
            auth = req.headers.authorization.split(' ')[1];
            verified = jwt.verify(auth, authJwtController.secret);
            User.findOne({_id : verified.id}).select('username').exec(function(err, user) {
                const userReviewIndex = reviews.findIndex(review => review.name === user.username);
                res.status(200).send({msg: "GET reviews", reviews: reviews, userReviewIndex: userReviewIndex});
            });
        });
    });

router.route('/reviews/user/:username')
    .get(authJwtController.isAuthenticated, function(req, res){
        Review.find({name: req.params.username}).select('movie_id rating quote').exec(function(err, reviews) {
            if (err) return res.status(400).json({ success: false, message: 'An error occurred'});
            else return res.status(200).json({success: true, reviews: reviews});
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

function findMovie(role, movies) {
    movieArray =  movies.filter(movie => role.movie_id.equals(movie._id));
    console.log(movieArray);
    role.movie_img = movieArray[0].image_url;
    role.movie_name = movieArray[0].title;
    console.log(role)
}

router.route('/roles/actor/:actor_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        console.log("in get roles");
        let actor_id = mongoose.Types.ObjectId(req.params.actor_id);
        Role.find({actor_id : actor_id}).select('movie_id char_name').exec(function(err, roles) {
            if (err) res.send(err);
            console.log(roles);
            movieIds = roles.map( role  =>  role.movie_id );
            Movie.find({ _id : { $in : movieIds }}).select('title image_url').exec(function(err, movies) {
                roles.forEach((role) => findMovie(role, movies));
                res.json({ success: true, actorRoles: roles});
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
    })
    .post(authJwtController.isAuthenticated, function (req, res) {
        var actor = new Actor();
        actor.name = req.body.name;
        actor.img_url = req.body.image_url;
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
        Actor.updateOne({_id: req.body._id}, {$set: actor}, function(err) {
            if (err){
                res.send(err);
            }
            else {
                res.status(200).send({msg: "updated actor", actor: actor});
                console.log("actor:");
                console.log(actor);
            }
        })
    });

router.route('/actors/:actor_id')
    .get(authJwtController.isAuthenticated, function (req, res) {
        let actor_id = mongoose.Types.ObjectId(req.params.actor_id);
        Actor.findOne({_id: actor_id}).select('_id name img_url').exec(function (err, actor) {
            if (err) res.send(err);
            res.status(200).send({msg: "GET actor", actor: actor});
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
        Movie.findOne({_id: req.body.movie_id}).select('title year genre actor_name char_name image_url reviews avg_rating reviewed').exec(function (err, movie) {
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
                    if (movie.reviewed !== true) {
                        movie.reviewed = true;
                        Movie.updateOne({_id:req.body.movie_id}, {$set: movie}, function(err) {
                            if (err){
                                res.send(err);
                            }
                        })
                    }
                    res.json({ success: true, message: 'Review created!'});
                });
            });
        });
    })
    .get(function (req, res) {
        var reviewNew = new Review();
        if (req.body.movie) {
            reviewNew.movie = req.body.movie;
            Review.find({movie: reviewNew.movie}).sort({$natural:-1}).select('movie name quote rating').exec(function (err, reviews) {
                if (err) res.send(err);
                //get the user from the token
                auth = req.headers.authorization.split(' ')[1];
                verified = jwt.verify(auth, authJwtController.secret);
                User.findOne({_id : verified.id}).select('username').exec(function(err, user) {
                    const userReviewIndex = reviews.findIndex(review => review.name === user.username);
                    res.status(200).send({msg: "GET reviews", reviews: reviews, userReviewIndex: userReviewIndex});
                });
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
        var review = {};
        //get the user from the token
        auth = req.headers.authorization.split(' ')[1];
        verified = jwt.verify(auth, authJwtController.secret);
        User.findOne({_id: verified.id}).select('username').exec(function (err, user) {
            console.log("getting user");
            if (err) res.send(err);
            //create review document
            var review = new Review();
            //get the information
            review._id = mongoose.Types.ObjectId(req.body._id);
            review.name = user.username;
            review.quote = req.body.quote;
            review.rating = req.body.rating;
            review.movie_id = req.body.movie_id;
            //save the review
            Review.updateOne({_id: review._id}, {$set: review}, function (err) {
                if (err) {
                    res.send(err);
                } else {
                    res.status(200).send({msg: "updated review"});
                }
            })
        })
    });

function updateReviews(movie_id, reviews) {
    reviews.forEach((review) => updateReview(movie_id, review))
    }

function updateReview(movie_id, review_id) {
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
        console.log("body of post request:");
        console.log(req.body);
        var movie = new Movie();
        movie._id = req.body._id;
        movie.title = req.body.title;
        movie.year = req.body.year;
        movie.genres = req.body.genres;
        movie.image_url = req.body.image_url;
        movie.trailer_url = req.body.trailer_url;
        movie.reviewed = false;
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
        req.query.ascendingOrder ? sortBy = 1 : sortBy = -1;
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

            //as long as excludeUnreviewed wasn't provided, find any movies that have no reviews
            if (!req.query.excludeUnreviewed) {
                //find all movies that haven't been reviewed yet
                Movie.find({ $and:[
                        {reviewed: false},
                        {year : {$gte: minYear, $lte: maxYear}}
                    ] }).select('title year genre genres image_url trailer_url').exec(function (err, unreviewedMovies) {
                    unreviewedMovies.forEach((movie) => {
                        movie.avg_rating = 0.0;
                    });
                    //now add unreviewed movies to the rest of the movies
                    movies.push.apply(movies, unreviewedMovies);
                    //re-sort with the unreviewed movies
                    movies.sort((a, b) => (a[sortField] > b[sortField]) ? sortBy : -1*sortBy);
                    //filter result by genres
                    let genre;
                    if (req.query.genre) {
                        typeof(req.query.genre) === 'string' ? genre = [req.query.genre] : genre = req.query.genre;
                        movies = filterByGenre(movies, genre);
                    }
                    console.log("movie length");
                    console.log(movies.length);
                    movies.forEach((movie) => {
                        let avg_rating = movie.avg_rating;
                        movie.avg_rating = parseFloat(avg_rating.toFixed(1));
                    });
                    console.log("movie length");
                    console.log(movies.length);
                    // return the movies
                    res.status(200).send({msg: "GET movies", movies: movies});
                });
            }
            //else, if excludeUnreviewed was provided, do the same thing but without the find operation
            //kinda messy, but not sure how to do it otherwise
            else {
                //filter result by genres
                if (req.query.genre) {
                    typeof(req.query.genre) === 'string' ? genre = [req.query.genre] : genre = req.query.genre;
                    movies = filterByGenre(movies, genre);
                }
                movies.forEach((movie) => {
                    let avg_rating = movie.avg_rating;
                    movie.avg_rating = parseFloat(avg_rating.toFixed(1));
                });
                res.status(200).send({msg: "GET movies", movies: movies});
            }
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
