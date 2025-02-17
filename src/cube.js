class Cube{
    constructor(){
        this.type = 'cube';
        //this.position = [0.0,0.0,0.0];
        this.color = [1,1,1,1];
        //this.size = 5.0;
        //this.segments = 10;
        this.matrix = new Matrix4()
        this.textureNum = 0;
    }
    render() {
        //var xy = this.position;
        var rgba = this.color;
        gl.uniform1i(u_whichTexture , this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // front of cube
        drawTriangle3DUV([0, 0, 0, 1, 1, 0, 1, 0, 0], [0, 0, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 0, 0, 0, 1, 0, 1, 1, 0], [0, 0, 0, 1, 1, 1]);

// back of cube
        drawTriangle3DUV([0, 0, 1, 1, 1, 1, 1, 0, 1], [1, 0, 0, 1, 0, 0]); // Reversed U to show back face correctly.
        drawTriangle3DUV([0, 0, 1, 0, 1, 1, 1, 1, 1], [1, 0, 1, 1, 0, 1]); // Reversed U to show back face correctly.

        gl.uniform4f(u_FragColor, rgba[0] * 0.9, rgba[1] * 0.9, rgba[2] * 0.9, rgba[3]);

    // Top of the cube
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 1, 1, 1], [0, 1, 1, 1, 1, 0]);
        drawTriangle3DUV([0, 1, 0, 1, 1, 1, 1, 1, 0], [0, 1, 1, 0, 0, 0]);

// Bottom of the cube
        drawTriangle3DUV([0, 0, 0, 0, 0, 1, 1, 0, 1], [0, 0, 0, 1, 1, 1]);
        drawTriangle3DUV([0, 0, 0, 1, 0, 1, 1, 0, 0], [0, 0, 1, 1, 1, 0]);

        gl.uniform4f(u_FragColor, rgba[0] * 0.8, rgba[1] * 0.8, rgba[2] * 0.8, rgba[3]);

// Right side of the cube
        drawTriangle3DUV([1, 1, 0, 1, 1, 1, 1, 0, 0], [0, 1, 1, 1, 0, 0]);
        drawTriangle3DUV([1, 0, 0, 1, 1, 1, 1, 0, 1], [0, 0, 1, 1, 1, 0]);

// Left side of the cube
        drawTriangle3DUV([0, 1, 0, 0, 1, 1, 0, 0, 0], [1, 1, 0, 1, 1, 0]); // reversed U to correct texture.
        drawTriangle3DUV([0, 0, 0, 0, 1, 1, 0, 0, 1], [1, 0, 0, 1, 0, 0]); // reversed U to correct texture.

     }


     renderfaster() {
        var rgba = this.color;
    
        gl.uniform1i(u_whichTexture , this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);
    
        // Data array containing all vertices and UV coordinates
        var cubeData = [
            // Front face (2 triangles)
            {
                vertices: [0,0,0,  1,1,0,  1,0,0,  0,0,0,  0,1,0,  1,1,0],
                uvs: [0,0,  1,1,  1,0,  0,0,  0,1,  1,1]
            },
            // Back face (2 triangles)
            {
                vertices: [0, 0, 1,  1, 1, 1,  1, 0, 1,  0, 0, 1,  0, 1, 1,  1, 1, 1],
                uvs: [0, 0,  1, 1,  1, 0,  0, 0,  0, 1,  1, 1]
            },
            // Top face (2 triangles)
            {
                vertices: [0, 1, 0,  0, 1, 1,  1, 1, 1,  0, 1, 0,  1, 1, 1,  1, 1, 0],
                uvs: [0, 0,  0, 1,  1, 1,  0, 0,  1, 1,  1, 0]
            },
            // Bottom face (2 triangles)
            {
                vertices: [0, 0, 0,  0, 0, 1,  1, 0, 1,  0, 0, 0,  1, 0, 1,  1, 0, 0],
                uvs: [0, 0,  0, 1,  1, 0,  0, 0,  1, 0,  1, 1]
            },
            // Right face (2 triangles)
            {
                vertices: [1, 1, 0,  1, 1, 1,  1, 0, 0,  1, 0, 0,  1, 1, 1,  1, 0, 1],
                uvs: [0, 0,  0, 1,  1, 0,  0, 0,  1, 1,  1, 0]
            },
            // Left face (2 triangles)
            {
                vertices: [0, 1, 0,  0, 1, 1,  0, 0, 0,  0, 0, 0,  0, 1, 1,  0, 0, 1],
                uvs: [0, 0,  0, 1,  0.5, 0,  0.5, 1,  1, 1,  1, 0]
            }
        ];
    
        // Loop through the cube data and draw all triangles for each face
        for (let face of cubeData) {
                drawTriangle3DUV(face.vertices, face.uvs);
        }
    }
    
}



// verticies in single buffer if i wanted to worry abotu performance
