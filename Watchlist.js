var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://bendb:bendb@cluster0-gvkpo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var WatchlistSchema = new Schema({
    movie_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    user_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    username: {type: String, required: true}
});

module.exports = mongoose.model('Watchlist', WatchlistSchema, 'watchlist');
