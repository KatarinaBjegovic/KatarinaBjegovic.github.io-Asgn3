class Pyramid {
    constructor() {
        this.type = 'pyramid';
        this.color = [0.5, 0.5, 0.5];
        this.matrix = new Matrix4();
    }

    render() {
        var rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        // Define pyramid vertices (square base and four triangular faces)
        let vertices = [
            // Base (square) - two triangles
            0, 0, 0,  1, 0, 1,  0, 0, 1,
            0, 0, 0,  1, 0, 0,  1, 0, 1,

            // Side 1 (Front)
            0, 0, 0,  1, 0, 0,  0.5, 1, 0.5,

            // Side 2 (Right)
            1, 0, 0,  1, 0, 1,  0.5, 1, 0.5,

            // Side 3 (Back)
            1, 0, 1,  0, 0, 1,  0.5, 1, 0.5,

            // Side 4 (Left)
            0, 0, 1,  0, 0, 0,  0.5, 1, 0.5
        ];

        // Draw each triangle
        for (let i = 0; i < vertices.length; i += 9) {
            drawTriangle3D(vertices.slice(i, i + 9));
        }
    }
}