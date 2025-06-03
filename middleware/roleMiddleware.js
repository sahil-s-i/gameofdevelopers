//this middleware is used to check if the user role is valid for the end point or not if the user is loggeed in
function allowRoles(roles) {
    return (req,res,next)=>{
        const userRole = req.user?.role;

        if(!userRole){
            return  res.status(401).json({error:'Role not found in token'});
        }

        if(!roles.includes(userRole)){
            return res.status(403).json({error:'Access denied: insufficient role'});

        }
        next();
    };
}

module.exports = allowRoles;