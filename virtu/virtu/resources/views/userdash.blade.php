<!DOCTYPE html>
<html lang="en">
  <head>
    <title>MCC</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
 
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/bootstrap.min.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/fonts.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/style.css')}}" />
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script>
    $(document).ready(function(){
      $(".nav li.disabled a").click(function()
      {
        return true;
      });
    });
    </script>
  </head>
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
                <li class="nav-item active">
                  <a class="nav-link" href="{{url('userdash')}}">Home</a>
                </li>
                <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
                 Experiments
                </a>
                <div class="dropdown-menu">
                <ul class="nav">
                 <li class = "disabled"> <a class="dropdown-item" href="{{url('exp/1')}}">Experiment 1</a></li>
                 <li class = "disabled"> <a class="dropdown-item" href="{{url('exp/2')}}">Experiment 2</a></li>
                 <li class = "disabled"> <a class="dropdown-item" href="{{url('exp/3')}}">Experiment 3</a></li>
                 <li class = "disabled"> <a class="dropdown-item" href="{{url('exp/4')}}">Experiment 4</a></li>
                  </ul>
                </div>
              </li>
              <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
                {{session('data')}}  <i class="fa fa-users" aria-hidden="true"></i>
                </a>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="{{url('profile')}}">Profile view</a>
                  <a class="dropdown-item" href="{{url('logout')}}">Logout</a>
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
    <center>
    <div id="carouselExampleControls" class="carousel slide" data-ride="carousel" style=" width: 944px; height: 402px;margin-top: 50px;">
        <div class="carousel-inner">
            <div class="carousel-item active">
            <img class="d-block w-100" src="{{asset('assets/images/s3.jpg')}}" alt="First slide">
            </div>
            <div class="carousel-item">
            <img class="d-block w-100" src="{{asset('assets/images/s3.jpg')}}" alt="Second slide">
            </div>
            <div class="carousel-item">
            <img class="d-block w-100" src="{{asset('assets/images/s3.jpg')}}" alt="Third slide">
            </div>
        </div>
        <a class="carousel-control-prev" href="#carouselExampleControls" role="button" data-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="sr-only">Previous</span>
        </a>
        <a class="carousel-control-next" href="#carouselExampleControls" role="button" data-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="sr-only">Next</span>
        </a>
        </div>
        
        </center>
        <div style="margin-left: 200px; margin-right: 50px;margin-top: 50px;">
        <p style="text-align:left;font-family:Times New Roman"><b>Virtual Labs will provide to the students the result of an experiment by one of the following methods (or possibly a combination). Modeling the physical phenomenon by a set of equations and carrying out simulations to yield the result of the particular experiment. This can, at-the-best, provide an approximate version of the ‘real-world’ experiment. Providing measured data for virtual lab experiments corresponding to the data previously obtained by measurements on an actual system.
        Remotely triggering an experiment in an actual lab and providing the student the result of the experiment through the computer interface.
        This would entail carrying out the actual lab experiment remotely.</b></p>
        </div>
        
        <div>
        </div>
  </body>
</html>