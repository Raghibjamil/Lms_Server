import User from '../models/user.model.js';
import { razorpay } from '../server.js';
import AppError from '../utils/error.util.js';
import crypto from 'crypto';
import Payment from '../models/Payemnt.model.js';

/**
 * @GET_RAZORPAY_ID
 * @ROUTE @POST {{URL}}/api/v1/payments/razorpay-key
 * @ACCESS Public
 */
export const getRazorpayApiKey= async(req,res,next)=>{
    res.status(200).json({
        success: true,
        message: 'Razorpay API key',
        key: process.env.RAZORPAY_KEY_ID,
      });
}

/**
 * @ACTIVATE_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/subscribe
 * @ACCESS Private (Logged in user only)
 */

export const buySubscription= async(req,res,next)=>{
  try{
 // Extracting ID from request obj
 const { id } = req.user;

 // Finding the user based on the ID
 const user = await User.findById(id);

//  console.log(user);

 if (!user) {
   return next(new AppError('Unauthorized, please login'));
 }

 // Checking the user role
 if (user.role === 'ADMIN') {
   return next(new AppError('Admin cannot purchase a subscription', 400));

 }


try {
  const subscription = await razorpay.subscriptions.create({
    plan_id: process.env.RAZORPAY_PLAN_ID, // The unique plan ID
    customer_notify: 1, // 1 means Razorpay will handle notifying the customer, 0 means you will notify the customer
   total_count: 12, // 12 means it will charge every month for a 1-year subscription
  });

  console.log('Subscription created successfully:', subscription);
  user.subscription.id = subscription.id;
  user.subscription.status = subscription.status;

  console.log(user.subscription);
 

} catch (error) {
  console.error('Error creating subscription:', error);
}

  

  // console.log(user.subscription.id);
  // console.log(user.subscription.status);

  // Saving the user object
  await user.save();

  res.status(200).json({
    success: true,
    message: 'subscribed successfully',
    subscription_id: user.subscription.id,
  });
  }catch(err){
    return next(new AppError(err.message, 400));
  }
 
}
/**
 * @VERIFY_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/verify
 * @ACCESS Private (Logged in user only)
 */

export const verifySubscription= async(req,res,next)=>{
  const { id } = req.user;
  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature } =
    req.body;

  // Finding the user
  const user = await User.findById(id);
  if (!user) {
    return next(new AppError('Unauthorized, please login'));
  }

  // Getting the subscription ID from the user object
  const subscriptionId = user.subscription.id;

  // Generating a signature with SHA256 for verification purposes
  // Here the subscriptionId should be the one which we saved in the DB
  // razorpay_payment_id is from the frontend and there should be a '|' character between this and subscriptionId
  // At the end convert it to Hex value

  /**crypto.createHmac('sha256', process.env.RAZORPAY_SECRET): This creates an HMAC object using the SHA-256 algorithm and your Razorpay secret key (process.env.RAZORPAY_SECRET).

.update(${razorpay_payment_id}|${subscriptionId}): This updates the HMAC object with the data you want to generate the HMAC for. It concatenates the Razorpay payment ID and subscription ID with a pipe (|) separator.

.digest('hex'): This computes the digest of the HMAC as a hexadecimal string. The resulting generatedSignature is the HMAC signature for the concatenated data. */
  // const generatedSignature = crypto
  //   .createHmac('sha256', process.env.RAZORPAY_SECRET)
  //   .update(`${razorpay_payment_id}|${subscriptionId}`)
  //   .digest('hex');
  // const generatedSignature = hmac_sha256(razorpay_payment_id + "|" + subscriptionId, process.env.RAZORPAY_SECRET);

  const generatedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_SECRET)
  .update(`${razorpay_payment_id}|${subscriptionId}`)
  .digest('hex');


  console.log(`Secret value:-${process.env.RAZORPAY_SECRET}`);

    console.log(`razorpay_payment_id:-${razorpay_payment_id}`);
    
  // Check if generated signature and signature received from the frontend is the same or not
  console.log(`generatedSignature: ${generatedSignature} `);
  console.log(`razorpay_signature: ${razorpay_signature}`);
  //console.log( razorpay_signature);
  if (generatedSignature !== razorpay_signature) {
    return next(new AppError('Payment not verified, please try again.', 400));
  }

  // If they match create payment and store it in the DB
  await Payment.create({
    razorpay_payment_id,
    razorpay_subscription_id,
    razorpay_signature,
  });

  // Update the user subscription status to active (This will be created before this)
  user.subscription.status = 'active';

  // Save the user in the DB with any changes
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully',
  });
}

