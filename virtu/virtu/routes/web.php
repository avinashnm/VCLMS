<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/
Route::get('/','Controller@index');
/*Route::get('/', function () {
    return view('mainlogin');
});*/

Route::get('logout', function () {
    session()->flush();
    return view('mainlogin');
});
Route::get('/register', function () {
    return view('studentregister');
});

Route::Post('/stud','Controller@logincheck');
Route::get('/stud1','Controller@stude');

Route::get('/fac','Controller@faculty');
Route::get('/exp1','Controller@facexp');

Route::get('ques','Controller@question');
   
Route::get('rep','Controller@report');

Route::post('experimentload','Controller@loads');
Route::post('facregister','Controller@facregister');
Route::post('questionload','Controller@questionload');
Route::post('studentregister','Controller@studentregister');
Route::post('experimentupdate','Controller@experimentupdate');
Route::post('experimentdelete','Controller@experimentdelete');
Route::post('studentupdate','Controller@studentupdate');
Route::post('studentdelete','Controller@studentdelete');
Route::post('facultyupdate','Controller@facultyupdate');
Route::post('facultydelete','Controller@facultydelete');
Route::post('questionupdate','Controller@questionupdate');
Route::post('questiondelete','Controller@questiondelete');
Route::post('reportupdate','Controller@reportupdate');
Route::post('reportdelete','Controller@reportdelete');

//userdash
Route::get('userdash',function () {
    return view('userdash');
});
Route::get('/exp/{experid}','Controller@questions');
Route::post('/reg','Controller@register');
Route::get('/form','Controller@insert');
Route::post('/form','Controller@insert');

Route::get('sample',function () {
    return view('strengthexperiment');
});
Route::get('sample1',function () {
    return view('strongelectro');
});
Route::get('sample2',function () {
    return view('weakelectro');
});
Route::get('sample3',function () {
    return view('rastmethod');
});
Route::get('/profile','Controller@profile' );