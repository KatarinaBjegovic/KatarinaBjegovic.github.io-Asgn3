var VSHADER_SOURCE = `
    precision mediump float;
    attribute vec4 a_position;
    attribute vec2 a_UV;
    varying vec2 v_UV;
    uniform mat4 u_ModelMatrix; 
    uniform mat4 u_GlobalRotateMatrix;
    uniform mat4 u_ViewMatrix;
    uniform mat4 u_ProjectionMatrix;
    void main() {
        gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_GlobalRotateMatrix * u_ModelMatrix * a_position;
        v_UV = a_UV;
    }`

var FSHADER_SOURCE = `
    precision mediump float;
    varying vec2 v_UV;
    uniform vec4 u_FragColor;     // Base color
    uniform sampler2D u_Sampler0; // sky
    uniform sampler2D u_Sampler1; // dirt
    uniform sampler2D u_Sampler2; // background
    uniform sampler2D u_Sampler3; // grass
    uniform int u_whichTexture;

    void main() {
        if (u_whichTexture == -2) {
            gl_FragColor = u_FragColor;
        } else if (u_whichTexture == -1) {
            gl_FragColor = vec4(v_UV, 1.0, 1.0); 
        } else if (u_whichTexture == 0) {
            gl_FragColor = texture2D(u_Sampler0, v_UV);  // sky texture
        } else if (u_whichTexture == 1) {
            gl_FragColor = texture2D(u_Sampler1, v_UV);  // dirt texture
        }else if (u_whichTexture == 2) {
            gl_FragColor = texture2D(u_Sampler2, v_UV);  // background texture
        }else if (u_whichTexture == 3) {
            gl_FragColor = texture2D(u_Sampler3, v_UV);  // grass texture
        } else {
            gl_FragColor = vec4(1.0, 0.2, 0.2, 1.0);  // error texture
        }
    }`

let canvas;
let gl;
let a_position;
let a_UV;
let u_FragColor;
let u_size;
let u_ModelMatrix;
let u_ProjectionMatrix;
let u_ViewMatrix;
let u_GlobalRotateMatrix;
let u_Sampler0;
let u_Sampler1;
let u_Sampler2;
let u_Sampler3;
let u_whichTexture

function setupWebGL(){
    canvas = document.getElementById('webgl');
    gl = canvas.getContext( "webgl", { preserveDrawingBuffer: true} );
    if (!gl) {
        console.log('Failed to get the rendering context');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL(){
    if (!initShaders(gl,VSHADER_SOURCE, FSHADER_SOURCE)){
        console.log('Failed to initialize shaders');
        return;
    }
    a_position = gl.getAttribLocation(gl.program, 'a_position')
    if (a_position < 0) {
        console.log('Failed to get the storage location of a_position');
        return;
    }
    a_UV = gl.getAttribLocation(gl.program, 'a_UV')
    if (a_UV < 0) {
        console.log('Failed to get the storage location of a_UV');
        return;
    }
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }
    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get the storage location of u_ModelMatrix');
        return;
    }
    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get the storage location of u_GlobalRotateMatrix');
        return;
    }
    u_ProjectionMatrix = gl.getUniformLocation(gl.program, 'u_ProjectionMatrix');
    if (!u_ProjectionMatrix) {
        console.log('Failed to get the storage location of u_ProjectionMatrix');
        return;
    }
    u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
    if (!u_ViewMatrix) {
        console.log('Failed to get the storage location of u_ViewMatrix');
        return;
    }

    u_Sampler0 = gl.getUniformLocation(gl.program, 'u_Sampler0');
    if (!u_Sampler0){
        console.log('Failed to get the storage location of u_Sampler0');
        return;
    }

    u_Sampler1 = gl.getUniformLocation(gl.program, 'u_Sampler1');
    if (!u_Sampler1){
        console.log('Failed to get the storage location of u_Sampler1');
        return;
    }

    u_Sampler2 = gl.getUniformLocation(gl.program, 'u_Sampler2');
    if (!u_Sampler2){
        console.log('Failed to get the storage location of u_Sampler2');
        return;
    }

    u_Sampler3 = gl.getUniformLocation(gl.program, 'u_Sampler3');
    if (!u_Sampler3){
        console.log('Failed to get the storage location of u_Sampler3');
        return;
    }

    u_whichTexture = gl.getUniformLocation(gl.program, 'u_whichTexture');
    if (!u_whichTexture) {
        console.log('Failed to get the storage location of u_whichTexture');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}



