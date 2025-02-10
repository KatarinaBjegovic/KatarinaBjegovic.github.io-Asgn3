var VSHADER_SOURCE = `
    attribute vec4 a_position;
    uniform mat4 u_ModelMatrix; 
    uniform mat4 u_GlobalRotateMatrix;
    void main() {
        gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_position;
    }`

var FSHADER_SOURCE = `
    precision mediump float;
    uniform vec4 u_FragColor;
    void main() {
        gl_FragColor = u_FragColor;
    }`

let canvas;
let gl;
let a_position;
let u_FragColor;
let u_size;
let u_ModelMatrix;
let u_GlobalRotateMatrix;

function setupWebGL(){
    canvas = document.getElementById('webgl');
    //gl = getWebGLContext(canvas); 
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

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);
}


let g_globalAngleX = 0;
let g_globalAngleY = 0;
let g_globalAngleZ = 0;
let g_footAngle = 0;
let g_strummingHandAngle = 0;
let g_noteHandAngle = 0;
let g_headAngle = 0;
let g_stringHeight = 0;
let g_poked = false;

let g_leftHandSlider = 0; //[-35,35]
//g_strummingHandAngle // [-40,40]
let g_leftArmSlider = 0; //(0,20)
let g_shoulderAngleSldier = 0; // [0,50]


let g_isDragging = false;  // Flag to track if the mouse is being dragged
let g_initialX = 0;        // Initial X position when the mouse is clicked
let g_initialY = 0;
//let g_initialAngle = 0;    // Initial angle when the mouse is clicked


let g_animation = false;

let audioSLOW = new Audio('src/blockyAnimal/music/CSD.mp3');
let audioFAST = new Audio('src/blockyAnimal/music/BFMM.mp3');
let isPlayingSLOW = false;
let isPlayingFAST = false;

function addActionsForHTMLUI() {
    // Play slow audio when "Play" button is clicked and we are not "poked"
    document.getElementById('on').onclick = function() {
        g_animation = true;
        if (!isPlayingSLOW) {
            audioSLOW.play();
            isPlayingSLOW = true;
            console.log('Playing slow music');
        }
    };

    // Stop both audio when "Pause" button is clicked
    document.getElementById('off').onclick = function() {
        g_animation = false;
        g_poked = false; // Reset poke state

        if (isPlayingSLOW) {
            audioSLOW.pause();
            audioSLOW.currentTime = 0;  // Reset to the start
            isPlayingSLOW = false;
            console.log('Paused slow music');
        }
        
        if (isPlayingFAST) {
            audioFAST.pause();
            audioFAST.currentTime = 0;  // Reset to the start
            isPlayingFAST = false;
            console.log('Paused fast music');
        }
    };

    // Slider events
    document.getElementById("angle_slider").addEventListener('mousemove', function() { 
        g_globalAngleX = this.value; 
        renderAllShapes(); 
    });
    document.getElementById("hand").addEventListener('mousemove', function() { g_leftHandSlider = this.value; renderAllShapes(); });
    document.getElementById("shoulder").addEventListener('mousemove', function() { g_shoulderAngleSldier = this.value; renderAllShapes(); });
    document.getElementById("arm").addEventListener('mousemove', function() { g_leftArmSlider = this.value; renderAllShapes(); });
    document.getElementById("forearm").addEventListener('mousemove', function() { g_strummingHandAngle = this.value; renderAllShapes(); });
}


