<!DOCTYPE html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		 <meta http-equiv="X-UA-Compatible" content="IE=edge">
		<link rel="icon" type="image/png" href="{{asset('assets/images/logo.png')}}">
		<link rel="stylesheet" href="{{asset('dist/css/bootstrap.min.css')}}">
		<link rel="stylesheet" href="{{asset('dist/css/fonts.css')}}">
		<link rel="stylesheet" href="{{asset('dist/css/sidebar.css')}}">
		<title>Mcc Admin</title>
		<script src="{{asset('dist/js/jquery.min.js')}}"></script>
		<script src="{{asset('dist/js/bootstrap.min.js')}}"></script>
    <link rel="stylesheet" type="text/css" href="https://cdn.datatables.net/1.10.22/css/jquery.dataTables.css">
    <script type="text/javascript" charset="utf8" src="https://cdn.datatables.net/1.10.22/js/jquery.dataTables.js"></script> 
    <script>
          $(document).ready( function () {
          $('#table_id').DataTable();
            } );
            </script>
    <script>
    $(document).ready(function(){
        $(".hamburger .hamburger__inner").click(function(){
         $(".wrapper").toggleClass("active")
        });

      });
    </script>
 		</head>
	<body >
    <div class="wrapper">
  <div class="top_navbar">
    <div class="hamburger">
       <div class="hamburger__inner">
         <div class="one"></div>
         <div class="two"></div>
         <div class="three"></div>
       </div>
    </div>
    <div class="menu">
      <div class="logo">
      <img src="{{asset('assets/images/clogo.png')}}" width="30" height="30" class="d-inline-block align-top"alt="logo">
      MCC virtual chemistry laboratory  </img>
      </div>
      <div class="right_menu">
        <ul>
          <li> <a href="{{url('logout')}}" tooltips="logout"><i class="fa fa-sign-out fa-lg fa-fw" style="margin-top: 15px;"></i>
  </a>
           
          </li>
        </ul>
      </div>
    </div>
  </div>
    
  <div class="main_container">
      <div class="sidebar">
          <div class="sidebar__inner">
            <div class="profile">
              <div class="img">
                <img src="{{asset('assets/images/person.png')}}" alt="profile_pic">
              </div>
              <div class="profile_info">
                 <p>Welcome</p>
                 <p class="profile_name">{{session('data')}}</p>
              </div>
            </div>
            <ul>
            <li>
                <a href="{{url('exp1')}}">
                  <span class="icon"><i class="fa fa-users"></i></span>
                  <span class="title">EXPERIMENTS</span>
                </a>
              </li>
              <li>
                <a href="{{url('ques')}}" class="active">
                  <span class="icon"><i class="fa fa-delicious"></i></span>
                  <span class="title">QUESTION BANK</span>
                </a>
              </li>
              
              <li>
                <a href="{{url('rep')}}">
                  <span class="icon"><i class="fa fa-delicious"></i></span>
                  <span class="title">REPORT</span>
                </a>
              </li>
              </ul>
          </div>
      </div>
             <div class="container">
        <div class="item">
        <div clas="row">
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#basicExampleModal"><i class="fa fa-plus" aria-hidden="true"></i> Add Questions</button>
         <div class="modal fade" id="basicExampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
       <div class="modal-content" style="width: 602px;">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">Questions Form</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form method="post" action="{{url('questionload')}}">
             {{ csrf_field() }}
          <div class="modal-body">
            
            <div class="row"style="margin-top: 6px;">
             
              <div class="col">
              <input type="text" class="form-control" placeholder="Question" name="ques">
              </div>
             </div>
            <div class="row" style="margin-top: 6px;">
            <div class="col">
              <input type="text" class="form-control" placeholder="option1" name="option1">
              </div>
              <div class="col">
              <input type="text" class="form-control" placeholder="option2" name="option2">
              </div>
            </div>
            <div class="row" style="margin-top: 6px;">
            <div class="col">
              <input type="text" class="form-control" placeholder="option3" name="option3">
              </div>
              <div class="col">
              <input type="text" class="form-control" placeholder="option4" name="option4">
              </div>
            </div>

            <div class="row" style="margin-top: 6px;">
              <div class="col">
              <input type="text" class="form-control" placeholder="answer" name="answer">
              </div>
              <div class="col">
              <select class="browser-default custom-select" name="expid">
                <option selected>Experiment Id</option>
                <option value="exp001">Experiment 1</option>
                <option value="exp002">Experiment 2</option>
                <option value="exp003">Experiment 3</option>
                <option value="exp004">Experiment 4</option>
              </select>
              </div>
            </div>
            
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="submit" class="btn btn-primary">Save</button>
      </div>
      </form>
    </div>
  </div>
