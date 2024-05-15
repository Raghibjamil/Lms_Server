import { Router } from 'express';
import { addLectureToCourseById, createCourse, getAllCourses, getLecturesByCourseId, removeCourse, removeLectureFromCourse, updateCourse } from '../controllers/course.controller.js';
import { authorizeRoles, authorizeSubscribers, isLoggedIn } from '../middlewares/auth.middleware.js';
const router = Router();
import upload from "../middlewares/multer.middlewire.js"

// here we are defining the routes through using of route for router....
router
  .route('/')
  .get(getAllCourses).
  post(isLoggedIn,authorizeRoles("ADMIN"),upload.single('thumbnail'),createCourse);

  router
  .route('/:id')
  .get(isLoggedIn,authorizeSubscribers, getLecturesByCourseId)  
  /**Added authorizeSubscribers to check if user is admin or subscribed if not then forbid the access to the lectures */ 
  .put(isLoggedIn,authorizeRoles("ADMIN"),updateCourse)
  .delete(isLoggedIn,authorizeRoles("ADMIN"),removeCourse)
  .post(isLoggedIn,authorizeRoles("ADMIN"),upload.single('lecture'),addLectureToCourseById);

  router.route('/:courseId/:lectureId')
  .delete(isLoggedIn, authorizeRoles('ADMIN'), removeLectureFromCourse);



  export default router;