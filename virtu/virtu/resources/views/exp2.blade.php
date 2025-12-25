<!DOCTYPE html>
<html lang="en">
  <head>
    <title>MCC</title>
    <meta charset="UTF-8" />
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
    <link href="https://fonts.googleapis.com/css?family=Raleway" rel="stylesheet">
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/bootstrap.min.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/fonts.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/style.css')}}" />
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.min.js"></script>  
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.6/jspdf.plugin.autotable.min.js"></script> 
    <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
    <script>
    $(document).ready(function(){
        $(".add-row").click(function(){
            var name = $("#1").val();
            var email = $("#2").val();
            var email1 = $("#3").val();
            var email2 = $("#4").val();
            var email3 = $("#5").val();
            var email4 = $("#6").val();
            var email5 = $("#7").val();
            var markup = "<tr><td><input type='checkbox' name='record'></td><td>" + name + "</td><td>" + email + "</td><td>" + email1 + "</td><td>" + email2 + "</td><td>" + email3 + "</td><td>" + email4 + "</td><td>" + email5 + "</td></tr>";
            $("table tbody").append(markup);
        });
        
        // Find and remove selected table rows
        $(".delete-row").click(function(){
            $("table tbody").find('input[name="record"]').each(function(){
            	if($(this).is(":checked")){
                    $(this).parents("tr").remove();
                }
            });
        });
    }); 
    
</script>
  </head>
  <style>
  
    table{
        width: 100%;
        margin-bottom: 20px;
		border-collapse: collapse;
    }
    table, th, td{
        border: 1px solid #cdcdcd;
    }
    table th, table td{
        padding: 10px;
        text-align: left;
    }
* {
  box-sizing: border-box;
}

body {
  background-color: #f1f1f1;
}

#regForm {
  background-color: #ffffff;
  margin: 100px auto;
  font-family: Times New Roman;
  padding: 40px;
  width: 70%;
  min-width: 300px;
}

h1 {
  text-align: center;  
}

input {
  padding: 10px;
  font-size: 17px;
  font-family: Times New Roman;
  border: 1px solid #aaaaaa;
}

/* Mark input boxes that gets an error on validation: */
input.invalid {
  background-color: #ffdddd;
}

/* Hide all steps by default: */
.tab {
  display: none;
}
input[type=button],{
  background-color: brown;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 17px;
  font-family: Times New Roman;
  cursor: pointer;
}
button {
  background-color: brown;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  font-size: 17px;
  font-family: Times New Roman;
  cursor: pointer;
}

button:hover {
  opacity: 0.8;
}

#prevBtn {
  background-color: #bbbbbb;
}

/* Make circles that indicate the steps of the form: */
.step {
  height: 15px;
  width: 15px;
  margin: 0 2px;
  background-color: brown;
  border: none;  
  border-radius: 50%;
  display: inline-block;
  opacity: 0.5;
}

.step.active {
  opacity: 1;
}

/* Mark the steps that are finished and valid: */
.step.finish {
  background-color: #4CAF50;
}
</style>
  <body>
  <div><img src="{{asset('assets/images/main_banner.png')}}" alt="Avatar"></div>
    <div class="page-wrap">
      <div class="nav-style">
        <div class="mobile-view">
          <div class="mobile-view-header">
            <div class="mobile-view-close">
              <i class="fas fa-times js-toggle"></i>
            </div>
          </div>
          <div class="mobile-view-body"></div>
        </div>
 
        <nav class="navbar navbar-expand-lg navbar-dark" style="background-color:brown">
          <div class="container py-2 px-2">
            <a class="navbar-brand" href="#">Department Of Chemistry</a>
 
            <div class="d-inline-block d-lg-none ml-md-0 ml-auto py-3">
              <i class="fas fa-bars js-toggle" style="font-size: 25px; color: white"></i>
            </div>
 
            <div class="d-none d-lg-block">
              <ul class="navbar-nav ml-auto js-clone-nav">
                <li class="nav-item ">
                  <a class="nav-link" href="{{url('userdash')}}">Home</a>
                </li>
                <li class="nav-item dropdown active">
                <a class="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
                 Experiments
                </a>
                <div class="dropdown-menu">
              
                <a class="dropdown-item" href="{{url('exp/1')}}" >Experiment 1</a>
                 <a class="dropdown-item" href="{{url('exp/2')}}">Experiment 2</a>
                 <a class="dropdown-item" href="{{url('exp/3')}}" >Experiment 3</a>
                  <a class="dropdown-item" href="{{url('exp/4')}}">Experiment 4</a>
                 
                </div>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
                {{session('data')}}  <i class="fa fa-users" aria-hidden="true"></i>
                </a>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="{{url('profile')}}">Profile view</a>
                  <a class="dropdown-item" href="{{url('logout')}}" >Logout</a>
                </div>
              </li>
                <li class="nav-item">
                  <a class="nav-link" href="#"></a>
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="#"></a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
        </div>
    </div>
 
    <script type="text/javascript" src="{{asset('dist/js/jquery.min.js')}}"></script>
    <script type="text/javascript" src="{{asset('dist/js/bootstrap.min.js')}}"></script>
    <script type="text/javascript" src="{{asset('dist/js/main.js')}}"></script>
    

    <form id="regForm" method="post" action="{{url('form')}}" enctype="multipart/form-data">
    {{csrf_field()}}
   <div class="tab">
  <h1> Welcome to Virtual Chemistry Laboratory</h1>
   <p id="s"style="margin-left: 100px;">Determination of dissociation constant of a weak electrolyte and verification of oswald’s dilution law
