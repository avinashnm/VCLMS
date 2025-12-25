<!DOCTYPE html>
	<head>
		 <meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		 <meta http-equiv="X-UA-Compatible" content="IE=edge">
		 <link rel="icon" type="image/png" href="{{asset('assets/images/logo.png')}}">
		 <link rel="stylesheet" href="{{asset('dist/css/bootstrap.min.css')}}">
		  <link rel="stylesheet" href="{{asset('dist/css/fonts.css')}}">
		<title>Login pages</title>
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
					<img src="{{asset('assets/images/chem.gif')}}" alt="Avatar">
					</div>
                    <div class="col" style="width: 430px; height: 349px;">
                    <center> 
                <form class="form-signin" method="post" action="{{url('stud')}}" style="width: 400px;">
				{{csrf_field()}}
     <img class="mb-4" src="{{asset('assets/images/clogo.png')}}" alt="" width="72" height="80">
      <h1 class="h3 mb-3 font-weight-normal">Login in</h1>
      <input type="text" id="inputEmail" class="form-control" name="regno" placeholder="Reg no/Fac id" required autofocus></br>
      <input type="password" id="inputPassword" class="form-control" name="pass" placeholder="Password" required></br>
      <button class="btn btn-lg  btn-block" style="color:white; background-color:brown;" type="submit">Sign in</button></br>
	   <a href="{{url('register')}}" style="color:brown;" >click here to register</a>
	   @if($errors->any())
				<div class="alert alert-danger">
				<span style="color:red">{{$errors->first()}}</span>
				</div> 
		@endif 
      </form>
      </center>
      
      </div>
      </div>
      </div>		
	   </body>
</html>