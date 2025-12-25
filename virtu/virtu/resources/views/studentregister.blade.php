<!DOCTYPE html>
	<head>
		 <meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		 <meta http-equiv="X-UA-Compatible" content="IE=edge">
		 <link rel="icon" type="image/png" href="{{asset('assets/images/logo.png')}}">
		 <link rel="stylesheet" href="{{asset('dist/css/bootstrap.min.css')}}">
		  <link rel="stylesheet" href="{{asset('dist/css/fonts.css')}}">
		<title>Register pages</title>
		<script src="{{asset('dist/js/jquery.min.js')}}"></script>
		<script src="{{asset('dist/js/bootstrap.min.js')}}"></script>
		<style>
		.form-control:focus {
  		border-color: brown;
		box-shadow: brown;
		outline: 0 none;
		}
		 

		</style>

		
	</head>
	<body >
			
                <div>
					<img src="{{asset('assets/images/main_banner.png')}}" alt="Avatar">
				</div>
				<div class="row">
                <div class="col">
					<img src="{{asset('assets/images/chem.gif')}}" width="800" height="680"alt="Avatar">
					</div>
                    <div class="col" style="width: 430px; height: 349px;">
                    <center> 
                <form class="form-signin" method="post" action="{{url('studentregister')}}" style="width: 400px;">
				{{csrf_field()}}
      <h1 class="h3 mb-3 font-weight-normal">Register</h1>
      <input type="text"  class="form-control" placeholder="student register no" name="regno" required></br>
      <input type="text"  class="form-control" placeholder="student name" name="name"required></br>
      <input type="number"  class="form-control" placeholder="student phoneno" name="phoneno" required></br>
      <input type="email"  class="form-control" placeholder="student email" name="email"required></br>
	  <select class="browser-default custom-select" id="dept" name="dept"> 
                <option selected>Select the Course</option>
                <option value="Bsc chemistry">Bsc chemsitry</option>
                <option value="Msc chemistry">Msc chemistry</option>
      </select></br>
	  </br><select class="browser-default custom-select" id="dept" name="year"> 
                <option selected>Select the Year</option>
                <option value="1">1 year</option>
                <option value="2">2 year</option>
				<option value="3">3 year</option>
      </select>
	  </br> 
	</br><select class="browser-default custom-select" id="dept" name="stream"> 
                <option selected>Select the Stream</option>
                <option value="Aided">Aided</option>
                <option value="Self">Self</option>
	  </select>
	  </br>
	  </br><input type="password"  class="form-control" placeholder="student password" name="pswd"required></br>
	 
      <input type="hidden" name="login" value="student">
	   <button class="btn btn-lg  btn-block" style="color:white; background-color:brown;" type="submit">Sign up</button></br>
      </form>
      </center>
      
      </div>
      </div>
      </div>		
	   </body>
</html>