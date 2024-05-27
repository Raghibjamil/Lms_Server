import {Schema,model} from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
const userSchema=new Schema({
    fullName:{
        type:'String',
        required:[true,'Name is required'],
        minLength:[5,'Name must be at least 5 character'],
        maxLength:[50,'Name should be less than 50 characters'],
        trim:true,
    },
    email:{
        type:'String',
        required:true,
        lowercase:true,
        trim:true,
        unique:true,
        match:[
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            'Please fill in a valid email address',
          ], // Matches email against regex

    },
    password:{
        type:'String',
        required:[true,'password is required'],
        minlength:[5,'password must be at least 8 characters'],
        select:false,// will not select password upon looking up a document
    },
    avatar:{
        public_id:{
            type:'String'
        },
        secure_url:{
            type:'String'
        }
    },
    role:{
        type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',

    },
    forgotPasswordToken: String,
    forgotPasswordExpiry: Date,
    subscription:{
      id:String,
      status:String
    }

},{timestamps:true});

// pre is hook here inside the express.....
userSchema.pre('save',async function(next){
    if(!this.isModified('password')){
        return next();
    }
    this.password=await bcrypt.hash(this.password,10);
});


// custom methods...
userSchema.methods = {
    // method which will help us compare plain password with hashed password and returns true or false
    comparePassword: async function (plainPassword) {
      return await bcrypt.compare(plainPassword, this.password);
    },
  
    // Will generate a JWT token with user id as payload
    generateJWTToken: async function () {
      return await jwt.sign(
        // { id: this._id,email:this.email },

        { id: this._id,email:this.email,role: this.role, subscription: this.subscription },

        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRY,
        }
      );
    },

      // This will generate a token for password reset
  generatePasswordResetToken: async function () {
    // creating a random token using node's built-in crypto module
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Again using crypto module to hash the generated resetToken with sha256 algorithm and storing it in database
    this.forgotPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Adding forgot password expiry to 15 minutes
    this.forgotPasswordExpiry = Date.now() + 1 * 60 * 1000;

    return resetToken;
  },
}


const User = model('User',userSchema);
export default User;