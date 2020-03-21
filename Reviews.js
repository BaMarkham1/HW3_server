var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;

//put in environment file (or variable on heroku)
mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var ReviewSchema = new Schema({
    movie: { type: String, required: true },
    name: { type: String, required: true },
    quote: { type: String, required: true },
    rating: { type: Number, required: true, minimum: 0, maximum: 5}
});

// return the model
module.exports = mongoose.model('Review', ReviewSchema, 'reviews');