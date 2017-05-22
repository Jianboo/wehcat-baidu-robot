// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var UserSchema = new Schema({
    openid :{type: String, required:"'openid' required."} ,
    createAt: {type: Date, required:"'createAt' required."},
    conversationCount: {type:Number, default: 0}
});

mongoose.model('User', UserSchema);