function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHTMLUI();

    gl.clearColor(0.75, 0.84, 0.9, 1.0);

    //gl.clear(gl.COLOR_BUFFER_BIT);


    canvas.addEventListener('click', function(ev) {
        if (ev.shiftKey) {
            g_poked = true;
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

    if (g_poked == true) {
        updateAnimationAnglesPOKE();
        if (!isPlayingFAST) {
            // Start fast audio when poked and slow audio is not playing
            if (isPlayingSLOW) {
                audioSLOW.pause();
                isPlayingSLOW = false;
            }
            audioFAST.play();
            isPlayingFAST = true;
        }
    } else {
        updateAnimationAngles();
        if (!isPlayingSLOW && g_animation == true) {
            // Start slow audio when poked is not true
            if (isPlayingFAST) {
                audioFAST.pause();
                isPlayingFAST = false;
            }
            audioSLOW.play();
            isPlayingSLOW = true;
        }
    }

    renderAllShapes();
    requestAnimationFrame(tick);
}


function convertCoordinatesEventToGL(ev){
    var x = ev.clientX; // x coordinate of a mouse pointer 
    var y = ev.clientY; // y coordinate of a mouse pointer 
    var rect = ev.target.getBoundingClientRect();
    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2); 
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return([x,y]);
}



function updateAnimationAngles(){
    if (g_animation) {
        g_headAngle = (22.5 * (Math.sin(3*g_seconds) + 1));
        g_footAngle = (10 * (Math.sin(3*g_seconds) + 1));
        g_noteHandAngle = (17.5 * (Math.sin(g_seconds) + 1));
        g_strummingHandAngle = (10 * (Math.sin(2.5 * g_seconds) + 1));
        g_stringHeight = 0.02 * (Math.sin(2.5 * g_seconds) + 1);
        g_leftHandSlider = 20 * Math.sin(7.5 * g_seconds);
    }
}

function updateAnimationAnglesPOKE(){
    if (g_animation) {
        g_headAngle = (35 * (Math.sin(5*g_seconds) + 1));
        g_footAngle = (10 * (Math.sin(10*g_seconds) + 1));
        g_noteHandAngle = (17.5 * (Math.sin(3*g_seconds) + 1));
        g_strummingHandAngle = 40 * Math.sin(5 * g_seconds);
        g_stringHeight = 0.02 * (Math.sin(5 * g_seconds) + 1);
        g_leftHandSlider = 5 * Math.sin(8 * g_seconds);
    }
}


function renderAllShapes(){

    var startTime = performance.now();

    // Combine rotations around the X, Y, and Z axes
    var rotationMatrix = new Matrix4();
    rotationMatrix.rotate(g_globalAngleX, 1, 0, 0);  // Rotate around X-axis
    rotationMatrix.rotate(g_globalAngleY, 0, 1, 0);  // Rotate around Y-axis
    rotationMatrix.rotate(g_globalAngleZ, 0, 0, 1);  // Rotate around Z-axis

    // Send the combined rotation matrix to the shader
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, rotationMatrix.elements);

    // Clear the screen and render the object
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT); 



