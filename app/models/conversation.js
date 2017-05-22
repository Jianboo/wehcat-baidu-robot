// Example model

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var ConversationSchema = new Schema({
    user:{type: Schema.ObjectId, ref:'User', required: "'user' required."} ,
    question: {type: String, required:"'createAt' required."},
    answer: {type:String, default: ''},
    createAt: {type: Date, required:"'createAt' required."},
});

mongoose.model('Conversation', ConversationSchema);