/**
 * @CANCEL_SUBSCRIPTION
 * @ROUTE @POST {{URL}}/api/v1/payments/unsubscribe
 * @ACCESS Private (Logged in user only)
 */

export const cancelSubscription= async(req,res,next)=>{
  const { id } = req.user;

  // Finding the user
  const user = await User.findById(id);

  if (!user) {
    return next(
      new AppError('user does not exit please login !!!', 400)
    );
  }



  // Checking the user role
  if (user.role === 'ADMIN') {
    return next(
      new AppError('Admin does not need to cannot cancel subscription', 400)
    );
  }

  // Finding subscription ID from subscription
  const subscriptionId = user.subscription.id;

  // Creating a subscription using razorpay that we imported from the server
  try {
    const subscription = await razorpay.subscriptions.cancel(
      subscriptionId // subscription id
    );

    // Adding the subscription status to the user account
    user.subscription.status = subscription.status;

    // Saving the user object
    await user.save();
  } catch (error) {
    // Returning error if any, and this error is from razorpay so we have statusCode and message built in
    return next(new AppError(error.description, error.statusCode));
  }

  // Finding the payment using the subscription ID
  const payment = await Payment.findOne({
    razorpay_subscription_id: subscriptionId,
  });

  console.log(`razorpay_subscription_id:- ${payment}`);

  // Getting the time from the date of successful payment (in milliseconds)
  const timeSinceSubscribed = Date.now() - payment.createdAt;

  // refund period which in our case is 14 days
  const refundPeriod = 14 * 24 * 60 * 60 * 1000;

  // Check if refund period has expired or not
  if (refundPeriod <= timeSinceSubscribed) {
    return next(
      new AppError(
        'Refund period is over, so there will not be any refunds provided.',
        400
      )
    );
  }

  // If refund period is valid then refund the full amount that the user has paid
  await razorpay.payments.refund(payment.razorpay_payment_id, {
    speed: 'optimum', // This is required
  });

  console.log("payment succesfully refunded!!");

  console.log(`payment.razorpay_payment_id:-${payment.razorpay_payment_id}`);

  user.subscription.id = undefined; // Remove the subscription ID from user DB
  user.subscription.status = undefined; // Change the subscription Status in user DB

  await user.save();
    // Delete the payment record
    // await Payment.deleteOne({ id: payment._id });
    const result = await Payment.deleteOne({ razorpay_payment_id: payment.razorpay_payment_id });

    console.log(result);
    console.log('Payment record deleted successfully');

  // Send the response
  res.status(200).json({
    success: true,
    message: 'Subscription canceled successfully',
  });

}
/**
 * @GET_RAZORPAY_ID
 * @ROUTE @GET {{URL}}/api/v1/payments
 * @ACCESS Private (ADMIN only)
 */
export const allPayments=async(req,res,next)=>{
  const { count, skip } = req.query;

  // Find all subscriptions from razorpay
  const allPayments = await razorpay.subscriptions.all({
    count: count ? count : 10, // If count is sent then use that else default to 10
    skip: skip ? skip : 0, // // If skip is sent then use that else default to 0
  });

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const finalMonths = {
    January: 0,
    February: 0,
    March: 0,
    April: 0,
    May: 0,
    June: 0,
    July: 0,
    August: 0,
    September: 0,
    October: 0,
    November: 0,
    December: 0,
  };

  const monthlyWisePayments = allPayments.items.map((payment) => {
    // We are using payment.start_at which is in unix time, so we are converting it to Human readable format using Date()
    const monthsInNumbers = new Date(payment.start_at * 1000);

    return monthNames[monthsInNumbers.getMonth()];
  });

  monthlyWisePayments.map((month) => {
    Object.keys(finalMonths).forEach((objMonth) => {
      if (month === objMonth) {
        finalMonths[month] += 1;
      }
    });
  });

  const monthlySalesRecord = [];

  Object.keys(finalMonths).forEach((monthName) => {
    monthlySalesRecord.push(finalMonths[monthName]);
  });

  res.status(200).json({
    success: true,
    message: 'All payments',
    allPayments,
    finalMonths,
    monthlySalesRecord,
  });

}