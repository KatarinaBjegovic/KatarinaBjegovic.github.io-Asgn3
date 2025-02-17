class Camera {
    constructor() {
        this.eye = new Vector3([0, 0, 3]);
        this.at = new Vector3([0, 0, -100]);
        this.up = new Vector3([0, 1, 0]);
    }

    forward() {
        var f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        f = f.normalize();
        f = f.mul(0.5);
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    back() {
        var f = new Vector3();
        f = f.set(this.eye);
        f = f.sub(this.at);
        f = f.normalize();
        f = f.mul(0.5);
        this.eye = this.eye.add(f);
        this.at = this.at.add(f);
    }

    left() {
       var f = new Vector3();
       f = f.set(this.at);
       f = f.sub(this.eye);
       var s = new Vector3();
       s = Vector3.cross(this.up, f);
       s = s.normalize();
       s = s.mul(0.5);
       this.eye = this.eye.add(s);
       this.at = this.at.add(s);
    }

    right() {
        var f = new Vector3();
       f = f.set(this.at);
       f = f.sub(this.eye);
       var s = new Vector3();
       s = Vector3.cross(f, this.up);
       s = s.normalize();
       s = s.mul(0.5);
       this.eye = this.eye.add(s);
       this.at = this.at.add(s);
    }

    panLeft(alpha) {
        var f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        var rotMat = new Matrix4();
        rotMat = rotMat.setRotate(alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotMat.multiplyVector3(f);
        var helperV = new Vector3();
        helperV = helperV.set(this.eye); // copy so that i dont alter orginal eye... 
        this.at = helperV.add(f_prime);
    }

    panRight(alpha) {
        var f = new Vector3();
        f = f.set(this.at);
        f = f.sub(this.eye);
        var rotMat = new Matrix4();
        rotMat = rotMat.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]);
        var f_prime = rotMat.multiplyVector3(f);
        var helperV = new Vector3();
        helperV = helperV.set(this.eye); // copy so that i dont alter orginal eye... 
        this.at = helperV.add(f_prime); 
    }
}




//  panRight(alpha) {
//     var f = this.at.sub(this.eye); 
//     var rotationMatrix = new Matrix4(); 
//     rotationMatrix.setRotate(-alpha, this.up.elements[0], this.up.elements[1], this.up.elements[2]); 
//     var f_prime = rotationMatrix.multiplyVector3(f);  
//     this.at = this.eye.add(f_prime);  
// }