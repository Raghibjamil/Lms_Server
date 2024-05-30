import mongoose from 'mongoose';

mongoose.set('strictQuery',false);


// const MONGOCONN=process.env.MONGO_ATLAS_URL || process.env.MONGO_URL;
const MONGOCONN=process.env.MONGO_URL

const connectToDB=()=>{
    mongoose.connect(MONGOCONN)
    .then((conn)=>{
        console.log(`mongodb connect in :- ${conn.connection.host}`);

    }).catch((err)=>{
        console.log(`you get the error in connection of mongo db :-${err}`)
    })
}

export default connectToDB;