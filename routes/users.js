 var mongoose =  require("mongoose");
 var plm = require("passport-local-mongoose");

 mongoose.connect("mongodb://127.0.0.1:27017/n15db");

 var  userSchema =mongoose.Schema({
  username:String,
  password:Number,
  email: String,
  age:Number,
  image: {
    type:String,
    default:"def.png"
  },
  post:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:"post"
  }],
  key: String,
  data: String

 });

 userSchema.plugin(plm);
 module.exports = mongoose.model("user",userSchema);