// head animation  parts 
    var head = new Cube();
    head.color = [0.45,0.45,0.45,1.0];
    head.matrix.translate(-.2, 0.2, 0);
    head.matrix.rotate(-45,1,0,0);
    head.matrix.rotate(g_headAngle,1,0,0);
    headMatrix = new Matrix4(head.matrix);
    head.matrix.scale(0.4,0.4,0.2);
    head.render();

    var stripeOne = new Cube();
    stripeOne.color = [1,1,1,1.0];
    stripeOne.matrix = new Matrix4(headMatrix);
    stripeOne.matrix.translate(0.05, 0.31, -0.001);
    stripeOne.matrix.scale(0.04,0.1,0.21);
    stripeOne.render();
    
    var stripeTwo = new Cube();
    stripeTwo.color = [1,1,1,1.0];
    stripeTwo.matrix = new Matrix4(headMatrix);
    stripeTwo.matrix.translate(0.3, 0.31, -0.001);
    stripeTwo.matrix.scale(0.04,0.1,0.21);
    stripeTwo.render();

    var stripeThree = new Cube();
    stripeThree.color = [1,1,1,1.0];
    stripeThree.matrix = new Matrix4(headMatrix);
    stripeThree.matrix.translate(0.18, 0.26, -0.001);
    stripeThree.matrix.scale(0.04,0.15,0.21);
    stripeThree.render();

    var eyeOne = new Cube();
    eyeOne.color = [0.3,0,0,1.0];
    eyeOne.matrix = new Matrix4(headMatrix);
    eyeOne.matrix.translate(0.03, 0.05, -0.001);
    eyeOne.matrix.scale(0.1,0.2,0.2);
    eyeOne.render();

    var eyeTwo = new Cube();
    eyeTwo.color = [0.3,0,0,1.0];
    eyeTwo.matrix = new Matrix4(headMatrix);
    eyeTwo.matrix.translate(0.25, 0.1, -0.001);
    eyeTwo.matrix.scale(0.11,0.12,0.2);
    eyeTwo.render();

    var nose = new Cube();
    nose.color = [1,0.6,0.6,1];
    nose.matrix = new Matrix4(headMatrix);
    nose.matrix.translate(0.17, 0.06, -0.01);
    nose.matrix.scale(0.05,0.02,0.1);
    nose.render();

    var noseMid = new Cube();
    noseMid.color = [1,0.6,0.6,1];
    noseMid.matrix = new Matrix4(headMatrix);
    noseMid.matrix.translate(0.177, 0.05, -0.01);
    noseMid.matrix.scale(0.035,0.015,0.1);
    noseMid.render();

    var noseBottom = new Cube();
    noseBottom.color = [1,0.6,0.6,1];
    noseBottom.matrix = new Matrix4(headMatrix);
    noseBottom.matrix.translate(0.185, 0.04, -0.01);
    noseBottom.matrix.scale(0.02,0.015,0.1);
    noseBottom.render();

    var earLeft = new Cube();
    earLeft.color = [0.45,0.45,0.45,1.0];
    earLeft.matrix = new Matrix4(headMatrix);
    earLeft.matrix.translate(-0.05, 0.35, 0);
    earLeft.matrix.scale(0.1,0.1,0.2);
    earLeft.render();

    var earLeft2 = new Cube();
    earLeft2.color = [0.45,0.45,0.45,1.0];
    earLeft2.matrix = new Matrix4(headMatrix);
    earLeft2.matrix.translate(-0.05, 0.33, 0);
    earLeft2.matrix.scale(0.1,0.1,0.2);
    earLeft2.render();

    var earRight = new Cube();
    earRight.color = [0.45,0.45,0.45,1.0];
    earRight.matrix = new Matrix4(headMatrix);
    earRight.matrix.translate(.35, 0.35, 0);
    earRight.matrix.scale(0.1,0.1,0.2);
    earRight.render();

    var earRight2 = new Cube();
    earRight2.color = [0.45,0.45,0.45,1.0];
    earRight2.matrix = new Matrix4(headMatrix);
    earRight2.matrix.translate(.35, 0.33, 0);
    earRight2.matrix.scale(0.1,0.1,0.2);
    earRight2.render();

    var earring = new Cube();
    earring.color = [0.69,0.69,0.69,1.0];
    earring.matrix = new Matrix4(headMatrix);
    earring.matrix.translate(.47, 0.3, -0.001);
    earring.matrix.rotate(45, 0, 0, 1);
    earring.matrix.scale(0.01,0.07,0.21);
    earring.render();
    
    var earring2 = new Cube();
    earring2.color = [0.69,0.69,0.69,1.0];
    earring2.matrix = new Matrix4(headMatrix);
    earring2.matrix.translate(.47, 0.35, -0.001);
    earring2.matrix.rotate(45, 0, 0, 1);
    earring2.matrix.scale(0.01,0.07,0.21);
    earring2.render();

    var septum = new Pyramid();
    septum.color = [0,0,0,1.0];
    septum.matrix = new Matrix4(headMatrix);
    septum.matrix.translate(0.225, 0.035, -0.01);
    septum.matrix.rotate(40, 0, 0, 1);
    septum.matrix.scale(0.01,0.02,0.0005);
    septum.render();
    
    var septum2 = new Pyramid();
    septum2.color = [0,0,0,1.0];
    septum2.matrix = new Matrix4(headMatrix);
    septum2.matrix.translate(0.23, 0.035, -0.01);
    septum2.matrix.rotate(150, 0, 0, 1);
    septum2.matrix.scale(0.01,0.02,0.005);
    septum2.render();

    var septumLeft = new Pyramid();
    septumLeft.color = [0,0,0,1.0];
    septumLeft.matrix = new Matrix4(headMatrix);
    septumLeft.matrix.translate(0.16, 0.04, -0.01);
    septumLeft.matrix.rotate(-40, 0, 0, 1);
    septumLeft.matrix.scale(0.01,0.02,0.005);
    septumLeft.render();
    
    var septumLeft2 = new Pyramid();
    septumLeft2.color = [0,0,0,1.0];
    septumLeft2.matrix = new Matrix4(headMatrix);
    septumLeft2.matrix.translate(0.17, 0.04, -0.01);
    septumLeft2.matrix.rotate(-150, 0, 0, 1);
    septumLeft2.matrix.scale(0.01,0.02,0.05);
    septumLeft2.render();