let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalAngleZ = 0;

let g_initialX = 0;        
let g_initialY = 0;
let grow = 0;

let addBlock = false

function addActionsForHTMLUI() {

    document.getElementById("angle_slider").addEventListener('mousemove', function() { 
        g_globalAngleX = this.value; 
        renderAllShapes(); 
    });
    document.getElementById("addBlockButton").addEventListener('click', function(){
        addBlock = true;
    });
    document.getElementById("deleteBlockButton").addEventListener('click', function(){
        addBlock = false;
    });
    

}


function initTexture(gl, n) {
    var sky = new Image();
    if (!sky) {
        console.log("Failed to create the image object");
        return false;
    }
    sky.onload = function(){ sendTexture0toGLSL(sky);}

    sky.src = './src/sky.jpg';

    var dirt = new Image();
    if (!dirt) {
        console.log("Failed to create the image object");
        return false;
    }
    dirt.onload = function(){ sendTexture1toGLSL(dirt);}

    dirt.src = './src/dirt.jpg';

    var background = new Image();
    if (!background) {
        console.log("Failed to create the image object");
        return false;
    }
    background.onload = function(){ sendTexture2toGLSL(background);}

    background.src = './src/background.jpg';

    var grass = new Image();
    if (!grass) {
        console.log("Failed to create the image object");
        return false;
    }
    grass.onload = function(){ sendTexture3toGLSL(grass);}

    grass.src = './src/grass.jpg';

    // add more textures here later
    return true;
}

// could rename to sendImageToTexture0.... when wanting to add more textures 
function sendTexture0toGLSL(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("failed to creaet the texture object");
        return false;
    }
 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler0, 0);

    console.log("finished loadTexture SKY ");
}

function sendTexture1toGLSL(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("failed to creaet the texture object");
        return false;
    }
 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler1, 1);

    console.log("finished loadTexture DIRT");
}

function sendTexture2toGLSL(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("failed to creaet the texture object");
        return false;
    }
 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler2, 2);

    console.log("finished loadTexture background");
}

function sendTexture3toGLSL(image) {
    var texture = gl.createTexture();
    if (!texture) {
        console.log("failed to creaet the texture object");
        return false;
    }
 
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,  gl.RGB, gl.UNSIGNED_BYTE, image); 
    gl.uniform1i(u_Sampler3, 3);

    console.log("finished loadTexture GRASS");
}


