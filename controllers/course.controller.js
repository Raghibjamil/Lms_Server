import Course from '../models/course.model.js';
import AppError from "../utils/error.util.js";
import fs from "fs/promises";
import path from "path";
import cloudinary from "cloudinary";
import Razorpay from 'razorpay';



/**
 * @ALL_COURSES
 * @ROUTE @GET {{URL}}/api/v1/courses
 * @ACCESS Public
 */
 const  getAllCourses = async (req, res, next) => {
    // Find all the courses without lectures
    try {
        const courses = await Course.find({}).select('-lectures');
  
        res.status(200).json({
          success: true,
          message: 'All courses',
          courses,
        });
      }catch(error){
        return next(
            new AppError(error || 'some error getting when we fecthing the course details...', 500)
          );
      }
 };

 /**
 * @GET_LECTURES_BY_COURSE_ID
 * @ROUTE @POST {{URL}}/api/v1/courses/:id
 * @ACCESS Private(ADMIN, subscribed users only)
 */
 const getLecturesByCourseId = async (req, res, next) => {
    try{
        const { id } = req.params;
  
        const course = await Course.findById(id);
      
        if (!course) {
          return next(new AppError('Invalid course id or course not found.', 404));
        }
      
        res.status(200).json({
          success: true,
          message: 'Course lectures fetched successfully',
          lectures: course.lectures,
        });
    }catch(error){
        return next(new AppError(error || 'geting error when fetching data of lecture through id .....',500));
    }
   
  };

   /**
 * @CREATE_COURSE
 * @ROUTE @POST {{URL}}/api/v1/courses
 * @ACCESS Private (admin only)
 */

  const createCourse=async (req,res,next)=>{
    const { title, description, category, createdBy } = req.body;

    if (!title || !description || !category || !createdBy) {
      return next(new AppError('All fields are required', 400));
    }
  
    const course = await Course.create({
      title,
      description,
      category,
      createdBy,
      thumbnail: {
        public_id: "dumy",
        secure_url: "dumy",
      },
    });
  
    if (!course) {
      return next(
        new AppError('Course could not be created, please try again', 400)
      );
    }

      // Run only if user sends a file
  if (req.file) {
    console.log(req.file)
    try {
      const result = await cloudinary.v2.uploader.upload(req.file.path, {
        folder: 'lms', // Save files in a folder named lms
      });

      // If success
      if (result) {
        // Set the public_id and secure_url in array
        course.thumbnail.public_id = result.public_id;
        course.thumbnail.secure_url = result.secure_url;
      }

      // After successful upload remove the file from local storage
      fs.rm(`uploads/${req.file.filename}`);

    }catch(err){
      return next(new AppError("file not uploaded......" || 500));
    }
  }
    // Save the changes
    await course.save();

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      course,
    });
}


/**
 * @UPDATE_COURSE_BY_ID
 * @ROUTE @PUT {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */


const updateCourse= async(req,res,next)=>{
 // Extracting the course id from the request params
 const { id } = req.params;

 // Finding the course using the course id
 const course = await Course.findByIdAndUpdate(
   id,
   {
     $set: req.body, // This will only update the fields which are present
   },
   {
     runValidators: true, // This will run the validation checks on the new data
   }
 );

 // If no course found then send the response for the same
 if (!course) {
   return next(new AppError('Invalid course id or course not found.', 400));
 }


 // Sending the response after success
 res.status(200).json({
   success: true,
   message: 'Course updated successfully',
 });
}

/**
 * @DELETE_COURSE_BY_ID
 * @ROUTE @DELETE {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin only)
 */


const removeCourse=async (req,res,next)=>{
  // Extracting id from the request parameter
  try{
    const { id } = req.params;

    // Finding the course via the course ID
    const course = await Course.findById(id);
  
    // If course not find send the message as stated below
    if (!course) {
      return next(new AppError('Course with given id does not exist.', 404));
    }
  
    // Remove course
    await Course.findByIdAndDelete(id);
  
    // Send the message as response
    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  }catch(error){
    return next(new AppError(error||500));
  }
 
}

/**
 * @ADD_LECTURE
 * @ROUTE @POST {{URL}}/api/v1/courses/:id
 * @ACCESS Private (Admin Only)
 */

const addLectureToCourseById=async (req,res,next)=>{
  try{
    const { title, description } = req.body;
    const { id } = req.params;
  
   
  
    if (!title || !description) {
      return next(new AppError('Title and Description are required', 400));
    }
  
    const course = await Course.findById(id);
  
    if (!course) {
      return next(new AppError('Invalid course id or course not found.', 400));
    }
    let lectureData = {
      title,
      description,
      lecture:{}
    };
  
         // Run only if user sends a file
         if (req.file) {
          console.log(req.file)
          try {
            const result = await cloudinary.v2.uploader.upload(req.file.path, {
              folder: 'lms', // Save files in a folder named lms
            });
      
            // If success
            if (result) {
              // Set the public_id and secure_url in array
              lectureData.lecture.public_id = result.public_id;
              lectureData.lecture.secure_url = result.secure_url;
            }
      
            // After successful upload remove the file from local storage
            fs.rm(`uploads/${req.file.filename}`);
      
          }catch(err){
            return next(new AppError("file not uploaded......" || 500));
          }
        }
          course.lectures.push(lectureData);
          course.numberOfLectures=course.lectures.length;
  
          // Save the course object
  
          await course.save();
  
          res.status(200).json({
            success: true,
            message: 'Course lecture added successfully',
            course,
          });
  }catch(error){
    return next(error||500);
  }
 
}
/**
 * @Remove_LECTURE
 * @ROUTE @DELETE {{URL}}/api/v1/courses/:courseId/:lectureId
 * @ACCESS Private (Admin only)
 */

const removeLectureFromCourse=async(req,res,next)=>{
    // Grabbing the courseId and lectureId from req.query
    // const { courseId, lectureId } = req.query;
    // const {courseId}=req.params.courseId;
    // const {lectureId}=req.params.lectureId;
    const { courseId, lectureId } = req.params;


    console.log(courseId);
    console.log(lectureId);
  
    // Checking if both courseId and lectureId are present
    if (!courseId) {
      return next(new AppError('Course ID is required', 400));
    }
  
    if (!lectureId) {
      return next(new AppError('Lecture ID is required', 400));
    }
  
    // Find the course uding the courseId
    const course = await Course.findById(courseId);
  
    // If no course send custom message
    if (!course) {
      return next(new AppError('Invalid ID or Course does not exist.', 404));
    }
  
    // Find the index of the lecture using the lectureId
    const lectureIndex = course.lectures.findIndex(
      (lecture) => lecture._id.toString() === lectureId.toString()
    );
  
    // If returned index is -1 then send error as mentioned below
    if (lectureIndex === -1) {
      return next(new AppError('Lecture does not exist.', 404));
    }
  
    // Delete the lecture from cloudinary
    await cloudinary.v2.uploader.destroy(
      course.lectures[lectureIndex].lecture.public_id,
      // {
      //   resource_type: 'video',
      // }
    );
  
    // Remove the lecture from the array
    course.lectures.splice(lectureIndex, 1);
  
    // update the number of lectures based on lectres array length
    course.numberOfLectures = course.lectures.length;
  
    // Save the course object
    await course.save();
  
    // Return response
    res.status(200).json({
      success: true,
      message: 'Course lecture removed successfully',
    });

}

  export {
    getAllCourses,getLecturesByCourseId,createCourse
    ,updateCourse,removeCourse,addLectureToCourseById,
    removeLectureFromCourse
  }