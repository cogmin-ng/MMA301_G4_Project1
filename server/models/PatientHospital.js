const mongoose=require('mongoose');
const schema=new mongoose.Schema({name:{type:String,required:true,trim:true},address:{type:String,default:''},active:{type:Boolean,default:true}},{timestamps:true,collection:'patient_hospitals'});
module.exports=mongoose.models.PatientHospital||mongoose.model('PatientHospital',schema);
