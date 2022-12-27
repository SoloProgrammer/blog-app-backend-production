const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
    userid:{
        type:Schema.Types.ObjectId,
        ref:'users',
        require:true,
        unique:true
    },
    name:{
        type:String,
        required:true
    },
    stars:{
        type:Number,
        require:true,
        default:0
    },
    review:{
        type:String,
        default:""
    }
},{
    timestamps:true
})

module.exports = mongoose.model('feedbacks',FeedbackSchema)