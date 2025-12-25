<!DOCTYPE html>
<html lang="en">
  <head>
    <title>MCC</title>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
 
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/bootstrap.min.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/fonts.css')}}"/>
    <link rel="stylesheet" type="text/css" href="{{asset('dist/css/style.css')}}" />
    <link rel="stylesheet" href="https://cdn.datatables.net/1.10.22/css/jquery.dataTables.min.css"/>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/1.5.3/jspdf.min.js"></script>  
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.6/jspdf.plugin.autotable.min.js"></script> 
   
   
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
                <li class="nav-item ">
                  <a class="nav-link" href="{{url('userdash')}}">Home</a>
                </li>
                <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle" href="#" id="navbardrop" data-toggle="dropdown">
                 Experiments
                </a>
                <div class="dropdown-menu">
                  <a class="dropdown-item" href="{{url('exp/1')}}">Experiment 1</a>
                  <a class="dropdown-item" href="{{url('exp/2')}}">Experiment 2</a>
                  <a class="dropdown-item" href="{{url('exp/3')}}">Experiment 3</a>
                  <a class="dropdown-item" href="{{url('exp/4')}}">Experiment 4</a>
                </div>
              </li>
              <li class="nav-item dropdown active">
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
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
  
   
   
    <script src="{{asset('dist/js/jquery.dataTables.min.js')}}" type="text/javascript"></script> 
    
      

        <div style="width: 1000px; margin-top: 50px;margin-left: 150px;"> 
        <center>
        <table id="table_id"class="table table-bordered table-resposive" >
              <thead>
              <tr>
               <th>Regno</th>
                <th>Expid</th>
                <th>Score</th>
                <th>StaffScore</th>
                <th>Total</th>
                <th>Pdf</th>
                <th>Created_at</th>
                <th>Updated_at</th>
                
              </tr>
              </thead>
              <tbody>
              @foreach($data as $datas)
                <tr>
                
                  <td>{{$datas->regno}}</td>
                  <td>{{$datas->expid}}</td>
                  <td>{{$datas->score}}</td>
                  <td> {{$datas->staff_score}}</td>
                  <td>{{$datas->total}}</td>
                  <td><a href='/pdf/{{$datas->pdf}}' target="popup" onclick="window.open('/pdf/{{$datas->pdf}}','name','width=600,height=400')">{{$datas->pdf}}</a></td>
                  <td>{{$datas->created_at}}</td>
                  <td>{{$datas->updated_at}}</td>
                          
                </tr>
                @endforeach
              </tbody>
              </table>
             
             
              </center>
        </div>
        <div>
        </div>
        <script>

        function demo1()
         {
           alert('hi');
           
       
                     
        }
 $(document).ready(function(){
  var table=$('#table_id').DataTable();
  });
  </script>
    
  </body>
  
</html>