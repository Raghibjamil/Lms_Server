import mongoose from 'mongoose';

mongoose.set('strictQuery',false);

const connectToDB=()=>{
    mongoose.connect(process.env.MONGO_URL)
    .then((conn)=>{
        console.log(`mongodb connect in :- ${conn.connection.host}`);

    }).catch((err)=>{
        console.log(`you get the error in connection of mongo db :-${err}`)
    })
}

export default connectToDB;