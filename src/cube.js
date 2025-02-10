class Cube{
    constructor(){
        this.type = 'cube';
        //this.position = [0.0,0.0,0.0];
        this.color = [0.5,0.5,0.5];
        //this.size = 5.0;
        //this.segments = 10;
        this.matrix = new Matrix4()
    }
    render() {
        //var xy = this.position;
        var rgba = this.color;
        //var size = this.size;
        //gl.vertexAttrib3f(a_position, xy[0], xy[1], 0.0);
        // gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        // //gl.uniform1f(u_size, size);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);


       
        // other sides of the cube... 
        // Define all six faces (two triangles per face)
        gl.uniform4f(u_FragColor, rgba[0]*0.85, rgba[1]*0.85, rgba[2]*0.85 , rgba[3]);
// Front face
        drawTriangle3D([0, 0, 0,  1, 1, 0,  1, 0, 0]);
        drawTriangle3D([0, 0, 0,  0, 1, 0,  1, 1, 0]);
//back face
        drawTriangle3D([0, 0, 1,  1, 1, 1,  1, 0, 1]);
        drawTriangle3D([0, 0, 1,  0, 1, 1,  1, 1, 1]);

//top face
        gl.uniform4f(u_FragColor, rgba[0]*0.9, rgba[1]*0.9, rgba[2]*0.9 , rgba[3]);
        
        drawTriangle3D([0, 1, 0,  1, 1, 1,  0, 1, 1]);
        drawTriangle3D([0, 1, 0,  1, 1, 0,  1, 1, 1]);
//bottom face
        drawTriangle3D([0, 0, 0,  1, 0, 1,  0, 0, 1]);
        drawTriangle3D([0, 0, 0,  1, 0, 0,  1, 0, 1]);

        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
//left and right sides

        drawTriangle3D([0, 0, 0,  0, 1, 1,  0, 1, 0]);
        drawTriangle3D([0, 0, 0,  0, 0, 1,  0, 1, 1]);

        drawTriangle3D([1, 0, 0,  1, 1, 1,  1, 1, 0]);
        drawTriangle3D([1, 0, 0,  1, 0, 1,  1, 1, 1]);

    }
}

// verticies in single buffer if i wanted to worry abotu performance
