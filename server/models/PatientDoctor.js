const mongoose=require('mongoose');
const schema=new mongoose.Schema({name:{type:String,required:true},specialty:{type:String,default:''},hospital:{type:mongoose.Schema.Types.ObjectId,ref:'PatientHospital',required:true},workingDays:{type:[Number],default:[1,2,3,4,5]},workingSlots:{type:[String],default:['08:00','09:00','10:00','14:00','15:00']},active:{type:Boolean,default:true}},{timestamps:true,collection:'patient_doctors'});
module.exports=mongoose.models.PatientDoctor||mongoose.model('PatientDoctor',schema);