function main() {
    setupWebGL();

    connectVariablesToGLSL();

    addActionsForHTMLUI();

    initTexture(gl, 0);

    // more texture later here if needed

    gl.clearColor(0,0,0,1);

    document.onkeydown = keydown;


    canvas.addEventListener('click', function() {
        console.log("clicked");
        if (addBlock){
            addBlockInFront();
        } else {
            removeBlockInFront();
        }
    });

    // Handle mouse interactions to control global rotation
    canvas.addEventListener('mousedown', function(ev) {
        g_isDragging = true;
        // Get the initial mouse X position and corresponding angle
        g_initialX = ev.clientX;
        g_initialY = ev.clientY;
    });

    canvas.addEventListener('mousemove', function(ev) {
        if (g_isDragging) {
            // Calculate the change in mouse position (delta)
            const deltaX = ev.clientX - g_initialX;
            const deltaY = ev.clientY - g_initialY;

            // Update rotation angles based on the mouse movement
            g_globalAngleY += deltaX * 0.2;  // Adjust sensitivity with 0.2
            g_globalAngleX -= deltaY * 0.2;  // Adjust sensitivity with 0.2

            // Optional: Limit the rotation on the X-axis to prevent it from going beyond 90 degrees
            g_globalAngleX = Math.max(Math.min(g_globalAngleX, 90), -90);

            // Update initial positions for the next move calculation
            g_initialX = ev.clientX;
            g_initialY = ev.clientY;

            renderAllShapes();  // Re-render the object with updated angles
        }
    });

    canvas.addEventListener('mouseup', function(ev) {
        g_isDragging = false;  // Stop dragging when the mouse is released
    });

    canvas.addEventListener('mouseleave', function() {
        g_isDragging = false;  // Also stop dragging if the mouse leaves the canvas
    });

    

    renderAllShapes();

    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;

function tick() {
    g_seconds = performance.now() / 1000.0 - g_startTime;
    renderAllShapes();
    requestAnimationFrame(tick);
}


var g_camera = new Camera()

function keydown(ev) {
    // Use WASD for movement and Q/E for panning
    if (ev.keyCode == 87) {  // W key
        g_camera.forward();
    } else if (ev.keyCode == 83) {  // S key
        g_camera.back();
    } else if (ev.keyCode == 65) {  // A key
        g_camera.left();
    } else if (ev.keyCode == 68) {  // D key (for moving right)
        g_camera.right();  // Add this line to move right
    } else if (ev.keyCode == 81) {  // Q key (pan left)
        g_camera.panLeft(10); // You can adjust the rotation angle (e.g., 10 degrees)
    } else if (ev.keyCode == 69) {  // E key (pan right)
        g_camera.panRight(10); // You can adjust the rotation angle (e.g., 10 degrees)
    }

    
    renderAllShapes();  // Make sure this function is rendering with the updated camera
    console.log(ev.keyCode);
}
// var g_map = [
//     [1,1,1,1,1],
//     [1,1,1,1,1],
//     [1,1,1,1,1],
//     [1,1,1,1,1]
// ]

var g_map = [
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 0]
    
];



function getBlockInFront() {
    // var helperVeye = new Vector3();
    // helperVeye = helperVeye.set(g_camera.eye);
    // var direction = helperVeye.sub(g_camera.at); // Direction the camera is looking in
    var helperVat = new Vector3();
    helperVat = helperVat.set(g_camera.at);
    var direction = helperVat.sub(g_camera.eye);
    direction = direction.normalize();
    var stepSize = 1.0; // You can tweak this depending on how precise you want to be
    var maxDistance = 3; // Max distance to check for blocks

    
    var helperVeye = new Vector3();
    helperVeye = helperVeye.set(g_camera.eye);
    //direction = direction.mul(stepSize * i)
    var checkPosition = helperVeye.add(direction);
    //console.log(`at elements  ${checkPosition.elements[0]}, ${checkPosition.elements[2]}`);
    var x = Math.floor(checkPosition.elements[0]+4);  // Adjusting for map offset
    var y = Math.floor(checkPosition.elements[2]+4);  // Adjusting for map offset
    if (x >= 0 && x < g_map.length && y >= 0 && y < g_map[0].length) {
        // Check if there's a block at this position
        console.log(`sending ${x}, ${y}`);
        if (g_map[x][y] === 1) {
            return { x: x, y: y };  // Return the coordinates of the block
        }
    }

    return null;  // No block found
}


var count = 0 ;
var altered = false;



function removeBlockInFront() {
    var block = getBlockInFront();
    if (block) {
        console.log(`removing ${block.x}, ${block.y}`);
        g_map[block.x][block.y] = 0;
        grow = grow + 0.1;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderAllShapes();  // Re-render the map to reflect the change
        altered = true;
    } else {
        console.log("No block found in front of the camera.");
    }
}

