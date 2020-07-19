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


var MovieSchema = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true},
    title: { type: String, required: true, index: { unique: true }},
    year: { type: Number, required: true },
    genre: { type: String, required: false },
    image_url: { type: String, required: false},
    avg_rating: { type: Number, required: false },
    trailer_url: {type: String, required: false},
    genres: [{type: String, enum: ['Action', 'Horror', 'Comedy', 'Adventure', 'Science Fiction', 'Romance', 'Fantasy', 'Sports', 'Drama'], required: true}],
    reviewed: { type: Boolean, required: true }
});

// return the model
//module.exports = mongoose.model('Movie', MovieSchema, 'movies');
module.exports = mongoose.model('Movie', MovieSchema, 'movies');