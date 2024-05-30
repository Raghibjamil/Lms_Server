import mongoose from 'mongoose';

mongoose.set('strictQuery',false);

<<<<<<< HEAD

// const MONGOCONN=process.env.MONGO_ATLAS_URL || process.env.MONGO_URL;
const MONGOCONN=process.env.MONGO_URL

const connectToDB=()=>{
    mongoose.connect(MONGOCONN)
=======
const connectToDB=()=>{
    mongoose.connect(process.env.MONGO_URL)
>>>>>>> d4821f82de7329aadc603d9929de43f8a38b1b0a
    .then((conn)=>{
        console.log(`mongodb connect in :- ${conn.connection.host}`);

    }).catch((err)=>{
        console.log(`you get the error in connection of mongo db :-${err}`)
    })
}

export default connectToDB;