function addBlockInFront() {
    var block = getBlockInFront();
    if (block) {
        console.log(`adding ${block.x}, ${block.y}`);
        g_map[block.x][block.y] = 1;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        renderAllShapes();  // Re-render the map to reflect the change
    } else {
        console.log("No block found in front of the camera. WHYY");
    }
}


function drawMap() {

    for ( x=0; x<32; x++ ) {
        for ( y=0; y<32; y++) {
            if (g_map[x][y] == 1) {
                var wall = new Pyramid();
                wall.color = [1,1,1,1];
                wall.textureNum = 3;
                wall.matrix.translate(x-0.8,-0.75, y-0.8);
                wall.matrix.translate(-2,0,-2);
                // wall.matrix.translate(-2,0,0);
                wall.matrix.scale(0.3,5,0.3);
                wall.render();
            }
        }
    }
}


var g_mapRocks = [
    [1, 0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 0, 1, 0, 0, 0, 1],
    [0, 0, 0, 0, 0, 0, 1, 0],
    [1, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0, 1]
    
];




function drawRocks() {

    for ( x=0; x<8; x++ ) {
        for ( y=0; y<8; y++) {
            if (g_mapRocks[x][y] == 1) {
                var wall = new Cube();
                wall.color = [0.5,0.5,0.5,1];
                wall.textureNum = -2;
                wall.matrix.translate(x*4,-0.75, y*4);
                // wall.matrix.translate(-2,0,0);
                wall.matrix.scale(0.3,0.3,0.3);
                wall.render();
            }
        }
    }
}


function renderAllShapes(){

    var startTime = performance.now();

    var projMat = new Matrix4();
    projMat.setPerspective(60, canvas.width/canvas.height, 0.1, 100);
    gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

    var viewMat = new Matrix4();

    viewMat.setLookAt(
        g_camera.eye.elements[0], g_camera.eye.elements[1] + grow, g_camera.eye.elements[2],
        g_camera.at.elements[0], g_camera.at.elements[1] + grow, g_camera.at.elements[2],
        g_camera.up.elements[0], g_camera.up.elements[1], g_camera.up.elements[2]);
    // viewMat.setLookAt(0,0,3,  0,0,-100,  0,1,0);
    gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

    // Combine rotations around the X, Y, and Z axes
    var rotationMatrix = new Matrix4();
    rotationMatrix.rotate(g_globalAngleX, 1, 0, 0);  // Rotate around X-axis
    rotationMatrix.rotate(g_globalAngleY, 0, 1, 0);  // Rotate around Y-axis
    rotationMatrix.rotate(g_globalAngleZ, 0, 0, 1);  // Rotate around Z-axis
    // taller 




    // Send the combined rotation matrix to the shader
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotationMatrix.elements);

    // Clear the screen and render the object
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT); 

    drawMap();
    drawRocks();

    var floor = new Cube();
    floor.color = [1,0,0,1];
    floor.textureNum = 1;
    floor.matrix.translate(0,-0.75,0);
    floor.matrix.translate(13,0,0);
    floor.matrix.translate(0,0,13);
    floor.matrix.scale(32,0,32);
    floor.matrix.translate(-0.5,0,-0.5);
    floor.render();

    var sky = new Cube();
    sky.color = [1,0,0,1];
    sky.textureNum = 2;
    sky.matrix.scale(60,60,60);
    sky.matrix.translate(-0.5,-0.5,-0.5);
    sky.render();

    var duration = performance.now() - startTime;
    sendTextToHTML((" ms: " + Math.floor(duration) + " fps: " + Math.floor(10000/duration)), 'outputDiv');
}

function sendTextToHTML(text, html_ID){
    var htmlElm = document.getElementById(html_ID);
    if (!htmlElm) {
        console.log("Failed to get " + htmlElm + " from HTML");
        return;
    }
    htmlElm.innerHTML = text;
}
 
