const errorMiddleware=(err,req,res,next)=>{
    // fallback case here ....
    // handle when someone didnot give the required information related to this..
    err.statuscode=err.statuscode||500;
    err.message=err.message||"Something  went Wrong!!";
    return res.status(err.statuscode).json({
        success:false,
        message:err.message,
        stack:err.stack
    })

}

export default errorMiddleware;