// end of head animation parts



    var neck = new Cube();
    neck.color = [0.45,0.45,0.45,1.0];
    neck.matrix.translate(-.125, 0.14, 0);
    neck.matrix.scale(0.25,0.05,0.2);
    neck.render();

    var body = new Cube();
    body.color = [0.45,0.45,0.45,1.0];
    body.matrix.translate(-0.25, -0.55, 0);
    body.matrix.scale(0.5,0.68,0.2);
    body.render();

    var shirt = new Cube();
    shirt.color = [0,0,0,1.0];
    shirt.matrix.translate(-0.28, -0.1, -0.01);
    shirt.matrix.scale(0.55,0.2,0.22);
    shirt.render();
    
    var shirt2 = new Cube();
    shirt2.color = [0,0,0,1.0];
    shirt2.matrix.translate(-0.3, -0.15, -0.01);
    shirt2.matrix.scale(0.59,0.2,0.22);
    shirt2.render();

    var shirt3 = new Cube();
    shirt3.color = [0,0,0,1.0];
    shirt3.matrix.translate(-0.32, -0.38, -0.01);
    shirt3.matrix.scale(0.63,0.4,0.22);
    shirt3.render();

    var shirt4 = new Cube();
    shirt4.color = [0,0,0,1.0];
    shirt4.matrix.translate(-0.3, -0.4, -0.01);
    shirt4.matrix.scale(0.59,0.25,0.22);
    shirt4.render();

    var shirt5 = new Cube();
    shirt5.color = [0,0,0,1.0];
    shirt5.matrix.translate(-0.28, -0.43, -0.01);
    shirt5.matrix.scale(0.55,0.2,0.22);
    shirt5.render();

    var leftLeg = new Cube();
    leftLeg.color = [0.45,0.45,0.45,1.0];
    leftLeg.matrix.translate(-0.25, -0.85, -0.048);
    leftLeg.matrix.scale(0.24,0.38,0.25);
    leftLeg.render();

    var blendLeftLeg = new Cube();
    blendLeftLeg.color = [0.45,0.45,0.45,1.0];
    blendLeftLeg.matrix.translate(-0.25, -0.48, -0.03);
    blendLeftLeg.matrix.scale(0.24,0.05,0.2);
    blendLeftLeg.render();


    var rightLeg = new Cube();
    rightLeg.color = [0.45,0.45,0.45,1.0];
    rightLeg.matrix.translate(0.01, -0.85, -0.048);
    rightLeg.matrix.scale(0.24,0.38,0.25);
    rightLeg.render();

    var blendRightLeg = new Cube();
    blendRightLeg.color = [0.45,0.45,0.45,1.0];
    blendRightLeg.matrix.translate(0.01, -0.48, -0.03);
    blendRightLeg.matrix.scale(0.24,0.05,0.2);
    blendRightLeg.render();

// animation parts for foot tapping
    var leftFoot = new Cube();
    leftFoot.color = [0.35,0.35,0.35,1.0];
    leftFoot.matrix.translate(-0.25, -0.75, 0.01);
    leftFoot.matrix.rotate(180,1,0,0); 
    leftFoot.matrix.rotate(g_footAngle,1,0,0); //rotate from 0->40
    leftFoot.matrix.scale(0.24,0.1,0.15);
    leftFoot.render(); 
