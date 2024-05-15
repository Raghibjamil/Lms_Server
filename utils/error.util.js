// here we are defining the custom class in express for finding the error and extends with the Error buildin class.... that will return instance of error object....

class AppError extends Error{
    constructor(message,statuscode){
        super(message);
        this.statuscode=statuscode;

        Error.captureStackTrace(this,this.constructor);
    }
}

export default AppError;