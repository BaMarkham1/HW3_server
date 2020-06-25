var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://bendb:bendb@cluster0-gvkpo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var ActorSchema = new Schema({
    name: { type: String, required: true },
    img_url: { type: String, required: true }
});

module.exports = mongoose.model('Actor', ActorSchema, 'actors');