// end of parts for foot tapping

    var rightFoot = new Cube();
    rightFoot.color = [0.35,0.35,0.35,1.0];
    rightFoot.matrix.translate(0.01, -0.75, 0.01);
    rightFoot.matrix.rotate(180,90,0,0); 
    rightFoot.matrix.scale(0.24,0.1,0.15);
    rightFoot.render(); 




    var guitarArm = new Cube(); 
    guitarArm.color = [0.82,0.67,0.49,1.0];
    guitarArm.matrix.translate(0.2, -0.1, -0.1);
    guitarArm.matrix.rotate(45,0,0,1); 
    guitarArm.matrix.scale(0.5,0.1,0.05);
    guitarArm.render(); 

    var guitarTop = new Cube(); 
    guitarTop.color = [0.82,0.67,0.49,1.0];
    guitarTop.matrix.translate(0.57, 0.24, -0.1);
    guitarTop.matrix.rotate(45,0,0,1); 
    guitarTop.matrix.scale(0.19,0.14,0.05);
    guitarTop.render();

    var guitarTop2 = new Cube(); 
    guitarTop2.color = [0.82,0.67,0.49,1.0];
    guitarTop2.matrix.translate(0.6, 0.29, -0.1);
    guitarTop2.matrix.scale(0.1,0.1,0.05);
    guitarTop2.render();
    
    var guitarTop3 = new Cube(); 
    guitarTop3.color = [0.82,0.67,0.49,1.0];
    guitarTop3.matrix.translate(0.6, 0.37, -0.1);
    guitarTop3.matrix.scale(0.1,0.1,0.05);
    guitarTop3.render();

    var guitarNotch = new Cube(); 
    guitarNotch.color = [0,0,0,1.0];
    guitarNotch.matrix.translate(0.5, 0.35, -0.1);
    guitarNotch.matrix.rotate(45,0,0,1);  
    guitarNotch.matrix.scale(0.02,0.05,0.01);
    guitarNotch.render();

    var guitarNotch2 = new Cube(); 
    guitarNotch2.color = [0,0,0,1.0];
    guitarNotch2.matrix.translate(0.53, 0.39, -0.1);
    guitarNotch2.matrix.rotate(45,0,0,1); 
    guitarNotch2.matrix.scale(0.02,0.05,0.01);
    guitarNotch2.render();

    var guitarNotch3 = new Cube(); 
    guitarNotch3.color = [0,0,0,1.0];
    guitarNotch3.matrix.translate(0.57, 0.43, -0.1);
    guitarNotch3.matrix.rotate(45,0,0,1);
    guitarNotch3.matrix.scale(0.02,0.05,0.01);
    guitarNotch3.render();
    

    var guitarStrapShoulder = new Cube();
    guitarStrapShoulder.color = [0.3,0.1,0.1,1.0];
    guitarStrapShoulder.matrix.translate(0.25, 0.05, -0.05);
    guitarStrapShoulder.matrix.rotate(45,0,0,1);
    guitarStrapShoulder.matrix.scale(0.05,0.05,0.3);
    guitarStrapShoulder.render(); 

    var guitarStrapBack = new Cube(); 
    guitarStrapBack.color = [0.3,0.1,0.1,1.0];
    guitarStrapBack.matrix.translate(-0.32, -0.42, 0.2);
    guitarStrapBack.matrix.rotate(40,0,0,1); 
    guitarStrapBack.matrix.scale(0.75,0.05,0.05);
    guitarStrapBack.render(); 

    var guitarStrapFront = new Cube(); 
    guitarStrapFront.color = [0.3,0.1,0.1,1.0];
    guitarStrapFront.matrix.translate(-0.19, -0.27, -0.1);
    guitarStrapFront.matrix.rotate(220,0,0,1); 
    guitarStrapFront.matrix.scale(0.2,0.05,0.05);
    guitarStrapFront.render(); 

    var guitarStrapSide = new Cube(); 
    guitarStrapSide.color = [0.3,0.1,0.1,1.0];
    guitarStrapSide.matrix.translate(-0.32, -0.43, -0.05);
    guitarStrapSide.matrix.rotate(45,0,0,1); 
    guitarStrapSide.matrix.scale(0.05,0.05,0.3);
    guitarStrapSide.render(); 
    
    var guitarBase = new Cube(); 
    guitarBase.color = [0.31,0.21,0.23,1.0];
    guitarBase.matrix.translate(0, -0.4, -0.1);
    guitarBase.matrix.rotate(45,0,0,1); 
    guitarBase.matrix.scale(0.27,0.27,0.05);
    guitarBase.render(); 

    var guitarPart1 = new Cube(); 
    guitarPart1.color = [0.31,0.21,0.23,1.0];
    guitarPart1.matrix.translate(0.2, -0.17, -0.1);
    guitarPart1.matrix.rotate(45,0,0,1);
    guitarPart1.matrix.scale(0.05,0.2,0.05);
    guitarPart1.render(); 

    var guitarPart2 = new Cube(); 
    guitarPart2.color = [0.31,0.21,0.23,1.0];
    guitarPart2.matrix.translate(0.18, -0.2, -0.1);
    guitarPart2.matrix.rotate(45,0,0,1); 
    guitarPart2.matrix.scale(0.05,0.23,0.05);
    guitarPart2.render(); 

    var guitarCorner = new Cube(); 
    guitarCorner.color = [0.31,0.21,0.23,1.0];
    guitarCorner.matrix.translate(0.05, -0.1, -0.1);
    guitarCorner.matrix.rotate(45,0,0,1);
    guitarCorner.matrix.scale(0.15,0.15,0.05);
    guitarCorner.render(); 

    var guitarCornerExtra = new Cube(); 
    guitarCornerExtra.color = [0.31,0.21,0.23,1.0];
    guitarCornerExtra.matrix.translate(-0.05, -0.13, -0.1);
    guitarCornerExtra.matrix.scale(0.15,0.15,0.05);
    guitarCornerExtra.render(); 

    var guitarCornerOther = new Cube(); 
    guitarCornerOther.color = [0.31,0.21,0.23,1.0];
    guitarCornerOther.matrix.translate(0.18, -0.22, -0.1);
    guitarCornerOther.matrix.rotate(25,0,0,1);
    guitarCornerOther.matrix.scale(0.15,0.08,0.05);
    guitarCornerOther.render(); 

    var guitarLowerPart1 = new Cube(); 
    guitarLowerPart1.color = [0.31,0.21,0.23,1.0];
    guitarLowerPart1.matrix.translate(-0.05, -0.41, -0.1);
    guitarLowerPart1.matrix.rotate(45,0,0,1); 
    guitarLowerPart1.matrix.scale(0.09,0.22,0.05);
    guitarLowerPart1.render(); 

    var guitarLowerPart2 = new Cube(); 
    guitarLowerPart2.color = [0.31,0.21,0.23,1.0];
    guitarLowerPart2.matrix.translate(-0.09, -0.41, -0.1);
    guitarLowerPart2.matrix.rotate(45,0,0,1); 
    guitarLowerPart2.matrix.scale(0.05,0.17,0.05);
    guitarLowerPart2.render(); 

    var guitarHole = new Cube(); 
    guitarHole.color = [0.2,0.1,0.1,1.0];
    guitarHole.matrix.translate(-0.02, -0.32, -0.11);
    guitarHole.matrix.rotate(45,0,0,1); 
    guitarHole.matrix.scale(0.2,0.13,0.01);
    guitarHole.render(); 

    var guitarBand = new Cube(); 
    guitarBand.color = [0.82,0.67,0.49,1.0];
    guitarBand.matrix.translate(-0.03, -0.33, -0.115);
    guitarBand.matrix.rotate(45,0,0,1);  
    guitarBand.matrix.scale(0.03,0.13,0.02);
    guitarBand.render(); 

