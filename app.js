import {config} from 'dotenv';
config();


import express from'express';
const app=express();
import  cors from 'cors';
import cookieParser  from 'cookie-parser';
import morgan from 'morgan';
import userRoutes from './routes/user.routes.js';
import errorMiddleware from './middlewares/error.middleware.js';
import courseRoutes from './routes/course.routes.js';
import paymentRoutes from './routes/Payment.routes.js';
import miscRoutes from "./routes/miscellaneous.routes.js"



// this will parse parse the body information in json....
app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// this will allow to request or hit the another url from different origin...
//console.log(`cors link:-${process.env.FRONTEND_URL}`); // when you excessing then you get undefine
app.use(cors({
//    origin:'http://localhost:5173',
 origin: [process.env.FRONTEND_URL],
    credentials:true
}))

// app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/ping',(req,res)=>{
    res.send('pong');
});

// routes of 3 module...
app.use('/api/v1/user',userRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', miscRoutes);




app.all('*',(req,res)=>{
    res.status(404).send("OOPs !! 404 page is not found..")
});

// generic error middleware define here .... this is handle error of custom error class...
app.use(errorMiddleware);

export default app;