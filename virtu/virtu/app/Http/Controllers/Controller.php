<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\Request;
use DB;
use App\User;
class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests;
    function logincheck(Request $req){
    $regno=$req->get('regno');
    $pass=$req->get('pass');
    $data1=DB::table('students')->select('pswd')->where('regno','=',$regno)->pluck('pswd');
    $data = DB::table('faculty')->select('pswd')->where('empno','=',$regno)->pluck('pswd');
    if(count($data1)>0)  
    {
       if($data1[0]==$pass)
       {
        $data1= DB::table('students')->select('name')->where('regno','=' ,$regno)->pluck('name');
        session()->put('data',$data1[0]);
        $data2= DB::table('students')->select('regno')->where('regno','=' ,$regno)->pluck('regno');
        session()->put('regno',$data2[0]);
        return view('userdash');
       }
       else{
       
        return back()->withErrors('Invalid Email id & Password!!');
     }
        
    }  
    elseif(count($data)>0)
    {
       if($data[0]==$pass)
       {
        $data1= DB::table('faculty')->select('empno')->where('empno','=' ,$regno)->pluck('empno');
        session()->put('fac',$data1[0]);
        $data = DB::table('experiments')->get();
        return view('facultydashboard',['data'=>$data]);
       }
       else{
       
        return back()->withErrors('Invalid Email id & Password!!');
     }
       
    }
    elseif($regno=="admin" && $pass=="admin@123")
    {
        $data = DB::table('students')->get();
        return view('admindashboard',['data'=>$data]);
    }
    else{
       
       return back()->withErrors('Invalid Email id & Password!!');
    }
    }
    function facregister(Request $req){
        $empno=$req->get('empno');
        $name=$req->get('name');
        $stream=$req->get('stream');
        $email=$req->get('email');
        $phoneno=$req->get('phoneno');
        $pswd=$req->get('password');
        $data1=array('empno'=>$empno,'name'=>$name,'stream'=>$stream,'email'=>$email,'phoneno'=>$phoneno,'pswd'=>$pswd);
        DB::table('faculty')->insert($data1);
        $data = DB::table('faculty')->get();
        return view('facultydetails',['data'=>$data]);
    }


    function facultyupdate(Request $req){
        $empno=$req->get('empno');
        $name=$req->get('name');
        $stream=$req->get('stream');
        $email=$req->get('email');
        $phoneno=$req->get('phoneno');
        $pswd=$req->get('password');
        $cpswd=$req->get('cpassword');
        $update =DB::table('faculty')->where('empno', $empno)->update( ['name'=>$name,'stream'=>$stream,'email'=>$email,'phoneno'=>$phoneno,'pswd'=>$pswd]); 
        $data = DB::table('faculty')->get();
        return view('facultydetails',['data'=>$data]);
    }

    function facultydelete(Request $req){

        $empno=$req->get('empno');
        DB::delete('delete from faculty where empno=?',[$empno]);
        $data = DB::table('faculty')->get();
        return view('facultydetails',['data'=>$data]);
    }


    function faculty(Request $req){
        
            $data = DB::table('faculty')->get();
            return view('facultydetails',['data'=>$data]);
        }
    
    function loads(Request $req){
        $expid=$req->get('expid');
        $name=$req->get('name');
        $intro=$req->get('intro');
        $procedure=$req->get('procedure');
        $video=$req->get('video');
        $empno=$req->get('empno');
        $datas=array('expid'=>$expid,'name'=>$name,'intro'=>$intro,'procedure'=>$procedure,'video'=>$video,'empno'=>$empno);
        DB::table('experiments')->insert($datas);
        $data = DB::table('experiments')->get();
        return view('facultydashboard',['data'=>$data]);
    }

    function experimentupdate(Request $req){
        $expid=$req->get('expid');
        $name=$req->get('name');
        $intro=$req->get('intro');
        $procedure=$req->get('procedure');
        $video=$req->get('video');
        $empno=$req->get('empno');
        $update =DB::table('experiments')->where('expid', $expid)->update( ['name'=>$name,'intro'=>$intro,'procedure'=>$procedure,'video'=>$video,'empno'=>$empno]); 
        $data = DB::table('experiments')->get();
        return view('facultydashboard',['data'=>$data]);
    }

    function experimentdelete(Request $req){

        $expid=$req->get('expid');
        DB::delete('delete from experiments where expid=?',[$expid]);
        $data = DB::table('experiments')->get();
        return view('facultydashboard',['data'=>$data]);
    }

    function questionload(Request $req){
        $ques=$req->get('ques');
        $option1=$req->get('option1');
        $option2=$req->get('option2');
        $option3=$req->get('option3');
        $option4=$req->get('option4');
        $answer=$req->get('answer');
        $expid=$req->get('expid');
        $data1=array('questions'=>$ques,'option1'=>$option1,'option2'=>$option2,'option3'=>$option3,'option4'=>$option4,'answer'=>$answer,'expid'=>$expid);
        DB::table('questions_bank')->insert($data1);
        $data = DB::table('questions_bank')->get();
        return view('question',['data'=>$data]);
    }

    function questionupdate(Request $req){


        $qid=$req->get('qid');
        $ques=$req->get('ques');
        $option1=$req->get('option1');
        $option2=$req->get('option2');
        $option3=$req->get('option3');
        $option4=$req->get('option4');
        $answer=$req->get('answer');
        $expid=$req->get('expid');
        $update =DB::table('questions_bank')->where('qid', $qid)->update( ['questions'=>$ques,'option1'=>$option1,'option2'=>$option2,'option3'=>$option3,'option4'=>$option4,'answer'=>$answer,'expid'=>$expid]); 
        $data = DB::table('questions_bank')->get();
        return view('question',['data'=>$data]);
    
    }


    function questiondelete(Request $req){

        $qid=$req->get('qid');
        DB::delete('delete from questions_bank where qid=?',[$qid]);
        $data = DB::table('questions_bank')->get();
        return view('question',['data'=>$data]);

    }


    function studentregister(Request $req){
        $regno=$req->get('regno');
        $name=$req->get('name');
        $dept=$req->get('dept');
        $year=$req->get('year');
        $stream=$req->get('stream');
        $email=$req->get('email');
        $phoneno=$req->get('phoneno');
        $pswd=$req->get('pswd');
        $data1=array('regno'=>$regno,'name'=>$name,'course'=>$dept,'year'=>$year,'stream'=>$stream,'email'=>$email,'phoneno'=>$phoneno,'pswd'=>$pswd);
        DB::table('students')->insert($data1);
        if( $login=$req->get('login')=='student')
        {
            return view('mainlogin');
        }
        else
        {
        $data = DB::table('students')->get();
        return view('admindashboard',['data'=>$data]);
        }
    }

    function studentupdate(Request $req){
        $regno=$req->get('regno');
        $name=$req->get('name');
        $course=$req->get('course');
        $year=$req->get('year');
        $stream=$req->get('stream');
        $email=$req->get('email');
        $phoneno=$req->get('phoneno');
        $pswd=$req->get('pswd');
        $update =DB::table('students')->where('regno', $regno)->update( ['name'=>$name,'course'=>$course,'year'=>$year,'stream'=>$stream,'email'=>$email,'phoneno'=>$phoneno,'pswd'=>$pswd]); 
        $data = DB::table('students')->get();
        return view('admindashboard',['data'=>$data]);
    }

    function studentdelete(Request $req){

        $regno=$req->get('regno');
        DB::delete('delete from students where regno=?',[$regno]);
        $data = DB::table('students')->get();
        return view('admindashboard',['data'=>$data]);
    }

    
    function facexp(Request $req){
        $data = DB::table('experiments')->get();
        return view('facultydashboard',['data'=>$data]);
    }
    function question(Request $req){
        $data = DB::table('questions_bank')->get();
        return view('question',['data'=>$data]);
    }

    function report(Request $req){
        $data =DB::select("select score.sid,score.regno,score.expid,score.score,score.staff_score,score.total,score.pdf,score.created_at,score.updated_at from(select expid from experiments where empno='".session('fac')."')y,score where y.expid=score.expid");
        return view('report',['data'=>$data]);
    }

    function reportupdate(Request $req){
        $sid=$req->get('sid1');
        $regno=$req->get('regno');
        $score=$req->get('score');
        $staff_score=$req->get('staffscore');
        $total=$score+ $staff_score;
        $update =DB::table('score')->where('sid', $sid)->update( ['score'=>$score,'staff_score'=>$staff_score,'total'=>$total]); 
        $data =DB::select("select score.sid,score.regno,score.expid,score.score,score.staff_score,score.total,score.pdf,score.created_at,score.updated_at from(select expid from experiments where empno='".session('fac')."')y,score where y.expid=score.expid");
        return view('report',['data'=>$data]);
    }

    function reportdelete(Request $req){

        $sid=$req->get('sid');
        DB::delete('delete from score where sid=?',[$sid]);
        $data = DB::table('sid')->get();
        return view('report',['data'=>$data]);
    }

    public function questions(Request $req)
    {
        $exp=$req->experid;
        if($exp==1)
        {$expid='exp001';
        $data = DB::select("select * FROM questions_bank WHERE expid='".$expid."' ORDER BY RAND() LIMIT 5  ");
        return view('exp',['data'=>$data]);}
        else if($exp==2){$expid='exp002';
        $data = DB::select("select * FROM questions_bank WHERE expid='".$expid."' ORDER BY RAND() LIMIT 5  ");
        return view('exp1',['data'=>$data]);}
        else if($exp==3){$expid='exp002';
        $data = DB::select("select * FROM questions_bank WHERE expid='".$expid."' ORDER BY RAND() LIMIT 5  ");
        return view('exp2',['data'=>$data]);}
        else if($exp==4){$expid='exp004';
            $data = DB::select("select * FROM questions_bank WHERE expid='".$expid."' ORDER BY RAND() LIMIT 5  ");
            return view('exp3',['data'=>$data]);}
        else{return view('userdash');}
       
    }
    public function insert(Request $req)
    {
        $us=new User;
        $us->regno=$req->regno;
        $us->expid=$req->expid;
        $us->score=$req->score;
        $us->staff_score=0;
        $us->total=$req->score;
     
        $pdfName =  time().'.'.$req->pdf->extension();  
        $req->pdf->move(public_path('pdf'), $pdfName);
        $us->pdf=$pdfName;
        $us->save();
          
        return view('userdash');
        
    }
    public function profile(Request $req)
    {
        $data=DB::table('score')->select('*')->where('regno','=',session('regno'))->get();
        return view('profileview',['data'=>$data]);
    }
    public function index(Request $req)
     {
         if($req->session()->has('data'))
         {
            return redirect()->back();
         }
         else{return view('mainlogin');}
     }
     public function stude(Request $req)
     {
        $data = DB::table('students')->get();
        return view('admindashboard',['data'=>$data]);
     }
}