// animation parts for string
    var guitarStringOne = new Cube(); 
    guitarStringOne.color = [0,0,0,1.0];
    guitarStringOne.matrix.translate(-0.07, -0.27, -0.13); 
    guitarStringOne.matrix.translate(0,g_stringHeight,0); // shift y up and down +- .03
    guitarStringOne.matrix.rotate(45,0,0,1);
    var guitarStringMatrix = new Matrix4(guitarStringOne.matrix);  
    guitarStringOne.matrix.scale(0.9,0.01,0.05);
    guitarStringOne.render(); 

    var guitarStringTwo = new Cube(); 
    guitarStringTwo.color = [0,0,0,1.0];
    guitarStringTwo.matrix = new Matrix4(guitarStringMatrix);
    guitarStringTwo.matrix.translate(0.01, -0.02, 0);
    guitarStringTwo.matrix.scale(0.9,0.01,0.05);
    guitarStringTwo.render(); 

    var guitarStringThree = new Cube(); 
    guitarStringThree.color = [0,0,0,1.0];
    guitarStringThree.matrix = new Matrix4(guitarStringMatrix);
    guitarStringThree.matrix.translate(0, -0.045, 0);
    guitarStringThree.matrix.scale(0.9,0.01,0.05);
    guitarStringThree.render(); 