</p>
    <img src="{{asset('assets/images/teacher.png')}}" alt="Avatar" width="150" height="150">
    <p></p>
  
  </div>
  <div class="tab"><h1>Video Tutorial</h1>
  <iframe width="850" height="400"
src="https://drive.google.com/file/d/18GrZ1thbiaEJMyzAeZkeITuC8hgffYts/preview">

</iframe>
 
  </div>
  <div class="tab" >
  <h1>Quiz</h1>
  
                 
                 
                    <b>1. {{$data[0]->questions}}</b></br>
                      
                    &nbsp;  &nbsp;  <input type="radio" class="questions1" id="questions1"name="questions1" value="{{$data[0]->option1}}">{{$data[0]->option1}}  </br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions1"name="questions1" value="{{$data[0]->option2}}">{{$data[0]->option2}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions1"name="questions1" value="{{$data[0]->option3}}">{{$data[0]->option3}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions1"name="questions1" value="{{$data[0]->option4}}">{{$data[0]->option4}}</br>
                      </br>
                      <b>2. {{$data[1]->questions}}</b></br>
                      
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions2"  name="questions2" value="{{$data[1]->option1}}">{{$data[1]->option1}}</br>  
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions2" name="questions2" value="{{$data[1]->option2}}">{{$data[1]->option2}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions2"name="questions2" value="{{$data[1]->option3}}">{{$data[1]->option3}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions2"name="questions2" value="{{$data[1]->option4}}">{{$data[1]->option4}}</br>
                      </br>
                      <b>3. {{$data[2]->questions}}</b></br>
                      
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions3" name="questions3" value="{{$data[2]->option1}}">{{$data[2]->option1}}  </br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions3" name="questions3" value="{{$data[2]->option2}}">{{$data[2]->option2}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions3"name="questions3" value="{{$data[2]->option3}}">{{$data[2]->option3}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions3"name="questions3" value="{{$data[2]->option4}}">{{$data[2]->option4}}</br>
                      </br>
                      <b>4. {{$data[3]->questions}}</b></br>
                      
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions4" name="questions4" value="{{$data[3]->option1}}">{{$data[3]->option1}} </br> 
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions4" name="questions4" value="{{$data[3]->option2}}">{{$data[3]->option2}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions4"name="questions4" value="{{$data[3]->option3}}">{{$data[3]->option3}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions4"name="questions4" value="{{$data[3]->option4}}">{{$data[3]->option4}}</br>
                      </br>
                      <b>5. {{$data[4]->questions}}</b></br>
                      
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions5" name="questions5" value="{{$data[4]->option1}}">{{$data[4]->option1}} </br> 
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions5" name="questions5" value="{{$data[4]->option2}}">{{$data[4]->option2}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions5"name="questions5" value="{{$data[4]->option3}}">{{$data[4]->option3}}</br>
                    &nbsp;  &nbsp;  <input type="radio" class="questions1"id="questions5"name="questions5" value="{{$data[4]->option4}}">{{$data[4]->option4}}</br>
                      </br>
                                  
                  
                    <input type="button" value="Submit"  onclick="check()"/>
                    <h4>correct answer: <label id="cs">0</label></h4>
  </div>
  <div class="tab">
    <div>
  <h1>Virtual lab</h1>
    <iframe src="{{url('sample2')}}" width="810" height="610" style="background-color:white"></iframe>
    </div>
    <div>
<input type="text" id="1" placeholder="Enter Concentration">
<input type="text" id="2" placeholder="Enter specific Conductance">
<input type="text" id="3" placeholder="Enter Equivalent conductance">
<input type="text" id="4" placeholder="α=λv/λ∞">
<input type="text" id="5" placeholder="kd=(α2/(1-α))">
<input type="text" id="6" placeholder="α">
<input type="text" id="7" placeholder="1/√C">
<input type="button" class="add-row" value="Add Row"></br></br>
   
    <table id="table1">
        <thead>
            <tr>
                <th>Select</th>
                <th>Concentration</th>
                <th>Specific conductance</th>
                <th>Equivalent conductance</th>
                <th>α=λv/λ∞ </th>
                <th>kd=(α2/(1-α))</th>
                <th>α</th>
                <th>1/√C</th>
            </tr>
        </thead>
        <tbody>
            
        </tbody>
    </table>
    <button type="button" class="delete-row">Delete Row</button>
    
</div>
   </div>
 
  <div class="tab">
  <b>Upload Graph Image:</b><br>
  <input type="file" onchange="encodeImage(this)" name="image" id="image"><br><br>
  <b>About Your Experience in Carry Outing the Experiment:</b><br>
  <textarea id="myText" name="review" rows="4" cols="50">
   </textarea>
  <br><br>
  <button type="button" onclick="generate()" > Submit </button>
  </div>
  <div style="overflow:auto;">
    <div style="float:right;">
      <button type="button" id="prevBtn" onclick="nextPrev(-1)">Previous</button>
      <button type="button" id="nextBtn" onclick="nextPrev(1)">Next</button>
    </div>
  </div>
  <!-- Circles which indicates the steps of the form: -->
  <div style="text-align:center;margin-top:40px;">
    <span class="step"></span>
    <span class="step"></span>
    <span class="step"></span>
    <span class="step"></span>
    <span class="step"></span>
  </div>
  <div>
  <h4>Score: <label id="score" name="score">0</label>
  <span style="float:right;">Total score:<label id="Total_score" name="Total_score">0</label></span></h4>
  
  </div>
</form>
    
       
<script>
var c=0;
var imgdata='';
var score=0;
function encodeImage(image){
  var img= image.files[0];
  var file=new FileReader();
  file.onloadend=function(){
    imgdata=file.result
   
  }
  file.readAsDataURL(img)
}
function check()
{
  var cl=0;
  if(document.querySelector('input[name="questions1"]:checked')&&document.querySelector('input[name="questions2"]:checked')&&document.querySelector('input[name="questions3"]:checked')&&document.querySelector('input[name="questions4"]:checked')&&document.querySelector('input[name="questions5"]:checked'))
  {
    var q1=document.querySelector('input[name="questions1"]:checked').value;
    var q2=document.querySelector('input[name="questions2"]:checked').value;
    var q3=document.querySelector('input[name="questions3"]:checked').value;
    var q4=document.querySelector('input[name="questions4"]:checked').value;
    var q5=document.querySelector('input[name="questions5"]:checked').value;
    if(q1=='{{$data[0]->answer}}'){cl++;}
    if(q2=='{{$data[1]->answer}}'){cl++;}
    if(q3=='{{$data[2]->answer}}'){cl++;}
    if(q4=='{{$data[3]->answer}}'){cl++;}
    if(q5=='{{$data[4]->answer}}'){cl++;}
    

  document.getElementById('cs').innerHTML=cl;
  c=cl;
  var radioButtons = document.getElementsByClassName("questions1");
  for(var i=0;i<radioButtons.length;i++) {
    radioButtons[i].disabled = true;
  }
  }
  else
  {
    alert('you have missed questions !!!!');
  }
 
 
 }
  function generate() {  
    var text = document.getElementById("myText").value;
    var doc = new jsPDF("p", "mm", "a4");  
    var htmlstring = '';  
    var tempVarToCheckPageHeight = 0;  
    var pageHeight = 0;  
    pageHeight = doc.internal.pageSize.height;  
    specialElementHandlers = {  
        // element with id of "bypass" - jQuery style selector  
        '#bypassme': function(element, renderer) {  
            // true = "handled elsewhere, bypass text extraction"  
            return true  
        }  
    };  
    margins = {  
        top: 150,  
        bottom: 60,  
        left: 40,  
        right: 40,  
        width: 600  
    };  
    var y = 20;  
    doc.setLineWidth(2);  
    doc.text(170, y = y + 0, "{{session('data')}}"); 
    doc.text(70, 20, "Strength Solution");  
    doc.text(160, y = y + 10, "{{session('regno')}}"); 
    doc.autoTable({  
        html: '#table1',  
        startY: 50,  
        theme: 'grid',  
        columnStyles: {  
            0: {  
                cellWidth: 20,  
            },  
            1: {  
                cellWidth: 20,  
            },  
            2: {  
                cellWidth: 30,  
            },  
            3: {  
                cellWidth: 30,  
            } , 
            4: {  
                cellWidth: 20,  
            }  ,
            5: {  
                cellWidth: 40,  
            }  ,
            6: {  
                cellWidth: 10,  
            }  ,
            7: {  
                cellWidth: 20,  
            }  
        },  
        styles: {  
            minCellHeight: 10  
        }  
    });
    var width = doc.internal.pageSize.getWidth();
    var height = 100;
    doc.addPage();
    doc.text(70, 20, "Graph"); 
    doc.addImage(imgdata, 0, 30, width, height);
    doc.addPage();
    doc.text(70, 20, "Result"); 
    doc.text(20, 30, text);
    doc.text(10, 30, "Score:");
    doc.text(10,150,"video Score:"+v);
    doc.text(10,160,"Quiz Score:"+c);
    
    doc.save("{{session('regno')}}.pdf")
 

            var formData = new FormData();
            formData.append('regno', "{{session('regno')}}");
            formData.append('expid', "exp004");
            formData.append('score', score);
            formData.append('pdf', doc.output('blob'));
            $.ajax('/form',
            {

                method: 'POST',
                enctype: 'multipart/form-data',
                headers: {'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')},
                data: formData,
                processData: false,
                contentType: false,
                success: function(data){if(data){top.location.href="/userdash";}},
                error: function(data){console.log(data)}
            });
  
 
    
    
}  
//--------------------------------------------------------------//
var currentTab = 0; // Current tab is set to be the first tab (0)
showTab(currentTab); // Display the current tab
var i=0
var v=5
var q=5
function showTab(n) {
  // This function will display the specified tab of the form...
  var x = document.getElementsByClassName("tab");
  x[n].style.display = "block";
  //... and fix the Previous/Next buttons:
  if (n == 0) {
    document.getElementById("prevBtn").style.display = "none";
   
  } else {
    document.getElementById("prevBtn").style.display = "inline";
    
  }
  if (n == (x.length - 1)) {
    document.getElementById("nextBtn").style.display = "none";
  } else {
    document.getElementById("nextBtn").style.display = "inline";
  }
  if(n==0){
    document.getElementById("score").innerHTML=0;
    document.getElementById("Total_score").innerHTML=0;}
  else if(n==1)
  {document.getElementById("score").innerHTML=v;
  document.getElementById("Total_score").innerHTML=v;}
  else if(n==2)
  {document.getElementById("score").innerHTML=q;
  document.getElementById("Total_score").innerHTML=parseInt(v)+parseInt(c);}
  else if(n==3)
  {document.getElementById("score").innerHTML=parseInt(q);
  document.getElementById("Total_score").innerHTML=parseInt(v)+parseInt(c);}
   score=parseInt(v)+parseInt(c);
  //... and run a function that will display the correct step indicator:
  fixStepIndicator(n)
}

function nextPrev(n) {
  // This function will figure out which tab to display
  var x = document.getElementsByClassName("tab");
  // Exit the function if any field in the current tab is invalid:
  
  // Hide the current tab:
  x[currentTab].style.display = "none";
  // Increase or decrease the current tab by 1:
  currentTab = currentTab + n;
  // if you have reached the end of the form...
  if (currentTab >= x.length) {
    // ... the form gets submitted:
    document.getElementById("regForm").submit();
    return false;
  }
  // Otherwise, display the correct tab:
  showTab(currentTab);
}

function validateForm() {
  // This function deals with validation of the form fields
  var x, y, i, valid = true;
  x = document.getElementsByClassName("tab");
  y = x[currentTab].getElementsByTagName("input");
  // A loop that checks every input field in the current tab:
  for (i = 0; i < y.length; i++) {
    // If a field is empty...
    if (y[i].value == "") {
      // add an "invalid" class to the field:
      y[i].className += " invalid";
      // and set the current valid status to false
      valid = false;
    }
  }
  // If the valid status is true, mark the step as finished and valid:
  if (valid) {
    document.getElementsByClassName("step")[currentTab].className += " finish";
  }
  return valid; // return the valid status
}

function fixStepIndicator(n) {
  // This function removes the "active" class of all steps...
  var i, x = document.getElementsByClassName("step");
  for (i = 0; i < x.length; i++) {
    x[i].className = x[i].className.replace(" active", "");
  }
  //... and adds the "active" class on the current step:
  x[n].className += " active";
}
</script>


       
        
  </body>
</html>