</div> 
</div>
</div>

 <!--View-->
 <div class="item">
         <div class="row">
         <table id="table_id"class="table table-bordered table-resposive">
          <thead>
          <tr>
          <th>Question ID</th>
           <th>Question</th>
           <th>Option 1</th>
           <th>Option 2</th>
           <th>Option 3</th>
           <th>Option 4</th>
           <th>Answer</th>
           <th>Experiment ID</th>
           <th>Actions</th>
                      
          </tr>
          </thead>
          <tbody>
          @foreach($data as $datas)
          <tr>

          <td>{{$datas->qid}}</td> 
          <td>{{$datas->questions}}</td>
          <td>{{$datas->option1}}</td>
            <td>{{$datas->option2}}</td>
            <td>{{$datas->option3}}</td>
            <td>{{$datas->option4}}</td>
            <td>{{$datas->answer}}</td>
            <td>{{$datas->expid}}</td>
           
             
            
            <td><a href="#" style="margin-left: 8px; color:green;"><i class="fa fa-pencil edit" data-toggle="tooltip" title="Edit"></i></a>  
            <a href="#" style="margin-left: 8px; color:red;" ><i class=" fa fa-trash delete" data-toggle="tooltip" title="Delete"></i> </a>
            </td>        
          </tr>
         @endforeach
         </tbody>
         </table>
         </div>
        </div>
        </div>
 

</div>
        
        <div class="modal fade" id="deleteModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
       aria-hidden="true">
       <div class="modal-dialog modal-sm modal-notify modal-danger" role="document">
       <!--Content-->
    <div class="modal-content text-center">
      <!--Header-->
      <div class="modal-header d-flex justify-content-center">
        <p class="heading">Are you sure?</p>
      </div>
      <form method="post" action="{{url('questiondelete')}}" id="editForm">
             {{ csrf_field() }}
      <!--Body-->
      <div class="modal-body">
      <input type="hidden" class="form-control" id="qid" placeholder="question id" name="qid" Readonly>
        <i class="fa fa-trash-o fa-4x fa-spin" style="color:red;"></i>

      </div>

      <!--Footer-->
      <div class="modal-footer flex-center">
        <button type="submit" class="btn  btn-outline-danger">Yes</button>
        <button type="button" class="btn  btn-danger waves-effect" data-dismiss="modal">No</a>
      </div>
      </form>
    </div>
    <!--/.Content-->
  </div>
</div>


        <div class="modal fade" id="editModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel"
         aria-hidden="true">
        <div class="modal-dialog" role="document">
       <div class="modal-content" style="width: 602px;">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">questions update Form</h5>
            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form method="post" action="{{url('questionupdate')}}" id="editForm">
             {{ csrf_field() }}
             <div class="modal-body">
            
            <div class="row"style="margin-top: 6px;">
             
            <div class="col">
              <input type="text" class="form-control" placeholder="Question ID" name="qid" id="qid1"  Readonly>
              </div>
              <div class="col">
              <input type="text" class="form-control" placeholder="Question" name="ques" id="ques">
              </div>
             </div>
            <div class="row" style="margin-top: 6px;">
            <div class="col">
              <input type="text" class="form-control" placeholder="option1" name="option1" id="option1">
              </div>
              <div class="col">
              <input type="text" class="form-control" placeholder="option2" name="option2" id="option2">
              </div>
            </div>
            <div class="row" style="margin-top: 6px;">
            <div class="col">
              <input type="text" class="form-control" placeholder="option3" name="option3" id="option3">
              </div>
              <div class="col">
              <input type="text" class="form-control" placeholder="option4" name="option4" id="option4">
              </div>
            </div>

            <div class="row" style="margin-top: 6px;">
              <div class="col">
              <input type="text" class="form-control" placeholder="answer" name="answer" id="answer">
              </div>
              <div class="col">
              <select class="browser-default custom-select" name="expid" id="expid">
                <option selected>Experiment Id</option>
                <option value="exp001">Experiment 1</option>
                <option value="exp002">Experiment 2</option>
                <option value="exp003">Experiment 3</option>
                <option value="exp004">Experiment 4</option>
              </select>
              </div>
            </div>
            
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="submit" class="btn btn-primary">Update</button>
      </div>
      </form>
    </div>
  </div>
</div> 
<!-- update form close-->   
</div>
</div>
</div>
</body>
</html>
<script>
 $(document).ready(function(){
  var table=$('#table_id').DataTable();
  table.on('click','.edit',function(){
    $tr=$(this).closest('tr');
    if($($tr).hasClass('child'))
    {
      $tr=$tr.prev('.parent');
    }
    var data=table.row($tr).data();
    console.log(data);
    $('#ques').val(data[1]);
    $('#qid1').val(data[0]);
    $('#option1').val(data[2]);
    $('#option2').val(data[3]);
    $('#option3').val(data[4])
    $('#option4').val(data[5]);
    $('#answer').val(data[6]);
    $('#expid').val(data[7]);
   
    $('#editModal').modal('show');

  });
  table.on('click','.delete',function(){
    $tr=$(this).closest('tr');
    if($($tr).hasClass('child'))
    {
      $tr=$tr.prev('.parent');
    }
    var data=table.row($tr).data();
    $('#qid').val(data[0]);
    $('#deleteModal').modal('show');
  });
  
      
 });
</script>