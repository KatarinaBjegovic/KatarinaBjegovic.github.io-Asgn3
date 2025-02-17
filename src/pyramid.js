class Pyramid {
    constructor() {
        this.type = 'pyramid';
        this.color = [0.5, 0.5, 0.5];
        this.matrix = new Matrix4();
        this.textureNum = 0;
    }

    render() {
        var rgba = this.color;

        gl.uniform1i(u_whichTexture, this.textureNum);
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Data array containing all vertices and UV coordinates
        var pyramidData = [
            // Base (2 triangles)
            {
                vertices: [0, 0, 0,  1, 0, 1,  0, 0, 1,  0, 0, 0,  1, 0, 0,  1, 0, 1],
                uvs: [0, 0,  1, 1,  0, 1,  0, 0,  1, 0,  1, 1]
            },
            // Side 1 (Front)
            {
                vertices: [0, 0, 0,  1, 0, 0,  0.5, 1, 0.5],
                uvs: [0, 0,  1, 0,  0.5, 1]
            },
            // Side 2 (Right)
            {
                vertices: [1, 0, 0,  1, 0, 1,  0.5, 1, 0.5],
                uvs: [0, 0,  1, 0,  0.5, 1]
            },
            // Side 3 (Back)
            {
                vertices: [1, 0, 1,  0, 0, 1,  0.5, 1, 0.5],
                uvs: [0, 0,  1, 0,  0.5, 1]
            },
            // Side 4 (Left)
            {
                vertices: [0, 0, 1,  0, 0, 0,  0.5, 1, 0.5],
                uvs: [0, 0,  1, 0,  0.5, 1]
            }
        ];

        // Loop through the pyramid data and draw all triangles for each face
        for (let face of pyramidData) {
            drawTriangle3DUV(face.vertices, face.uvs);
        }
    }
}