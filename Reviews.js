var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

//put in environment file (or variable on heroku)
//mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.connect("mongodb+srv://bendb:bendb@cluster0-gvkpo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId, required: true},
    movie_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    name: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, required: true, min: 0, max: 5}
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema, 'reviews');