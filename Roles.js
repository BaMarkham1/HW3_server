var mongoose = require('mongoose');
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://bendb:bendb@cluster0-gvkpo.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);

var RoleSchema = new Schema({
    movie_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    actor_id: {type: mongoose.Schema.Types.ObjectId, required: true},
    char_name: { type: String, required: true },
    actor_name : {type: String, required: false},
    movie_name : {type: String, required: false},
    movie_img : {type: String, required: false},
    img_url : {type: String, required: false}
});

module.exports = mongoose.model('Role', RoleSchema, 'roles');