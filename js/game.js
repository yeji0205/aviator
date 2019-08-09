var Colors = {
    red: 0xf25346,
    white: 0xd8d0d1,
    brown: 0x59332e,
    pink: 0xF5986E,
    brownDark: 0x23190f,
    blue: 0x68c3c0,
};


// THREEJS RELATED VARIABLES

var scene,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, HEIGHT, WIDTH,
    renderer, container;

function createScene() {
    // Get the width and theh height of the screen,
    // use them to set up the aspect ratio of the camera 
    // and the size of the renderer.
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;

    // create the scene
    scene = new THREE.Scene();

    //create the camera
    fieldOfView = 60;
    aspectRatio = WIDTH / HEIGHT;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
        fieldOfView,
        aspectRatio,
        nearPlane,
        farPlane
    );

    // add a fog effect to the scene; same color as the backgroud
    // color used in the style sheet
    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);  // (color, near distance, far distance) of fog effect 
    // set the position of the camera
    camera.position.x = 0;
    camera.position.z = 200;
    camera.position.y = 90;

    // create the RENDERER
    renderer = new THREE.WebGLRenderer({
        alpha: true,  // Allow transparency to show the gradient background. we deifned in the CSS
        antialias: true  // The smoothing of the image or sound roughness when adjusting position of things in our game. 
    });


    renderer.setSize(WIDTH, HEIGHT);  // define the size of the renderer; in this case it will fill the entire screen
    renderer.shadowMap.enabled = true;  // Enable shadow rendering

    // Add the DOM element of the renderer to the container we created in the HTML
    container = document.getElementById('world');
    container.appendChild(renderer.domElement);

    // listen to the screen if the user resizes it
    // We have to update the camera and the renderer size
    window.addEventListener('resize', handleWindowResize, false);
}


// HANDLE SCREEN EVENTS

function handleWindowResize() {
    // update height and width of the renderer and the camera
    HEIGHT = window.innerHeight;
    WIDTH = window.innerWidth;
    renderer.setSize(WIDTH, HEIGHT);
    camera.aspect = WIDTH / HEIGHT;
    camera.updateProjectionMatrix();
}


// LIGHT
var hemisphereLight, shadowLight;

function createLight() {
    // a hemisphere light is a gradient colored light
    // 1st parameter: sky color 2nd parameter: ground color 3rd parameter: intensity of the light
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9)

    // a directional light shines from a specific direction
    // it acts like the sun, that means all the rays produced are parallel
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);

    // set the directions of the light
    shadowLight.position.set(150, 350, 350)
    shadowLight.castShadow = true;  // allow shadow casting

    // define the visible area of the projected shadow 
    shadowLight.shadow.camera.left = -400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = -400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

    // define the resolution of the shadow, the higher is better
    // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    // to activate the lights, just add them to the scene
    scene.add(hemisphereLight);
    scene.add(shadowLight);
}



// OBJECTS
// First let's define a Sea object :
Sea = function() {
    // create the geometry(shape) of the cylinder
    // the parameters are: radius top, buttom, height, num of segments on the radius, num of segments vertically
    var geom = new THREE.CylinderGeometry(700, 700, 1000, 40, 10);

    // rotate the geometry on the x axis
    geom.applyMatrix(new THREE.Matrix4().makeRotationX(-Math.PI/2));

    // create the material
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.blue,
        transparent: true,
        opacity:.6,
        shading:THREE.FlatShading,
    });

    // to create an object in Three.js, we have to create a mesh
    // which is a combination of a geometry and some material
    this.mesh = new THREE.Mesh(geom, mat);

    // allow the sea to receive shadows
    this.mesh.receiveShadow = true;
}

var sea;
function createSea(){
    sea = new Sea();

    // push it a little bit at the bottom of the scene
    sea.mesh.position.y = -700;

    // add the mesh of the sea to the scene
    scene.add(sea.mesh);
}


// CLOUD

