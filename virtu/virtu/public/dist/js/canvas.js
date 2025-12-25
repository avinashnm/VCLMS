var canvas=document.querySelector('canvas');


var c = canvas.getContext('2d');
	c.fillRect(50,50,50,50);
	

var canvas;
var ctx;
var x = 75;
var y = 50;
var WIDTH = 800;
var HEIGHT = 400;
var dragok = false;

function rect(x,y,w,h) {
 ctx.beginPath();
 ctx.rect(x,y,w,h);
 ctx.closePath();
 ctx.fill();
}

function clear() {
 ctx.clearRect(0, 0, WIDTH, HEIGHT);
}

function init() {
 canvas = document.getElementById("canvas");
 ctx = canvas.getContext("2d");
 return setInterval(draw, 10);
}

function draw() {
 clear();
 ctx.fillStyle = "#FAF7F8";
 rect(0,0,WIDTH,HEIGHT);
 if(document.getElementById('blue').checked == true)
 {
ctx.fillStyle = "blue";	
 }else if(document.getElementById('red').checked == true)
 {
ctx.fillStyle = "red";	
 }else if(document.getElementById('green').checked == true)
 {
ctx.fillStyle = "green";	
 }
 else
 {
 ctx.fillStyle = "#444444";	
 }
 rect(x - 15, y - 15, 30, 30);
}

function myMove(e){
 if (dragok){
  x = e.pageX - canvas.offsetLeft;
  y = e.pageY - canvas.offsetTop;
 }
}

function myDown(e){
 if (e.pageX < x + 15 + canvas.offsetLeft && e.pageX > x - 15 +
 canvas.offsetLeft && e.pageY < y + 15 + canvas.offsetTop &&
 e.pageY > y -15 + canvas.offsetTop){
  x = e.pageX - canvas.offsetLeft;
  y = e.pageY - canvas.offsetTop;
  dragok = true;
  canvas.onmousemove = myMove;
 }
}

function myUp(){
 dragok = false;
 canvas.onmousemove = null;
}

init();
canvas.onmousedown = myDown;
canvas.onmouseup = myUp;
