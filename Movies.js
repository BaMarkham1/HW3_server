var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

//put in environment file (or variable on heroku)
//console.log(process.env.DB);
console.log();
//mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.connect("mongodb+srv://bendb:bendb@cluster0-gvkpo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

// user schema
//Title
//Year released
//Genre (Action, Adventure, Comedy, Drama, Fantasy, Horror, Mystery, Thriller, Western)
//Array of three actors that were in the film
    //ActorName
    //CharacterName



var MovieSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    actor_name: { type: Array, required: true, minItems: 3, items: String },
    char_name: { type: Array, required: true, minItems: 3, items: String },
    image_url: { type: String, required: false },
    avg_rating: {type : Number, required: false},
    reviews: { type: Array, required: false},
    actors: {type: Array, required: false}
});

// return the model
//module.exports = mongoose.model('Movie', MovieSchema, 'movies');
module.exports = mongoose.model('Movie', MovieSchema, 'movies');