Cloud = function(){
    // create an empty container that will hold the different parts of the cloud
    this.mesh = new THREE.Object3D();

    // create a cube geometry;
    // this shape will be duplicated to creat the cloud
    var geom = new THREE.BoxGeometry(20,20,20);

    // create a material, a simple white material will do the trick
    var mat = new THREE.MeshPhongMaterial({
        color:Colors.white,
    });

    // duolicate the geometry a random number of times
    var nBlocs = 3+Math.floor(Math.random()*3);
    for(var i=0 ; i<nBlocs ; i++){
        // create the mesh by cloning the geometry
        var m = new THREE.Mesh(geom, mat);

        // se the position and the rotation of each cube randomly
        m.position.x = i*15;
        m.position.y = Math.random()*10;
        m.position.z = Math.random()*10;
        m.position.z = Math.random() * Math.PI*2;
        m.position.y = Math.random() * Math.PI * 2;

        // set the size of the cube randomly
        var s = .1 + Math.random()*.9;
        m.scale.set(s,s,s);

        // allow each cube to cast and to receive shadows
        m.castShadow = true;
        m.receiveShadow = true;

        // add the cube to the container we first created
        this.mesh.add(m);
    }
}


// SKY

Sky = function(){
    // create an empty container
    this.mesh = new THREE.Object3D();

    // choose a number of clouds to be scattered in the sky
    this.nClouds = 20;

    // to distribute the clouds consistently, we need to place them 
    // according to a uniform angle
    var stepAngle = Math.PI*2 / this.nClouds;

    // create the clouds
    for (var i=0; i < this.nClouds; i++) {
        var c = new Cloud();

        // set the rotation and the position of each cloud;
        // for that we use a bit of trigonometry
        var a = stepAngle*i; // this is the final angle of the cloud
        var h = 750 + Math.random()*200;  // this is the distance between the center of the axis and the cloud itself

        // // we are simply converting polar coordinates (angle, distance) into Cartesian coordinates (x, y)
        c.mesh.position.y = Math.sin(a)*h;
        c.mesh.position.x = Math.cos(a)*h;

        // rotate the cloud  accoding to its position
        c.mesh.rotation.z = a + Math.PI/2;

        // for a better result, we position the clouds at random depths inside of the scene
        c.mesh.position.z = -400-Math.random()*400;

        // we also set a random scale for each cloud
        var s = 1+Math.random()*2;
        c.mesh.scale.set(s,s,s);

        // do not forget to add the mesh of each cloud in the scene
        this.mesh.add(c.mesh);
    }
}


// now we instantiate the sky and push its center a bit towards the bottom of the screen 
var sky;

function createSky(){
    sky = new Sky();
    sky.mesh.position.y = -600;
    scene.add(sky.mesh);
}


