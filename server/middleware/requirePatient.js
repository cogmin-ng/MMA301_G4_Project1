/** Adapter: mount your EXISTING auth middleware before patientRouter.
 * It must populate req.user = { _id (or id), role: 'Patient' }.
 * This check MUST NOT trust a patientId sent by the client.
 */
module.exports=(req,res,next)=>{
 const user=req.user;
 if(!user)return res.status(401).json({message:'Bạn cần đăng nhập'});
 if(String(user.role).toLowerCase()!=='patient')return res.status(403).json({message:'Chức năng dành cho bệnh nhân'});
 if(!(user._id||user.id))return res.status(401).json({message:'Phiên đăng nhập không hợp lệ'});
 next();
};
