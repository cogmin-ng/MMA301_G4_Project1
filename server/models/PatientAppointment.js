const mongoose=require('mongoose');
const schema=new mongoose.Schema({patient:{type:mongoose.Schema.Types.ObjectId,required:true,index:true},hospital:{type:mongoose.Schema.Types.ObjectId,ref:'PatientHospital',required:true},doctor:{type:mongoose.Schema.Types.ObjectId,ref:'PatientDoctor',required:true},date:{type:String,required:true,match:/^\d{4}-\d{2}-\d{2}$/},time:{type:String,required:true,match:/^([01]\d|2[0-3]):[0-5]\d$/},note:{type:String,trim:true,maxlength:500,default:''},status:{type:String,enum:['pending','confirmed','completed','cancelled'],default:'pending'}},{timestamps:true,collection:'patient_appointments'});
// Prevent active bookings for the same doctor + time slot, including under concurrent requests.
schema.index({doctor:1,date:1,time:1},{unique:true,partialFilterExpression:{status:{$in:['pending','confirmed']}}});
module.exports=mongoose.models.PatientAppointment||mongoose.model('PatientAppointment',schema);