var AirPlane = function(){
    this.mesh = new THREE.Object3D();
    this.mesh.name = "airPlane";


    // create the cabin
    var geomCockpit = new THREE.BoxGeometry(80,50,50,1,1,1);
    var matCocpit = new THREE.MeshPhongMaterial({
        color:Colors.red, 
        shading: THREE.FlatShading,
    });

    // we can access a specific vertex of a shape through
    // the vertices array and then move its x,y and z property
    geomCockpit.vertices[4].y-=10;
    geomCockpit.vertices[4].z+= 20;
    geomCockpit.vertices[5].y -= 10;
    geomCockpit.vertices[5].z -= 20;
    geomCockpit.vertices[6].y += 30;
    geomCockpit.vertices[6].z += 20;
    geomCockpit.vertices[7].y += 30;
    geomCockpit.vertices[7].z -= 20;


    var cockpit = new THREE.Mesh(geomCockpit, matCocpit);
    cockpit.castShadow = true;
    cockpit.receiveShadow = true;
    this.mesh.add(cockpit);


    //create the engine
    var geomEngine = new THREE.BoxGeometry(20, 50, 50, 1, 1, 1);
    var matEngine = new THREE.MeshPhongMaterial({
        color:Colors.white,
        shading: THREE.FlatShading
    });
    var engine = new THREE.Mesh(geomEngine, matEngine);
    engine.position.x = 40;
    engine.castShadow = true;
    engine.receiveShadow = true;
    this.mesh.add(engine);


    // create the tail
    var geomTailPlane = new THREE.BoxGeometry(15, 20, 5, 1, 1, 1);
    var matTailPlane = new THREE.MeshPhongMaterial({
        color: Colors.red,
        shading: THREE.FlatShading
    });
    var tailPlane = new THREE.Mesh(geomTailPlane, matTailPlane);
    tailPlane.position.set(-35,25,0);
    tailPlane.castShadow = true;
    tailPlane.receiveShadow = true;
    this.mesh.add(tailPlane);


    // create the wing
    var geomSideWing = new THREE.BoxGeometry(40, 8, 150, 1, 1, 1);
    var matSideWing = new THREE.MeshPhongMaterial({
        color:Colors.red,
        shading: THREE.FlatShading
    });
    var sideWing = new THREE.Mesh(geomSideWing, matSideWing);
    sideWing.castShadow = true;
    sideWing.receiveShadow = true;
    this.mesh.add(sideWing);


    // propeller
    var geomPropeller = new THREE.BoxGeometry(20, 10, 10, 1, 1, 1);
    var matPropeller = new THREE.MeshPhongMaterial({
        color:Colors.brown,
        shading: THREE.FlatShading
    });
    this.propeller = new THREE.Mesh(geomPropeller, matPropeller);
    this.propeller.castShadow = true;
    this.propeller.receiveShadow = true;
    
    // blades
    var geomBlade = new THREE.BoxGeometry(1, 100, 20, 1, 1, 1);
    var matBlade = new THREE.MeshPhongMaterial({
        color: Colors.brownDark,
        shading: THREE.FlatShading
    });
    var blade = new THREE.Mesh(geomBlade, matBlade);
    blade.position.set(8,0,0);
    blade.castShadow = true;
    blade.receiveShadow = true;
    this.propeller.add(blade);
    this.propeller.position.set(50,0,0);
    this.mesh.add(this.propeller);
}

var airplane;

function createPlane(){
    airplane = new AirPlane();
    airplane.mesh.scale.set(.25,.25,.25);
    airplane.mesh.position.y = 100;
    scene.add(airplane.mesh);
}


function loop(){
    //rotate the propeller, the sea and the sky
    airplane.propeller.rotation.x += 0.3;
    sea.mesh.rotation.z += .004;
    sky.mesh.rotation.z += .008;

    // update the plane on each frame
    updatePlane();
    renderer.render(scene, camera);
    // call the loop function again
    requestAnimationFrame(loop);
}

function updatePlane(){
    // Let's move the airplane between -100 and 100 on the horizontal axis
    // between 25 and 175 on the vertical axis
    // depending on the mouse position which ranges between -1 and 1 on both axes
    // to achieve that we use a normalize function 
    var targetX = normalize(mousePos.x, -1, 1, -100, 100);
    var targetY = normalize(mousePos.y, -1, 1, 25, 175);

    // update the airplane position
    airplane.mesh.position.y = targetY;
    airplane.mesh.position.x = targetX;
    airplane.propeller.rotation.x += 0.3;
}

function normalize(v,vmin,vmax,tmin,tmax){
    var nv = Math.max(Math.min(v,vmax), vmin);
    var dv = vmax-vmin;
    var pc = (nv-vmin)/dv;
    var dt = tmax - tmin;
    var tv = tmin + (pc*dt);

    return tv;
    
}

window.addEventListener('load', init, false);

function init(event) {

    //set up the scene, the camera and the renderer
    createScene();

    // add the lights
    createLight()

    // add the objects
    createPlane();
    createSea();
    createSky();

    // add the listener
    document.addEventListener('mousemove', handleMouseMove, false);

    // start a loop that will update the object's positions
    // and render the scene on each frame
    loop();
}

var mousePos = {x:0, y:0};

// now handle the mousemove event
function handleMouseMove(event){
    // here we are converting the mouse position value received 
    // to a normalized value varying between -1 and 1;
    // this is the formula for the horizontal axis
    var tx = -1 + (event.clientX / WIDTH)*2;

    // for the vertical axis, we need to inverse the formula
    // because the 2D y-axis goes the opposite direction of the 3D y-axis
    var ty = 1 - (event.clientY / HEIGHT)*2;

    mousePos = {x:tx, y:ty};

}