// end of animation parts for string

    var leftShoulder= new Cube();
    leftShoulder.color = [0,0,0,1.0];
    leftShoulder.matrix.translate(-0.32, -0.08, 0);
    leftShoulder.matrix.rotate(g_shoulderAngleSldier,1,0,0); // g_shoulderAngle (0, 50)
    leftShoulder.matrix.rotate(35,0,0,1); 
    var leftShoulderMatrix = new Matrix4(leftShoulder.matrix);
    leftShoulder.matrix.scale(0.14,0.12,0.15);
    leftShoulder.render(); 

    var leftArm = new Cube();
    leftArm.color = [0.16,0.19,0.33,1.0];
    leftArm.matrix = new Matrix4(leftShoulderMatrix);
    leftArm.matrix.translate(-0.095, -0.09, -0.2);
    //leftArm.matrix.rotate(180,0,0,0);
    leftArm.matrix.rotate(-30,0,0,1);
    leftArm.matrix.rotate(45,1,0,0); 
    leftArm.matrix.rotate(g_leftArmSlider, 1,0,0);
    //leftArm.matrix.rotate(20,0,0,0);
    //leftArm.matrix.rotate(40,0,0,1);
    var leftArmMatrix = new Matrix4(leftArm.matrix);
    leftArm.matrix.scale(0.1,0.35,0.1);
    leftArm.render(); 


// start of strumming hand animation parts 
    var leftForearm= new Cube();
    leftForearm.color = [0.16,0.19,0.33,1.0];
    leftForearm.matrix = new Matrix4(leftArmMatrix);
    leftForearm.matrix.rotate(-45,1,0,0); 
    leftForearm.matrix.translate(0.04, 0.21, -0.03);
    leftForearm.matrix.translate(0, -0.3, 0);
    //leftForearm.matrix.rotate(-1,0,1,0);
    //leftForearm.matrix.rotate(-45,1,0,0); 
    //leftForearm.matrix.rotate(-5,0,0,1);
    leftForearm.matrix.rotate(g_strummingHandAngle,0,0,1); // 0->20 degrees or slider 
    var leftForearmMatrix = new Matrix4(leftForearm.matrix);
    leftForearm.matrix.scale(0.25,0.1,0.1);
    leftForearm.render(); 

    var leftHand= new Cube();
    leftHand.color = [0.45,0.45,0.45, 1.0];
    leftHand.matrix = new Matrix4(leftForearmMatrix);
    leftHand.matrix.translate(0.23, 0, 0);
    leftHand.matrix.rotate(g_leftHandSlider,0,0,1); // g_leftHandSlider (35, -35)
    leftHand.matrix.scale(0.15, 0.1,0.1);
    leftHand.render(); 
    
// end of strumming hand animation parts 


    
    var rightShoulder = new Cube();
    rightShoulder.color = [0,0,0,1.0];
    rightShoulder.matrix.translate(0.25, -0.08, 0);
    rightShoulder.matrix.rotate(45,0,0,1); 
    rightShoulder.matrix.scale(0.14,0.12,0.15);
    rightShoulder.render(); 
    

    var rightArm = new Cube();
    rightArm.color = [0.16,0.19,0.33,1.0];
    rightArm.matrix.translate(0.45, -0.15, -.14);
    rightArm.matrix.rotate(60,1,0,0);
    rightArm.matrix.rotate(50,0,0,1); 
    rightArm.matrix.rotate(30,0,1,0);
    rightArm.matrix.scale(0.12,0.3,0.1);
    rightArm.render(); 


    var rightElbow = new Cube();
    rightElbow.color = [0.16,0.19,0.33,1.0];
    rightElbow.matrix.translate(0.48, -0.2, -.22);
    rightElbow.matrix.rotate(45,0,0,1);
    rightElbow.matrix.scale(0.13,0.09,0.17);
    rightElbow.render(); 

// start of note playing hand animation parts
    var rightForearm = new Cube();
    rightForearm.color = [0.16,0.19,0.33,1.0];
    rightForearm.matrix.translate(0.45, -0.15, -.22);
    rightForearm.matrix.rotate(25,0,0,1);
    rightForearm.matrix.rotate(g_noteHandAngle,0,0,1); // move from 0-->35
    var rightForearmMatrix = new Matrix4(rightForearm.matrix);
    rightForearm.matrix.scale(0.12,0.21,0.1);
    rightForearm.render(); 

    var rightHand = new Cube();
    rightHand.color = [0.45,0.45,0.45,1.0];
    rightHand.matrix = new Matrix4(rightForearmMatrix);
    rightHand.matrix.translate(0, 0.20, 0);
    rightHand.matrix.scale(0.12,0.12,0.1);
    rightHand.render(); 

// end of note playing hand animation parts





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
 