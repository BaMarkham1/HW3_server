var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt-nodejs');

mongoose.Promise = global.Promise;

//put in environment file (or variable on heroku)
mongoose.connect(process.env.DB, { useNewUrlParser: true } );
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
    genre: { type: String, required: true }
    //actors: { type: Array, required: true, minItems: 3, items: String }

});

// return the model
module.exports = mongoose.model('Movie', MovieSchema, 'movies');