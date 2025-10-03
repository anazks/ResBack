const mongoose = require('mongoose');
const ItemSchema = new mongoose.Schema({
    itemname: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    email :{
        type :String,
        required:true
    }
});

module.exports = mongoose.model('Item', ItemSchema);