<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateStudentsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('students', function (Blueprint $table) {
           $table->bigInteger('regno')->primary();
           $table->string('name');
           $table->string('course');
           $table->string('year');
           $table->string('stream');
           $table->string('email');
           $table->BigInteger('phoneno');
           $table->string('pswd');
          });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('students');
    }
}
